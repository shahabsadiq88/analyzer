import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BookOpen, ChevronRight, Lock, Play } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'My Courses' }

export default async function StudentCoursesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      enrollments: {
        where: { isActive: true },
        include: {
          course: {
            include: {
              subjects: {
                include: {
                  chapters: {
                    include: {
                      lectures: { select: { id: true, isPublished: true } },
                    },
                  },
                  _count: { select: { questions: true } },
                },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      },
    },
  })

  const enrollments = profile?.enrollments || []

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'white', marginBottom: '0.25rem' }}>
          My Courses
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled</p>
      </div>

      {enrollments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <BookOpen size={40} color="#334155" style={{ margin: '0 auto 1rem' }} />
          <div style={{ color: 'white', fontWeight: 600, marginBottom: '0.5rem' }}>No courses yet</div>
          <div style={{ color: '#475569', fontSize: '0.875rem' }}>Contact your administrator to get enrolled in a course.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {enrollments.map(({ course }) => {
            const totalLectures = course.subjects.reduce((s, subj) =>
              s + subj.chapters.reduce((cs, ch) => cs + ch.lectures.filter(l => l.isPublished).length, 0), 0)
            const totalQuestions = course.subjects.reduce((s, subj) => s + subj._count.questions, 0)

            return (
              <div key={course.id} style={{
                background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, overflow: 'hidden',
              }}>
                {/* Course banner */}
                <div style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, rgba(51,102,255,0.12), rgba(102,68,255,0.08))',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.875rem' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'linear-gradient(135deg, #3366ff, #6644ff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(51,102,255,0.3)',
                    }}>
                      <BookOpen size={22} color="white" />
                    </div>
                    <div>
                      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '1.125rem' }}>
                        {course.name}
                      </h2>
                      {course.description && (
                        <p style={{ color: '#64748b', fontSize: '0.8125rem', marginTop: '0.125rem' }}>{course.description}</p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {[
                      [`${course.subjects.length}`, 'Subjects'],
                      [`${totalLectures}`, 'Lectures'],
                      [`${totalQuestions}`, 'Practice MCQs'],
                    ].map(([val, lbl]) => (
                      <div key={lbl}>
                        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#7ca3ff', fontSize: '1.25rem' }}>{val}</div>
                        <div style={{ color: '#475569', fontSize: '0.6875rem' }}>{lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subjects list */}
                <div style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                    Subjects
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {course.subjects.map(subj => {
                      const lectureCount = subj.chapters.reduce((s, ch) => s + ch.lectures.filter(l => l.isPublished).length, 0)
                      return (
                        <Link key={subj.id} href={`/dashboard/courses/${course.id}/subjects/${subj.id}`} style={{ textDecoration: 'none' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.75rem 1rem', borderRadius: 10,
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                background: subj.name === 'Biology' ? '#10b981' : subj.name === 'Chemistry' ? '#3366ff' : '#f59e0b',
                              }} />
                              <div>
                                <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>{subj.name}</div>
                                <div style={{ color: '#475569', fontSize: '0.75rem' }}>
                                  {subj.chapters.length} chapters · {lectureCount} lectures · {subj._count.questions} MCQs
                                </div>
                              </div>
                            </div>
                            <ChevronRight size={16} color="#334155" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
