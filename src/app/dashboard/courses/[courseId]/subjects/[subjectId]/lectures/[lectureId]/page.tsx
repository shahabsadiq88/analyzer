import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import LecturePlayer from '@/components/LecturePlayer'

export async function generateMetadata({ params }: { params: Promise<{ lectureId: string }> }) {
  const { lectureId } = await params
  const lecture = await prisma.lecture.findUnique({ where: { id: lectureId }, select: { title: true } })
  return { title: lecture?.title || 'Lecture' }
}

export default async function LecturePage({
  params,
}: {
  params: Promise<{ courseId: string; subjectId: string; lectureId: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const { courseId, subjectId, lectureId } = await params

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } })
  if (!profile) redirect('/dashboard')

  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId: profile.id } },
  })
  if (!enrollment?.isActive) redirect('/dashboard/courses')

  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId, isPublished: true },
    include: {
      chapter: {
        include: {
          subject: {
            include: { course: { select: { id: true, name: true } } },
          },
          lectures: {
            where: { isPublished: true },
            orderBy: { order: 'asc' },
            select: { id: true, title: true, order: true },
          },
        },
      },
    },
  })

  if (!lecture || lecture.chapter.subject.course.id !== courseId) notFound()

  const allLectures = lecture.chapter.lectures
  const currentIndex = allLectures.findIndex(l => l.id === lectureId)
  const prevLecture = currentIndex > 0 ? allLectures[currentIndex - 1] : null
  const nextLecture = currentIndex < allLectures.length - 1 ? allLectures[currentIndex + 1] : null

  const completion = await prisma.lectureCompletion.findUnique({
    where: { lectureId_studentId: { lectureId, studentId: profile.id } },
  })

  return (
    <LecturePlayer
      lecture={lecture}
      subjectId={subjectId}
      courseId={courseId}
      prevLecture={prevLecture}
      nextLecture={nextLecture}
      isCompleted={!!completion}
    />
  )
}
