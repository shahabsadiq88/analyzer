import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Trophy, XCircle, CheckCircle, BarChart3, Clock, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'My Results' }

export default async function ResultsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } })
  if (!profile) redirect('/dashboard')

  const results = await prisma.result.findMany({
    where: { studentId: profile.id },
    include: {
      attempt: {
        include: {
          test: { select: { title: true, type: true, durationMinutes: true } },
        },
      },
    },
    orderBy: { calculatedAt: 'desc' },
  })

  const totalTests = results.length
  const passed = results.filter(r => r.isPassed).length
  const avgPct = totalTests > 0
    ? results.reduce((sum, r) => sum + Number(r.percentage), 0) / totalTests
    : 0

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'white', marginBottom: '0.25rem' }}>
          My Results
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{totalTests} test{totalTests !== 1 ? 's' : ''} completed</p>
      </div>

      {/* Summary stats */}
      {totalTests > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem',
        }}>
          {[
            { label: 'Tests Taken', value: totalTests, icon: BookOpen, color: '#7ca3ff' },
            { label: 'Pass Rate', value: `${totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0}%`, icon: Trophy, color: '#10b981' },
            { label: 'Avg Score', value: `${avgPct.toFixed(1)}%`, icon: BarChart3, color: '#f59e0b' },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} style={{
                background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={s.color} />
                </div>
                <div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'white', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.2rem' }}>{s.label}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Results list */}
      {results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
          <BarChart3 size={40} color="#334155" style={{ margin: '0 auto 1rem' }} />
          <div style={{ color: 'white', fontWeight: 600, marginBottom: '0.5rem' }}>No results yet</div>
          <div style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Complete a test to see your results here.</div>
          <Link href="/dashboard/tests" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.625rem 1.25rem', borderRadius: 10,
            background: 'linear-gradient(135deg, #3366ff, #6644ff)',
            color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
          }}>
            Browse Tests
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {results.map(result => {
            const test = result.attempt.test
            const pct = Number(result.percentage)
            const totalQ = result.correctCount + result.wrongCount + result.skippedCount

            return (
              <div key={result.id} style={{
                background: '#1e293b',
                border: `1px solid ${result.isPassed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.10)'}`,
                borderRadius: 14, padding: '1.25rem',
                display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
              }}>
                {/* Pass/Fail icon */}
                <div style={{ flexShrink: 0 }}>
                  {result.isPassed
                    ? <Trophy size={28} color="#10b981" />
                    : <XCircle size={28} color="#ef4444" />
                  }
                </div>

                {/* Test info */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.2rem' }}>
                    {test.title}
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} />
                      {formatDate(result.calculatedAt, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{
                      padding: '0.1rem 0.5rem', borderRadius: 6,
                      background: test.type === 'PRACTICE' ? 'rgba(124,163,255,0.1)' : 'rgba(245,158,11,0.1)',
                      color: test.type === 'PRACTICE' ? '#7ca3ff' : '#f59e0b',
                      fontSize: '0.6875rem', fontWeight: 600,
                    }}>
                      {test.type === 'PRACTICE' ? 'Practice' : 'Scheduled'}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '1.5rem', flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.375rem',
                      color: pct >= 50 ? '#10b981' : '#ef4444', lineHeight: 1,
                    }}>
                      {pct.toFixed(0)}%
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.6875rem', marginTop: '0.15rem' }}>Score</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'white', lineHeight: 1 }}>
                      {result.correctCount}/{totalQ}
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.6875rem', marginTop: '0.15rem' }}>Correct</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', lineHeight: 1,
                      color: result.isPassed ? '#10b981' : '#ef4444',
                    }}>
                      {result.isPassed ? 'PASS' : 'FAIL'}
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.6875rem', marginTop: '0.15rem' }}>Result</div>
                  </div>
                </div>

                {/* View button */}
                <Link href={`/results/${result.attemptId}`} style={{
                  padding: '0.5rem 1.125rem', borderRadius: 8, flexShrink: 0,
                  background: 'rgba(51,102,255,0.12)', color: '#7ca3ff',
                  textDecoration: 'none', fontWeight: 600, fontSize: '0.8125rem',
                  border: '1px solid rgba(51,102,255,0.2)',
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                }}>
                  <CheckCircle size={13} /> View Details
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
