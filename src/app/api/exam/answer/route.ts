import { NextResponse } from 'next/server'
import { requireStudent } from '@/lib/auth-guards'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  attemptId: z.string().cuid(),
  questionId: z.string().cuid(),
  selectedOptionId: z.string().cuid().nullable(),
})

/**
 * POST /api/exam/answer
 * Autosave a single answer during an active attempt.
 * Validates: attempt belongs to student, attempt is IN_PROGRESS, not past deadline.
 * Idempotent — safe to call multiple times (upsert).
 * CRITICAL: does not reveal whether answer is correct (EX-22).
 */
export async function POST(req: Request) {
  const { session, error } = await requireStudent()
  if (error) return error

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 422 })

  const { attemptId, questionId, selectedOptionId } = result.data

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session!.user.id } })
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch attempt — verify ownership and status
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { test: { select: { durationMinutes: true } } },
  })

  if (!attempt || attempt.studentId !== profile.id) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  }

  if (attempt.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: 'Attempt is not in progress' }, { status: 409 })
  }

  // Server-side deadline check (EX-06: server is authoritative)
  const deadline = attempt.serverDeadline
  if (new Date() > deadline) {
    // Auto-submit
    await prisma.attempt.update({
      where: { id: attemptId },
      data: { status: 'AUTO_SUBMITTED', submittedAt: deadline },
    })
    return NextResponse.json({ error: 'Time expired. Attempt auto-submitted.', expired: true }, { status: 409 })
  }

  // Verify the question belongs to this attempt
  const aq = await prisma.attemptQuestion.findUnique({
    where: { attemptId_questionId: { attemptId, questionId } },
  })
  if (!aq) return NextResponse.json({ error: 'Question not part of this attempt' }, { status: 404 })

  // Verify option belongs to question (if provided)
  if (selectedOptionId) {
    const opt = await prisma.questionOption.findUnique({ where: { id: selectedOptionId } })
    if (!opt || opt.versionId !== aq.versionId) {
      return NextResponse.json({ error: 'Invalid option for this question' }, { status: 422 })
    }
  }

  // Upsert the answer (idempotent)
  await prisma.attemptAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: {
      attemptId,
      questionId,
      selectedOptionId,
    },
    update: {
      selectedOptionId,
    },
  })

  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() })
}
