import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ClipboardList, Clock, Play, Lock, CheckCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Tests' }

export default async function StudentTestsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } })
  if (!profile) redirect('/dashboard')

  const enrolledCourseIds = await prisma.enrollment.findMany({
    where: { studentId: profile.id, isActive: true },
    select: { courseId: true },
  }).then(e => e.map(x => x.courseId))

  const now = new Date()

  const [tests, myAttempts] = await Promise.all([
    prisma.test.findMany({
      where: { isPublished: true, courseId: { in: enrolledCourseIds } },
      include: { course: { select: { name: true } }, _count: { select: { testQuestions: true } } },
      orderBy: [{ type: 'asc' }, { windowStart: 'asc' }],
    }),
    prisma.attempt.findMany({
      where: { studentId: profile.id },
      include: { result: true },
      orderBy: { serverStartTime: 'desc' },
    }),
  ])

  const attemptMap = new Map(myAttempts.map(a => [a.testId, a]))

  const scheduled = tests.filter(t => t.type === 'SCHEDULED')
  const practice = tests.filter(t => t.type === 'PRACTICE')

  function TestCard({ test }: { test: typeof tests[0] }) {
    const attempt = attemptMap.get(test.id)
    const result = attempt?.result

    let status: 'not-started' | 'in-progress' | 'completed' | 'upcoming' | 'expired' = 'not-started'
    if (attempt?.status === 'IN_PROGRESS') status = 'in-progress'
    else if (attempt?.status === 'SUBMITTED' || attempt?.status === 'AUTO_SUBMITTED') status = 'completed'
    else if (test.windowStart && new Date(test.windowStart) > now) status = 'upcoming'
    else if (test.windowEnd && new Date(test.windowEnd) < now && !attempt) status = 'expired'

    const canStart = (status === 'not-started' || (test.type === 'PRACTICE' && status === 'completed'))
      && (!test.windowStart || new Date(test.windowStart) <= now)
      && (!test.windowEnd || new Date(test.windowEnd) >= now)

    const statusConfig = {
      'not-started': { label: 'Not Started', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
      'in-progress': { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
      'completed': { label: 'Completed', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
      'upcoming': { label: 'Upcoming', color: '#7ca3ff', bg: 'rgba(51,102,255,0.1)' },
      'expired': { label: 'Expired', color: '#475569', bg: 'rgba(71,85,105,0.1)' },
    }
    const sc = statusConfig[status]

    return (
      <div style={{
        background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: '1.25rem',
        opacity: status === 'expired' ? 0.6 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.875rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {test.title}
            </h3>
            <div style={{ color: '#475569', fontSize: '0.75rem' }}>
              {test.course?.name} · {test._count.testQuestions} questions · {test.durationMinutes} min
            </div>
          </div>
          <span style={{ padding: '0.2rem 0.625rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, background: sc.bg, color: sc.color, flexShrink: 0 }}>
            {sc.label}
          </span>
        </div>

        {/* Timing info */}
        {test.windowStart && (
          <div style={{ display: 'flex', gap: '0.75rem', color: '#64748b', fontSize: '0.75rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              Opens: {formatDate(test.windowStart, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
            {test.windowEnd && (
              <span>Closes: {formatDate(test.windowEnd, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
        )}

        {/* Result if completed */}
        {result && (
          <div style={{
            display: 'flex', gap: '1.5rem', padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: '0.875rem',
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.375rem', color: Number(result.percentage) >= 50 ? '#10b981' : '#ef4444' }}>
                {Number(result.percentage).toFixed(0)}%
              </div>
              <div style={{ color: '#475569', fontSize: '0.6875rem' }}>Score</div>
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'white' }}>
                {result.correctCount}/{result.correctCount + result.wrongCount + result.skippedCount}
              </div>
              <div style={{ color: '#475569', fontSize: '0.6875rem' }}>Correct</div>
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: result.isPassed ? '#10b981' : '#ef4444' }}>
                {result.isPassed ? 'PASS' : 'FAIL'}
              </div>
              <div style={{ color: '#475569', fontSize: '0.6875rem' }}>Result</div>
            </div>
          </div>
        )}

        {/* Action */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {canStart && (
            <Link href={`/exam/${test.id}`} style={{ textDecoration: 'none', flex: 1 }}>
              <button style={{
                width: '100%', padding: '0.625rem', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #3366ff, #6644ff)',
                color: 'white', fontWeight: 700, fontSize: '0.875rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(51,102,255,0.3)',
              }}>
                <Play size={14} />
                {test.type === 'PRACTICE' && status === 'completed' ? 'Retake' : 'Start Test'}
              </button>
            </Link>
          )}
          {status === 'in-progress' && (
            <Link href={`/exam/${test.id}`} style={{ textDecoration: 'none', flex: 1 }}>
              <button style={{
                width: '100%', padding: '0.625rem', borderRadius: 8, border: 'none',
                background: 'rgba(245,158,11,0.2)', color: '#f59e0b', fontWeight: 700, fontSize: '0.875rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}>
                <Play size={14} /> Resume Test
              </button>
            </Link>
          )}
          {result && (
            <Link href={`/results/${attempt?.id}`} style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '0.625rem 1rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent', color: '#64748b', fontWeight: 600, fontSize: '0.8125rem',
                cursor: 'pointer',
              }}>
                View Results
              </button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text)', marginBottom: '0.25rem' }}>Tests</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{tests.length} available tests</p>
      </div>

      {scheduled.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#94a3b8', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem' }}>
            📅 Scheduled Tests
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {scheduled.map(t => <TestCard key={t.id} test={t} />)}
          </div>
        </section>
      )}

      {practice.length > 0 && (
        <section>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#94a3b8', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem' }}>
            🏋️ Practice Tests
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {practice.map(t => <TestCard key={t.id} test={t} />)}
          </div>
        </section>
      )}

      {tests.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <ClipboardList size={40} color="#334155" style={{ margin: '0 auto 1rem' }} />
          <div style={{ color: 'white', fontWeight: 600, marginBottom: '0.5rem' }}>No tests available</div>
          <div style={{ color: '#475569', fontSize: '0.875rem' }}>Your teacher hasn't published any tests yet.</div>
        </div>
      )}
    </div>
  )
}
