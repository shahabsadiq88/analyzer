import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Plus, BarChart3, Clock, Users, Play, Calendar, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Tests — Admin' }

export default async function AdminTestsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  const tests = await prisma.test.findMany({
    include: {
      course: { select: { name: true } },
      _count: { select: { testQuestions: true, attempts: true } },
      attempts: {
        where: { status: 'SUBMITTED' },
        select: { result: { select: { isPassed: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text)', marginBottom: '0.25rem' }}>Tests</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{tests.length} tests created</p>
        </div>
        <Link href="/admin/tests/new" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.625rem 1.25rem', borderRadius: 10,
          background: 'linear-gradient(135deg, #3366ff, #6644ff)',
          color: 'white', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
          boxShadow: '0 4px 15px rgba(51,102,255,0.3)',
        }}>
          <Plus size={16} /> Create Test
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {tests.map(test => {
          const passRate = test.attempts.length > 0
            ? Math.round((test.attempts.filter(a => a.result?.isPassed).length / test.attempts.length) * 100)
            : 0

          return (
            <div key={test.id} style={{
              background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {test.title}
                  </h3>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{test.course?.name || 'All Courses'}</div>
                </div>
                <span style={{
                  padding: '0.2rem 0.625rem', borderRadius: 9999, fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0,
                  background: test.isPublished ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                  color: test.isPublished ? '#10b981' : '#f59e0b',
                }}>
                  {test.isPublished ? 'PUBLISHED' : 'DRAFT'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <BarChart3 size={14} /> Questions
                  </div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9375rem' }}>{test._count.testQuestions}</div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <Clock size={14} /> Duration
                  </div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9375rem' }}>{test.durationMinutes} min</div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <Users size={14} /> Attempts
                  </div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9375rem' }}>{test._count.attempts}</div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <CheckCircle size={14} /> Pass Rate
                  </div>
                  <div style={{ color: test.attempts.length > 0 ? (passRate >= 50 ? '#10b981' : '#ef4444') : 'white', fontWeight: 600, fontSize: '0.9375rem' }}>
                    {test.attempts.length > 0 ? `${passRate}%` : '—'}
                  </div>
                </div>
              </div>

              {test.type === 'SCHEDULED' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.75rem', marginBottom: '1.25rem' }}>
                  <Calendar size={14} />
                  {test.windowStart ? formatDate(test.windowStart, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No start date'}
                  {' → '}
                  {test.windowEnd ? formatDate(test.windowEnd, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No end date'}
                </div>
              )}

              <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                <Link href={`/admin/tests/${test.id}`} style={{
                  flex: 1, padding: '0.625rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)', color: '#e2e8f0', textDecoration: 'none', textAlign: 'center',
                  fontSize: '0.8125rem', fontWeight: 600, transition: 'background 0.15s',
                }}>
                  Manage Test
                </Link>
                {test.isPublished && (
                  <Link href={`/admin/tests/${test.id}/results`} style={{
                    flex: 1, padding: '0.625rem', borderRadius: 8, border: 'none',
                    background: 'rgba(51,102,255,0.15)', color: '#7ca3ff', textDecoration: 'none', textAlign: 'center',
                    fontSize: '0.8125rem', fontWeight: 600, transition: 'background 0.15s',
                  }}>
                    View Analytics
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {tests.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#1e293b', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16 }}>
          <BarChart3 size={40} color="#334155" style={{ margin: '0 auto 1rem' }} />
          <div style={{ color: 'white', fontWeight: 600, marginBottom: '0.5rem' }}>No tests yet</div>
          <div style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Build your first exam to start assessing students.</div>
          <Link href="/admin/tests/new" style={{
            padding: '0.625rem 1.5rem', borderRadius: 10,
            background: 'linear-gradient(135deg, #3366ff, #6644ff)',
            color: 'white', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
          }}>
            Create Test
          </Link>
        </div>
      )}
    </div>
  )
}
