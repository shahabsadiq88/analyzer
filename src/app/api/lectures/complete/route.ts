import { NextResponse } from 'next/server'
import { requireStudent } from '@/lib/auth-guards'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({ lectureId: z.string().cuid() })

export async function POST(req: Request) {
  const { session, error } = await requireStudent()
  if (error) return error

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Invalid lectureId' }, { status: 422 })

  const { lectureId } = result.data

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session!.user.id } })
  if (!profile) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })

  // Verify lecture exists and student is enrolled in the course
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId, isPublished: true },
    include: { chapter: { include: { subject: { include: { course: true } } } } },
  })
  if (!lecture) return NextResponse.json({ error: 'Lecture not found' }, { status: 404 })

  const courseId = lecture.chapter.subject.course.id
  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId: profile.id } },
  })
  if (!enrollment?.isActive) return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })

  // Upsert completion (idempotent — safe to call multiple times)
  await prisma.lectureCompletion.upsert({
    where: { lectureId_studentId: { lectureId, studentId: profile.id } },
    create: { lectureId, studentId: profile.id },
    update: {},
  })

  return NextResponse.json({ ok: true })
}
