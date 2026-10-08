import { prisma } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

interface AuditParams {
  actorId?: string
  targetUserId?: string
  action: AuditAction
  entityType: string
  entityId: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  reason?: string
  ipAddress?: string
}

/**
 * Write an audit log entry.
 * Failures are caught and logged to console — audit log issues must never crash the main operation.
 */
export async function auditLog(params: AuditParams): Promise<void> {
  try {
    // Cast to any to bypass complex Prisma union type — runtime fields are validated by DB constraints
    await prisma.auditLog.create({ data: params as any })
  } catch (error) {
    console.error('[AuditLog] Failed to write audit entry:', error, params)
  }
}

/**
 * Calculate scoring for an attempt.
 * IMPORTANT: This runs server-side only. Correct answers are never sent to the client.
 */
export async function calculateScore(attemptId: string): Promise<{
  totalMarks: number
  obtainedMarks: number
  percentage: number
  isPassed: boolean
  correctCount: number
  wrongCount: number
  skippedCount: number
  negativeMarks: number
  subjectBreakdown: Record<string, { correct: number; wrong: number; skipped: number; marks: number }>
}> {
  const attempt = await prisma.attempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: {
      test: true,
      questions: {
        include: {
          version: {
            include: {
              options: { select: { id: true, isCorrect: true } },
            },
          },
        },
      },
      answers: {
        include: {
          selectedOption: { select: { id: true, isCorrect: true } },
        },
      },
    },
  })

  const { test } = attempt
  const marksPerQ = Number(test.marksPerQuestion)
  const negativeMarkValue = Number(test.negativeMarkValue)
  const totalQuestions = attempt.questions.length
  const totalMarks = totalQuestions * marksPerQ

  let correctCount = 0
  let wrongCount = 0
  let skippedCount = 0
  let negativeMarks = 0
  let obtainedMarks = 0

  const subjectBreakdown: Record<string, { correct: number; wrong: number; skipped: number; marks: number }> = {}

  // Build answer map for quick lookup
  const answerMap = new Map(attempt.answers.map(a => [a.questionId, a]))

  for (const aq of attempt.questions) {
    const answer = answerMap.get(aq.questionId)
    const correctOptionId = aq.version.options.find(o => o.isCorrect)?.id

    // Get subject ID from question
    const question = await prisma.question.findUnique({
      where: { id: aq.questionId },
      select: { subjectId: true, subject: { select: { name: true } } },
    })
    const subjectKey = question?.subject?.name || 'Unknown'

    if (!subjectBreakdown[subjectKey]) {
      subjectBreakdown[subjectKey] = { correct: 0, wrong: 0, skipped: 0, marks: 0 }
    }

    if (!answer?.selectedOptionId) {
      // Skipped — no penalty
      skippedCount++
      subjectBreakdown[subjectKey].skipped++
    } else if (answer.selectedOptionId === correctOptionId) {
      // Correct
      correctCount++
      obtainedMarks += marksPerQ
      subjectBreakdown[subjectKey].correct++
      subjectBreakdown[subjectKey].marks += marksPerQ
    } else {
      // Wrong
      wrongCount++
      if (test.negativeMarking) {
        const deduction = marksPerQ * negativeMarkValue
        negativeMarks += deduction
        obtainedMarks -= deduction
        subjectBreakdown[subjectKey].marks -= deduction
      }
      subjectBreakdown[subjectKey].wrong++
    }
  }

  obtainedMarks = Math.max(0, obtainedMarks) // Never negative total
  const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0
  const isPassed = percentage >= Number(test.passPercentage)

  return {
    totalMarks,
    obtainedMarks,
    percentage: Math.round(percentage * 100) / 100,
    isPassed,
    correctCount,
    wrongCount,
    skippedCount,
    negativeMarks,
    subjectBreakdown,
  }
}

/**
 * Check if answers/explanations should be visible to the student now.
 */
export function isAnswerVisible(
  visibility: string,
  windowEnd: Date | null,
  submittedAt: Date | null
): boolean {
  const now = new Date()
  switch (visibility) {
    case 'IMMEDIATELY': return true
    case 'NEVER': return false
    case 'AFTER_WINDOW':
      if (!windowEnd) return true // Practice test
      return now > new Date(windowEnd)
    case 'MANUAL': return false // Admin must release manually
    default: return false
  }
}

/**
 * Get client-safe question data (strips correct answer flags during active attempt).
 * CRITICAL: This function enforces NFR-S5 / EX-22.
 */
export function sanitizeQuestionForClient(
  question: any,
  attemptStatus: string,
  answersVisible: boolean
) {
  if (attemptStatus === 'IN_PROGRESS') {
    // NEVER include correct answer info during active test
    return {
      ...question,
      options: question.options?.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        imageUrl: opt.imageUrl,
        order: opt.order,
        // isCorrect: OMITTED intentionally
        // explanation: OMITTED intentionally
      })),
      explanation: undefined, // Strip explanation
    }
  }

  if (!answersVisible) {
    // After submit but before visibility window — show options without correct flag
    return {
      ...question,
      options: question.options?.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        imageUrl: opt.imageUrl,
        order: opt.order,
      })),
      explanation: undefined,
    }
  }

  // Answers are visible — return full data
  return question
}

/**
 * Start or resume an exam attempt for a student.
 * Used directly by ExamPage (server component) and /api/exam/start (API route).
 * - PRACTICE tests allow retakes (unlimited practice attempts)
 * - SCHEDULED tests enforce maxAttempts limit
 * - Expired active attempts are auto-submitted
 * - Unique attemptNumber avoids constraint violations
 */
