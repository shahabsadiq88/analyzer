import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guards'
import { prisma } from '@/lib/prisma'
import { createTestSchema } from '@/lib/validation'
import { auditLog } from '@/lib/exam-helpers'
import { AuditAction } from '@prisma/client'

export async function GET(req: Request) {
  const { session, error } = await requireAdmin()
  if (error) return error

  const tests = await prisma.test.findMany({
    include: {
      course: { select: { name: true } },
      _count: { select: { testQuestions: true, attempts: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ tests })
}

export async function POST(req: Request) {
  const { session, error } = await requireAdmin()
  if (error) return error

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = createTestSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 422 })
  }

  const { questionIds, ...testData } = result.data

  // Verify all question IDs exist
  const existingQuestions = await prisma.question.findMany({
    where: { id: { in: questionIds }, deletedAt: null },
    select: { id: true },
  })
  if (existingQuestions.length !== questionIds.length) {
    return NextResponse.json({ error: 'One or more question IDs are invalid' }, { status: 422 })
  }

  const test = await prisma.test.create({
    data: {
      ...testData,
      isPublished: false, // Always start as draft
      windowStart: testData.windowStart ? new Date(testData.windowStart) : null,
      windowEnd: testData.windowEnd ? new Date(testData.windowEnd) : null,
      testQuestions: {
        create: questionIds.map((qId, i) => ({ questionId: qId, order: i })),
      },
    },
    include: { _count: { select: { testQuestions: true } } },
  })

  await auditLog({
    actorId: session!.user.id,
    action: AuditAction.CREATE_TEST,
    entityType: 'Test',
    entityId: test.id,
    newValue: { title: testData.title, type: testData.type, questionCount: questionIds.length },
  })

  return NextResponse.json(test, { status: 201 })
}
