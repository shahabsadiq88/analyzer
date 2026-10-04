import { NextResponse } from 'next/server'
import { requireStudent } from '@/lib/auth-guards'
import { prisma } from '@/lib/prisma'
import { auditLog, sanitizeQuestionForClient } from '@/lib/exam-helpers'
import { AuditAction } from '@prisma/client'

/**
 * POST /api/exam/start
 * Starts a new exam attempt for the authenticated student.
 * Enforces: max attempts, window check, single active attempt per test.
 * Returns: attempt ID + server deadline + randomized sanitized questions.
 * CRITICAL: correct answers are NEVER returned (EX-22, NFR-S5).
 */
export async function POST(req: Request) {
  const { session, error } = await requireStudent()
  if (error) return error

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { testId } = body as { testId?: string }
  if (!testId) return NextResponse.json({ error: 'testId required' }, { status: 400 })

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session!.user.id } })
  if (!profile) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })

  const test = await prisma.test.findUnique({
    where: { id: testId, isPublished: true },
    include: {
      testQuestions: {
        include: {
          question: {
            include: {
              subject: { select: { name: true } },
              versions: {
                orderBy: { versionNumber: 'desc' },
                take: 1,
                include: { options: { orderBy: { order: 'asc' } } },
              },
            },
          },
        },
      },
    },
  })

  if (!test) return NextResponse.json({ error: 'Test not found or not published' }, { status: 404 })

  const now = new Date()

  // Window check
  if (test.type === 'SCHEDULED') {
    if (test.windowStart && now < new Date(test.windowStart)) {
      return NextResponse.json({ error: 'This test has not started yet' }, { status: 403 })
    }
    if (test.windowEnd && now > new Date(test.windowEnd)) {
      return NextResponse.json({ error: 'This test window has closed' }, { status: 403 })
    }
  }

  // Enrollment check
  if (test.courseId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { courseId_studentId: { courseId: test.courseId, studentId: profile.id } },
    })
    if (!enrollment?.isActive) {
      return NextResponse.json({ error: 'You are not enrolled in this course' }, { status: 403 })
    }
  }

  // Check existing attempts
  const existingAttempts = await prisma.attempt.findMany({
    where: { testId, studentId: profile.id },
    orderBy: { serverStartTime: 'desc' },
  })

  const activeAttempt = existingAttempts.find(a => a.status === 'IN_PROGRESS')
  if (activeAttempt) {
    // Resume existing attempt — recalculate remaining time
    const deadline = activeAttempt.serverDeadline
    if (now >= deadline) {
      // Auto-submit expired attempt
      await prisma.attempt.update({
        where: { id: activeAttempt.id },
        data: { status: 'AUTO_SUBMITTED', submittedAt: deadline },
      })
      // Fall through to create a new attempt if allowed
    } else {
      const remainingSeconds = Math.floor((deadline.getTime() - now.getTime()) / 1000)

      // Load the student's existing question order (with version + options)
      const attemptQuestions = await prisma.attemptQuestion.findMany({
        where: { attemptId: activeAttempt.id },
        include: {
          version: {
            include: { options: { orderBy: { order: 'asc' } } },
          },
        },
        orderBy: { position: 'asc' },
      })

      // Also load any saved answers so the client can pre-populate
      const attemptAnswers = await prisma.attemptAnswer.findMany({
        where: { attemptId: activeAttempt.id },
      })

      // Rebuild client-safe question list in saved order
      const resumedQuestions = attemptQuestions.map((aq, i) => {
        // Restore option order from optionOrder array (original shuffle)
        const orderedOpts = aq.optionOrder
          .map(oid => aq.version.options.find(o => o.id === oid))
          .filter(Boolean)
          .map(o => ({ id: o!.id, text: o!.text, order: o!.order }))
        // Fallback if optionOrder is empty/stale
        const opts = orderedOpts.length === aq.version.options.length
          ? orderedOpts
          : aq.version.options.map(o => ({ id: o.id, text: o.text, order: o.order }))

        return {
          id: aq.questionId,
          versionId: aq.versionId,
          order: i,
          text: aq.version.text,
          imageUrl: aq.version.imageUrl,
          difficulty: null,
          subject: null,
          options: opts,
        }
      })

      // Build saved answers map for client pre-population
      const savedAnswers: Record<string, string | null> = {}
      for (const ans of attemptAnswers) {
        savedAnswers[ans.questionId] = ans.selectedOptionId
      }

      return NextResponse.json({
        attemptId: activeAttempt.id,
        testId,
        title: test.title,
        durationMinutes: test.durationMinutes,
        remainingSeconds,
        deadline: deadline.toISOString(),
        totalQuestions: resumedQuestions.length,
        marksPerQuestion: Number(test.marksPerQuestion),
        negativeMarking: test.negativeMarking,
        negativeMarkValue: Number(test.negativeMarkValue),
        questions: resumedQuestions,
        savedAnswers,
        resumed: true,
      })
    }
  }

  // Max attempts check
  const submittedCount = existingAttempts.filter(a => a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED').length
  if (submittedCount >= test.maxAttempts) {
    return NextResponse.json({ error: `Maximum attempts (${test.maxAttempts}) reached` }, { status: 403 })
  }

  // Prepare question list — randomize if enabled
  let questionList = test.testQuestions.map(tq => tq.question)
  if (test.randomizeQuestions) {
    // Fisher-Yates shuffle (server-side)
    for (let i = questionList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questionList[i], questionList[j]] = [questionList[j], questionList[i]]
    }
  }

  // Create attempt with per-question rows
  const startedAt = new Date()
  const serverDeadline = new Date(startedAt.getTime() + test.durationMinutes * 60 * 1000)
  const attempt = await prisma.attempt.create({
    data: {
      testId,
      studentId: profile.id,
      attemptNumber: submittedCount + 1,
      status: 'IN_PROGRESS',
      serverStartTime: startedAt,
      serverDeadline,
      questions: {
        create: questionList.map((q, i) => {
          const version = q.versions[0]
          return {
            questionId: q.id,
            versionId: version.id,
            position: i + 1,
            optionOrder: version.options.map(o => o.id),
          }
        }),
      },
    },
  })

  await auditLog({
    actorId: session!.user.id,
    action: AuditAction.START_ATTEMPT,
    entityType: 'Attempt',
    entityId: attempt.id,
    newValue: { testId, attemptNumber: attempt.attemptNumber },
  })

  // Build client-safe question payload — strip correct answers
  const clientQuestions = questionList.map((q, i) => {
    const version = q.versions[0]
    let opts = version.options.map(o => ({ id: o.id, text: o.text, order: o.order }))
    if (test.randomizeOptions) {
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]]
      }
    }
    return {
      id: q.id,
      versionId: version.id,
      order: i,
      text: version.text,
      imageUrl: version.imageUrl,
      difficulty: q.difficulty,
      subject: q.subject,
      options: opts, // isCorrect OMITTED intentionally (EX-22)
    }
  })

  const deadline = new Date(startedAt.getTime() + test.durationMinutes * 60 * 1000)
  const remainingSeconds = test.durationMinutes * 60

  return NextResponse.json({
    attemptId: attempt.id,
    testId,
    title: test.title,
    durationMinutes: test.durationMinutes,
    remainingSeconds,
    deadline: deadline.toISOString(), // Server deadline — client must trust this
    totalQuestions: questionList.length,
    marksPerQuestion: Number(test.marksPerQuestion),
    negativeMarking: test.negativeMarking,
    negativeMarkValue: Number(test.negativeMarkValue),
    questions: clientQuestions,
    resumed: false,
  })
}
