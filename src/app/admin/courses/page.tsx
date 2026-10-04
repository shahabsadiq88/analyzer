import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BookOpen, Plus, ChevronRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Courses — Admin' }

export default async function AdminCoursesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  const courses = await prisma.course.findMany({
    include: {
      subjects: {
        include: {
          chapters: {
            include: {
              topics: { select: { id: true } },
              lectures: { select: { id: true, isPublished: true } },
            },
          },
          _count: { select: { questions: true } },
        },
        orderBy: { order: 'asc' },
      },
      enrollments: { where: { isActive: true }, select: { id: true } },
      _count: { select: { tests: true } },
    },
    orderBy: { order: 'asc' },
  })

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'white', marginBottom: '0.25rem' }}>Courses</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{courses.length} courses configured</p>
        </div>
        <Link href="/admin/courses/new" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.625rem 1.25rem', borderRadius: 10,
          background: 'linear-gradient(135deg, #3366ff, #6644ff)',
          color: 'white', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
          boxShadow: '0 4px 15px rgba(51,102,255,0.3)',
        }}>
          <Plus size={16} /> New Course
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {courses.map(course => {
          const totalLectures = course.subjects.reduce((s, subj) =>
            s + subj.chapters.reduce((cs, ch) => cs + ch.lectures.length, 0), 0)
          const publishedLectures = course.subjects.reduce((s, subj) =>
            s + subj.chapters.reduce((cs, ch) => cs + ch.lectures.filter(l => l.isPublished).length, 0), 0)
          const totalQuestions = course.subjects.reduce((s, subj) => s + subj._count.questions, 0)

          return (
            <div key={course.id} style={{
              background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, overflow: 'hidden',
            }}>
              {/* Course header */}
              <div style={{
                padding: '1.25rem 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'linear-gradient(135deg, #3366ff, #6644ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <BookOpen size={20} color="white" />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '1.0625rem', marginBottom: '0.125rem' }}>
                      {course.name}
                    </h2>
                    <div style={{ display: 'flex', gap: '1rem', color: '#64748b', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                      <span>{course.subjects.length} subjects</span>
                      <span>{publishedLectures}/{totalLectures} lectures published</span>
                      <span>{totalQuestions} questions</span>
                      <span>{course.enrollments.length} students enrolled</span>
                      <span>{course._count.tests} tests</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{
                    padding: '0.2rem 0.625rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600,
                    background: course.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: course.isActive ? '#10b981' : '#ef4444',
                  }}>
                    {course.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Link href={`/admin/courses/${course.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.4rem 0.875rem', borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#94a3b8', textDecoration: 'none', fontSize: '0.8125rem',
                  }}>
                    Manage <ChevronRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Subjects grid */}
              <div style={{ padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
                {course.subjects.map(subj => {
                  const chapters = subj.chapters.length
                  const lectures = subj.chapters.reduce((s, ch) => s + ch.lectures.length, 0)
                  return (
                    <Link key={subj.id} href={`/admin/courses/${course.id}/subjects/${subj.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        padding: '0.5rem 0.875rem', borderRadius: 8,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                        cursor: 'pointer',
                      }}>
                        <div style={{ color: 'white', fontSize: '0.8125rem', fontWeight: 600 }}>{subj.name}</div>
                        <div style={{ color: '#475569', fontSize: '0.6875rem', marginTop: 2 }}>
                          {chapters} chapters · {lectures} lectures · {subj._count.questions} MCQs
                        </div>
                      </div>
                    </Link>
                  )
                })}
                <Link href={`/admin/courses/${course.id}/subjects/new`} style={{
                  padding: '0.5rem 0.875rem', borderRadius: 8,
                  background: 'transparent', border: '1px dashed rgba(51,102,255,0.3)',
                  color: '#3366ff', textDecoration: 'none', fontSize: '0.8125rem',
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                }}>
                  <Plus size={13} /> Add Subject
                </Link>
              </div>
            </div>
          )
        })}

        {courses.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            background: '#1e293b', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16,
          }}>
            <BookOpen size={40} color="#334155" style={{ margin: '0 auto 1rem' }} />
            <div style={{ color: 'white', fontWeight: 600, marginBottom: '0.5rem' }}>No courses yet</div>
            <div style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Create your first course to get started.</div>
            <Link href="/admin/courses/new" style={{
              padding: '0.625rem 1.5rem', borderRadius: 10,
              background: 'linear-gradient(135deg, #3366ff, #6644ff)',
              color: 'white', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
            }}>
              Create Course
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
