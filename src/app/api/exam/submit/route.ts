import { NextResponse } from 'next/server'
import { requireStudent } from '@/lib/auth-guards'
import { prisma } from '@/lib/prisma'
import { calculateScore, auditLog } from '@/lib/exam-helpers'
import { AuditAction } from '@prisma/client'
import { z } from 'zod'

const schema = z.object({ attemptId: z.string().cuid() })

/**
 * POST /api/exam/submit
 * Submits an attempt, calculates score server-side, stores Result.
 * Idempotent — if already submitted, returns existing result.
 * Score is ALWAYS calculated on the server (EX-23, NFR-S5).
 */
export async function POST(req: Request) {
  const { session, error } = await requireStudent()
  if (error) return error

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 422 })

  const { attemptId } = result.data
  const profile = await prisma.studentProfile.findUnique({ where: { userId: session!.user.id } })
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { test: true, result: true },
  })

  if (!attempt || attempt.studentId !== profile.id) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  }

  // Already submitted — return existing result
  if (attempt.status === 'SUBMITTED' && attempt.result) {
    return NextResponse.json({
      attemptId,
      resultId: attempt.result.id,
      percentage: Number(attempt.result.percentage),
      isPassed: attempt.result.isPassed,
      alreadySubmitted: true,
    })
  }

  if (attempt.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: `Attempt is ${attempt.status}` }, { status: 409 })
  }

  const submittedAt = new Date()
  const deadline = attempt.serverDeadline
  const effectiveSubmittedAt = submittedAt > deadline ? deadline : submittedAt

  // Mark attempt as submitted first (prevents double-submit race condition)
  await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status: submittedAt > deadline ? 'AUTO_SUBMITTED' : 'SUBMITTED',
      submittedAt: effectiveSubmittedAt,
    },
  })

  // Calculate score server-side
  const scoreData = await calculateScore(attemptId)

  // Persist result
  const testResult = await prisma.result.create({
    data: {
      attemptId,
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

  await auditLog({
    actorId: session!.user.id,
    action: AuditAction.SUBMIT_ATTEMPT,
    entityType: 'Attempt',
    entityId: attemptId,
    newValue: {
      percentage: scoreData.percentage,
      isPassed: scoreData.isPassed,
      correct: scoreData.correctCount,
      wrong: scoreData.wrongCount,
      skipped: scoreData.skippedCount,
    },
  })

  return NextResponse.json({
    attemptId,
    resultId: testResult.id,
    percentage: scoreData.percentage,
    isPassed: scoreData.isPassed,
    correctCount: scoreData.correctCount,
    wrongCount: scoreData.wrongCount,
    skippedCount: scoreData.skippedCount,
    obtainedMarks: scoreData.obtainedMarks,
    totalMarks: scoreData.totalMarks,
    submittedAt: effectiveSubmittedAt.toISOString(),
  })
}