export async function startOrResumeAttempt({
  userId,
  testId,
}: {
  userId: string
  testId: string
}): Promise<{
  data?: any
  error?: string
  status?: number
}> {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } })
  if (!profile) return { error: 'Student profile not found', status: 404 }

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

  if (!test) return { error: 'Test not found or not published', status: 404 }

  const now = new Date()

  // Window check for scheduled tests
  if (test.type === 'SCHEDULED') {
    if (test.windowStart && now < new Date(test.windowStart)) {
      return { error: 'This test has not started yet', status: 403 }
    }
    if (test.windowEnd && now > new Date(test.windowEnd)) {
      return { error: 'This test window has closed', status: 403 }
    }
  }

  // Enrollment check
  if (test.courseId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { courseId_studentId: { courseId: test.courseId, studentId: profile.id } },
    })
    if (!enrollment?.isActive) {
      return { error: 'You are not enrolled in this course', status: 403 }
    }
  }

  // Check existing attempts
  const existingAttempts = await prisma.attempt.findMany({
    where: { testId, studentId: profile.id },
    orderBy: { serverStartTime: 'desc' },
  })

  const activeAttempt = existingAttempts.find(a => a.status === 'IN_PROGRESS')
  if (activeAttempt) {
    const deadline = activeAttempt.serverDeadline
    if (now >= deadline) {
      // Auto-submit expired attempt
      await prisma.attempt.update({
        where: { id: activeAttempt.id },
        data: { status: 'AUTO_SUBMITTED', submittedAt: deadline },
      })

      // Calculate score if needed
      try {
        const scoreData = await calculateScore(activeAttempt.id)
        await prisma.result.upsert({
          where: { attemptId: activeAttempt.id },
          update: {},
          create: {
            attemptId: activeAttempt.id,
            studentId: profile.id,
            totalMarks: scoreData.totalMarks,
            obtainedMarks: scoreData.obtainedMarks,
            percentage: scoreData.percentage,
            isPassed: scoreData.isPassed,
            correctCount: scoreData.correctCount,
            wrongCount: scoreData.wrongCount,
            skippedCount: scoreData.skippedCount,
            negativeMarks: scoreData.negativeMarks,
            subjectBreakdown: scoreData.subjectBreakdown as any,
          },
        })
      } catch (e) {
        console.error('Failed to calculate score for auto-submitted expired attempt:', e)
      }
      // Continue to check if retake / new attempt is allowed
    } else {
      // Resume existing active attempt
      const remainingSeconds = Math.floor((deadline.getTime() - now.getTime()) / 1000)

      const attemptQuestions = await prisma.attemptQuestion.findMany({
        where: { attemptId: activeAttempt.id },
        include: {
          version: {
            include: { options: { orderBy: { order: 'asc' } } },
          },
        },
        orderBy: { position: 'asc' },
      })

      const attemptAnswers = await prisma.attemptAnswer.findMany({
        where: { attemptId: activeAttempt.id },
      })

      const resumedQuestions = attemptQuestions.map((aq, i) => {
        const orderedOpts = aq.optionOrder
          .map(oid => aq.version.options.find(o => o.id === oid))
          .filter(Boolean)
          .map(o => ({ id: o!.id, text: o!.text, order: o!.order }))
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

      const savedAnswers: Record<string, string | null> = {}
      for (const ans of attemptAnswers) {
        savedAnswers[ans.questionId] = ans.selectedOptionId
      }

      return {
        data: {
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
        },
      }
    }
  }

  // Max attempts check:
  // PRACTICE tests can be retaken freely (unlimited attempts)
  // SCHEDULED tests enforce maxAttempts limit
  const submittedCount = existingAttempts.filter(a => a.status === 'SUBMITTED' || a.status === 'AUTO_SUBMITTED').length
  if (test.type !== 'PRACTICE' && submittedCount >= test.maxAttempts) {
    return { error: `Maximum attempts (${test.maxAttempts}) reached for this test`, status: 403 }
  }

  // Prepare question list
  let questionList = test.testQuestions
    .map(tq => tq.question)
    .filter(q => q.versions && q.versions.length > 0)

  if (questionList.length === 0) {
    return { error: 'This test does not have any questions available yet', status: 400 }
  }

  if (test.randomizeQuestions) {
    for (let i = questionList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questionList[i], questionList[j]] = [questionList[j], questionList[i]]
    }
  }

  // Unique next attempt number
  const maxAttemptNumber = existingAttempts.reduce((max, a) => Math.max(max, a.attemptNumber || 0), 0)
  const nextAttemptNumber = maxAttemptNumber + 1

  const startedAt = new Date()
  const serverDeadline = new Date(startedAt.getTime() + test.durationMinutes * 60 * 1000)

  const attempt = await prisma.attempt.create({
    data: {
      testId,
      studentId: profile.id,
      attemptNumber: nextAttemptNumber,
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
    actorId: userId,
    action: AuditAction.START_ATTEMPT,
    entityType: 'Attempt',
    entityId: attempt.id,
    newValue: { testId, attemptNumber: attempt.attemptNumber },
  })

  // Build client-safe question list
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
      options: opts,
    }
  })

  const remainingSeconds = test.durationMinutes * 60

  return {
    data: {
      attemptId: attempt.id,
      testId,
      title: test.title,
      durationMinutes: test.durationMinutes,
      remainingSeconds,
      deadline: serverDeadline.toISOString(),
      totalQuestions: questionList.length,
      marksPerQuestion: Number(test.marksPerQuestion),
      negativeMarking: test.negativeMarking,
      negativeMarkValue: Number(test.negativeMarkValue),
      questions: clientQuestions,
      resumed: false,
    },
  }
}
