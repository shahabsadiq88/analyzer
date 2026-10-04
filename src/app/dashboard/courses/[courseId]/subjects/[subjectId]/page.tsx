import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ChevronRight, BookOpen, Play, CheckCircle, Lock } from 'lucide-react'
import Link from 'next/link'

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ courseId: string; subjectId: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const { courseId, subjectId } = await params

  // Verify enrollment
  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } })
  if (!profile) redirect('/dashboard')

  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId: profile.id } },
  })
  if (!enrollment || !enrollment.isActive) redirect('/dashboard/courses')

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      course: { select: { id: true, name: true } },
      chapters: {
        where: { isActive: true },
        include: {
          lectures: {
            where: { isPublished: true },
            orderBy: { order: 'asc' },
          },
          topics: { orderBy: { order: 'asc' }, select: { id: true, name: true } },
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!subject || subject.course.id !== courseId) notFound()

  // Get completed lectures
  const completions = await prisma.lectureCompletion.findMany({
    where: {
      studentId: profile.id,
      lectureId: { in: subject.chapters.flatMap(ch => ch.lectures.map(l => l.id)) },
    },
    select: { lectureId: true },
  })
  const completedSet = new Set(completions.map(c => c.lectureId))

  const totalLectures = subject.chapters.reduce((s, ch) => s + ch.lectures.length, 0)
  const completedCount = completions.length
  const progress = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link href="/dashboard/courses" style={{ color: '#475569', fontSize: '0.8125rem', textDecoration: 'none' }}>My Courses</Link>
        <ChevronRight size={12} color="#334155" />
        <Link href={`/dashboard/courses/${courseId}`} style={{ color: '#475569', fontSize: '0.8125rem', textDecoration: 'none' }}>{subject.course.name}</Link>
        <ChevronRight size={12} color="#334155" />
        <span style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>{subject.name}</span>
      </div>

      {/* Subject header */}
      <div style={{
        background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem',
      }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'white', marginBottom: '0.5rem' }}>
          {subject.name}
        </h1>
        {subject.description && (
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>{subject.description}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.8125rem' }}>
            {completedCount}/{totalLectures} lectures completed
          </div>
          <div style={{ color: '#7ca3ff', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem' }}>
            {progress}%
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: '0.5rem', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, width: `${progress}%`, background: 'linear-gradient(90deg, #3366ff, #6644ff)', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Chapters & Lectures */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {subject.chapters.map((chapter, ci) => (
          <div key={chapter.id} style={{
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: chapter.lectures.length ? '1px solid rgba(255,255,255,0.06)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: 'rgba(51,102,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: '#7ca3ff',
              }}>
                {ci + 1}
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem' }}>{chapter.name}</div>
                <div style={{ color: '#475569', fontSize: '0.75rem' }}>{chapter.lectures.length} lectures</div>
              </div>
            </div>

            {chapter.lectures.map((lecture, li) => {
              const done = completedSet.has(lecture.id)
              return (
                <Link key={lecture.id} href={`/dashboard/courses/${courseId}/subjects/${subjectId}/lectures/${lecture.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.875rem 1.25rem',
                    borderBottom: li < chapter.lectures.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    transition: 'background 0.15s', cursor: 'pointer',
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: done ? 'rgba(16,185,129,0.15)' : 'rgba(51,102,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {done
                        ? <CheckCircle size={16} color="#10b981" />
                        : <Play size={14} color="#7ca3ff" style={{ marginLeft: 2 }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: done ? '#64748b' : 'white', fontWeight: 500, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lecture.title}
                      </div>
                      {lecture.description && (
                        <div style={{ color: '#475569', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lecture.description}
                        </div>
                      )}
                    </div>
                    {lecture.videoDuration && (
                      <div style={{ color: '#475569', fontSize: '0.75rem', flexShrink: 0 }}>
                        {Math.floor(lecture.videoDuration / 60)}m
                      </div>
                    )}
                    <ChevronRight size={14} color="#334155" />
                  </div>
                </Link>
              )
            })}

            {chapter.lectures.length === 0 && (
              <div style={{ padding: '1rem 1.25rem', color: '#334155', fontSize: '0.8125rem' }}>
                No published lectures in this chapter yet.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
