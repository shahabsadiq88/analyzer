import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guards'
import { prisma } from '@/lib/prisma'
import { createQuestionSchema } from '@/lib/validation'
import { auditLog } from '@/lib/exam-helpers'
import { AuditAction } from '@prisma/client'

// GET  /api/admin/questions  — list with filters
export async function GET(req: Request) {
  const { session, error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const subject = searchParams.get('subject') || ''
  const difficulty = searchParams.get('difficulty') || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '25'))

  const where: any = {
    deletedAt: null,
    ...(subject ? { subjectId: subject } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(q ? { versions: { some: { text: { contains: q, mode: 'insensitive' } } } } : {}),
  }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: {
        subject: { select: { name: true } },
        chapter: { select: { name: true } },
        versions: { orderBy: { versionNumber: 'desc' }, take: 1, include: { options: { orderBy: { order: 'asc' } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.question.count({ where }),
  ])

  return NextResponse.json({ questions, total, page, limit, pages: Math.ceil(total / limit) })
}

// POST /api/admin/questions — create new question with initial version
export async function POST(req: Request) {
  const { session, error } = await requireAdmin()
  if (error) return error

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = createQuestionSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, { status: 422 })
  }

  const { text, explanation, difficulty, subjectId, chapterId, topicId, source, tags, options } = result.data

  const question = await prisma.question.create({
    data: {
      text,
      subjectId: subjectId || null,
      chapterId: chapterId || null,
      topicId: topicId || null,
      difficulty,
      source: source || null,
      tags,
      versions: {
        create: {
          versionNumber: 1,
          text,
          explanation: explanation || null,
          options: {
            create: options.map((o, i) => ({
              text: o.text,
              isCorrect: o.isCorrect,
              order: o.order ?? i,
            })),
          },
        },
      },
    },
    include: {
      versions: { include: { options: true } },
    },
  })

  await auditLog({
    actorId: session!.user.id,
    action: AuditAction.CREATE_QUESTION,
    entityType: 'Question',
    entityId: question.id,
    newValue: { text, difficulty, subjectId },
  })

  return NextResponse.json(question, { status: 201 })
}
