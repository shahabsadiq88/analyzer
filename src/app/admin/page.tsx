import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Users, BookOpen, ClipboardList, BarChart3, ChevronRight, Activity, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  // Fetch all stats in parallel
  const [
    totalStudents,
    totalTeachers,
    totalQuestions,
    totalTests,
    totalCourses,
    recentAuditLogs,
    activeAttempts,
    recentResults,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
    prisma.user.count({ where: { role: 'TEACHER', isActive: true } }),
    prisma.question.count({ where: { deletedAt: null } }),
    prisma.test.count({ where: { isPublished: true } }),
    prisma.course.count({ where: { isActive: true } }),
    prisma.auditLog.findMany({
      include: { actor: { select: { email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.attempt.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.result.findMany({
      include: {
        attempt: {
          include: {
            student: { select: { fullName: true } },
            test: { select: { title: true } },
          },
        },
      },
      orderBy: { calculatedAt: 'desc' },
      take: 6,
    }),
  ])

  const stats = [
    { label: 'Total Students', value: totalStudents, href: '/admin/students' },
    { label: 'Teachers', value: totalTeachers, href: '/admin/students' },
    { label: 'Questions', value: totalQuestions.toLocaleString(), href: '/admin/questions' },
    { label: 'Published Tests', value: totalTests, href: '/admin/tests' },
    { label: 'Active Courses', value: totalCourses, href: '/admin/courses' },
    { label: 'Live Attempts', value: activeAttempts, href: '/admin/tests' },
  ]

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--text)', marginBottom: '0.375rem' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          {formatDate(new Date(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--card-border)',
              borderRadius: 14, padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.15s, border-color 0.15s',
              cursor: 'pointer',
            }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text)', lineHeight: 1 }}>
                {stat.value}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Recent Results */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>Recent Results</h2>
            <Link href="/admin/tests" style={{ color: 'var(--brand-600)', fontSize: '0.8125rem', textDecoration: 'none', fontWeight: 600 }}>
              View all →
            </Link>
          </div>
          {recentResults.length ? recentResults.map(r => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.75rem 0', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--text)', fontSize: '0.8125rem', fontWeight: 600 }}>
                  {r.attempt.student.fullName}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                  {r.attempt.test.title}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: Number(r.percentage) >= 50 ? 'var(--success)' : 'var(--danger)' }}>
                  {Number(r.percentage).toFixed(0)}%
                </span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: Number(r.percentage) >= 50 ? 'var(--success)' : 'var(--danger)' }}>
                  {r.isPassed ? 'Passed' : 'Failed'}
                </span>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No results yet.</div>
          )}
        </div>

        {/* Audit Log */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--text)', fontSize: '1rem', marginBottom: '1.25rem' }}>Audit Log</h2>
          {recentAuditLogs.length ? recentAuditLogs.map(log => (
            <div key={log.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
              padding: '0.625rem 0', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'var(--brand-50)', color: 'var(--brand-600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6875rem', fontWeight: 700,
              }}>
                {log.actor?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: 'var(--text)', fontSize: '0.75rem', fontWeight: 500 }}>
                  <span>{log.actor?.email || 'System'}</span>
                  {' · '}
                  <span style={{ color: 'var(--brand-600)', fontWeight: 600, textTransform: 'lowercase', fontSize: '0.6875rem' }}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', marginTop: 2 }}>
                  {log.entityType} · {formatDate(log.createdAt, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No audit entries yet.</div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--text)', fontSize: '1rem', marginBottom: '1.25rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              { href: '/admin/students', label: 'Add New Student', desc: 'Enroll a new student account' },
              { href: '/admin/questions', label: 'Add Questions', desc: 'Create or import MCQs' },
              { href: '/admin/tests', label: 'Create Test', desc: 'Build a new scheduled or practice test' },
              { href: '/admin/courses', label: 'Manage Courses', desc: 'Edit subjects, chapters, and topics' },
            ].map(action => (
              <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '0.875rem 1rem', borderRadius: 10,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'border-color 0.15s',
                }}>
                  <div style={{ color: 'var(--text)', fontSize: '0.875rem', fontWeight: 600 }}>{action.label}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>{action.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
