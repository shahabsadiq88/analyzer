import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BookOpen, ClipboardList, BarChart3, Bell, ChevronRight, Play, Trophy, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDate, getGrade } from '@/lib/utils'

export const metadata = { title: 'Student Dashboard' }

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      enrollments: {
        where: { isActive: true },
        include: {
          course: {
            include: {
              subjects: { select: { id: true, name: true }, orderBy: { order: 'asc' } },
            },
          },
        },
      },
    },
  })

  const recentResults = await prisma.result.findMany({
    where: { studentId: studentProfile?.id },
    include: {
      attempt: { include: { test: { select: { title: true, type: true } } } },
    },
    orderBy: { calculatedAt: 'desc' },
    take: 5,
  })

  const upcomingTests = await prisma.test.findMany({
    where: {
      isPublished: true,
      type: 'SCHEDULED',
      windowEnd: { gte: new Date() },
      courseId: { in: studentProfile?.enrollments.map(e => e.courseId) },
    },
    orderBy: { windowStart: 'asc' },
    take: 3,
  })

  const announcements = await prisma.announcement.findMany({
    where: { isActive: true, expiresAt: { gte: new Date() } },
    orderBy: { publishedAt: 'desc' },
    take: 3,
  })

  const completedTests = recentResults.length
  const avgScore = recentResults.length
    ? Math.round(recentResults.reduce((s, r) => s + Number(r.percentage), 0) / recentResults.length)
    : 0
  const enrolledCourses = studentProfile?.enrollments.length || 0

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'white', marginBottom: '0.375rem',
        }}>
          Welcome back, {session.user.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>
          Keep up the momentum — your MDCAT goal is within reach.
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: BookOpen, label: 'Enrolled Courses', value: enrolledCourses, color: '#3366ff', bg: 'rgba(51,102,255,0.1)' },
          { icon: ClipboardList, label: 'Tests Taken', value: completedTests, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { icon: BarChart3, label: 'Avg Score', value: `${avgScore}%`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { icon: Trophy, label: 'Best Score', value: recentResults.length ? `${Math.max(...recentResults.map(r => Number(r.percentage)))}%` : '—', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} style={{
              background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '1.25rem',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: stat.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '0.875rem',
              }}>
                <Icon size={18} color={stat.color} />
              </div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.625rem', color: 'white', lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.375rem' }}>{stat.label}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* My Courses */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '1rem' }}>My Courses</h2>
            <Link href="/dashboard/courses" style={{ color: '#3366ff', fontSize: '0.8125rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {studentProfile?.enrollments.length ? studentProfile.enrollments.map(e => (
            <Link key={e.id} href={`/dashboard/courses/${e.courseId}`} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '0.875rem', borderRadius: 10,
                background: 'rgba(51,102,255,0.06)', border: '1px solid rgba(51,102,255,0.12)',
                marginBottom: '0.625rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: 'linear-gradient(135deg, #3366ff, #6644ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={16} color="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.course.name}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                    {e.course.subjects.length} subjects
                  </div>
                </div>
                <ChevronRight size={14} color="#475569" />
              </div>
            </Link>
          )) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#475569', fontSize: '0.875rem' }}>
              No courses yet. Contact your admin.
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '1rem' }}>Recent Results</h2>
            <Link href="/dashboard/results" style={{ color: '#3366ff', fontSize: '0.8125rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {recentResults.length ? recentResults.map(r => {
            const grade = getGrade(Number(r.percentage))
            return (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: 'white', fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                    {r.attempt.test.title}
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.6875rem' }}>
                    {formatDate(r.calculatedAt, { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: grade.color.replace('text-', '') === 'emerald-500' ? '#10b981' : grade.color.includes('blue') ? '#3b82f6' : grade.color.includes('amber') ? '#f59e0b' : '#ef4444' }}>
                    {Number(r.percentage).toFixed(0)}%
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#475569' }}>{grade.label}</span>
                </div>
              </div>
            )
          }) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#475569', fontSize: '0.875rem' }}>
              No results yet. Take a test!
            </div>
          )}
        </div>

        {/* Upcoming Tests */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '1rem' }}>Upcoming Tests</h2>
            <Link href="/dashboard/tests" style={{ color: '#3366ff', fontSize: '0.8125rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              All tests <ChevronRight size={14} />
            </Link>
          </div>
          {upcomingTests.length ? upcomingTests.map(t => (
            <div key={t.id} style={{
              padding: '0.875rem', borderRadius: 10,
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)',
              marginBottom: '0.625rem',
            }}>
              <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                {t.title}
              </div>
              <div style={{ display: 'flex', gap: '1rem', color: '#64748b', fontSize: '0.75rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> {t.durationMinutes} min
                </span>
                {t.windowStart && (
                  <span>{formatDate(t.windowStart, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#475569', fontSize: '0.875rem' }}>
              No upcoming scheduled tests.
            </div>
          )}
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Bell size={16} color="#f59e0b" />
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '1rem' }}>Announcements</h2>
            </div>
            {announcements.map(a => (
              <div key={a.id} style={{
                padding: '0.875rem', borderRadius: 10, marginBottom: '0.625rem',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{a.title}</div>
                <div style={{ color: '#64748b', fontSize: '0.8125rem', lineHeight: 1.5 }}>{a.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
