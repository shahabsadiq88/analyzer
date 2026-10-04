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
    { label: 'Total Students', value: totalStudents, icon: Users, color: '#3366ff', bg: 'rgba(51,102,255,0.1)', href: '/admin/students' },
    { label: 'Teachers', value: totalTeachers, icon: Users, color: '#10b981', bg: 'rgba(16,185,129,0.1)', href: '/admin/students' },
    { label: 'Questions', value: totalQuestions.toLocaleString(), icon: ClipboardList, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', href: '/admin/questions' },
    { label: 'Published Tests', value: totalTests, icon: BarChart3, color: '#a855f7', bg: 'rgba(168,85,247,0.1)', href: '/admin/tests' },
    { label: 'Active Courses', value: totalCourses, icon: BookOpen, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', href: '/admin/courses' },
    { label: 'Live Attempts', value: activeAttempts, icon: Activity, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', href: '/admin/tests' },
  ]

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'white', marginBottom: '0.375rem' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>
          {formatDate(new Date(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: '1.25rem',
                transition: 'border-color 0.2s',
                cursor: 'pointer',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.875rem' }}>
                  <Icon size={18} color={stat.color} />
                </div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'white', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.375rem' }}>{stat.label}</div>
              </div>
            </Link>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Recent Results */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '1rem' }}>Recent Results</h2>
            <Link href="/admin/tests" style={{ color: '#3366ff', fontSize: '0.8125rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {recentResults.length ? recentResults.map(r => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '0.8125rem', fontWeight: 600 }}>
                  {r.attempt.student.fullName}
                </div>
                <div style={{ color: '#475569', fontSize: '0.6875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                  {r.attempt.test.title}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem', color: Number(r.percentage) >= 50 ? '#10b981' : '#ef4444' }}>
                  {Number(r.percentage).toFixed(0)}%
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.6875rem', color: Number(r.percentage) >= 50 ? '#10b981' : '#ef4444' }}>
                  {r.isPassed ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                  {r.isPassed ? 'Pass' : 'Fail'}
                </span>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#475569', fontSize: '0.875rem' }}>No results yet.</div>
          )}
        </div>

        {/* Audit Log */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Activity size={16} color="#f59e0b" />
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '1rem' }}>Audit Log</h2>
          </div>
          {recentAuditLogs.length ? recentAuditLogs.map(log => (
            <div key={log.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
              padding: '0.625rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(51,102,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.625rem', color: '#7ca3ff', fontWeight: 700,
              }}>
                {log.actor?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 500 }}>
                  <span style={{ color: 'white' }}>{log.actor?.email || 'System'}</span>
                  {' · '}
                  <span style={{ color: '#f59e0b', textTransform: 'lowercase', fontFamily: 'monospace', fontSize: '0.6875rem' }}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ color: '#475569', fontSize: '0.6875rem', marginTop: 2 }}>
                  {log.entityType} · {formatDate(log.createdAt, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#475569', fontSize: '0.875rem' }}>No audit entries yet.</div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '1rem', marginBottom: '1.25rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              { href: '/admin/students', label: 'Add New Student', desc: 'Enroll a new student account', color: '#3366ff' },
              { href: '/admin/questions', label: 'Add Questions', desc: 'Create or import MCQs', color: '#10b981' },
              { href: '/admin/tests', label: 'Create Test', desc: 'Build a new scheduled or practice test', color: '#f59e0b' },
              { href: '/admin/courses', label: 'Manage Courses', desc: 'Edit subjects, chapters, and topics', color: '#a855f7' },
            ].map(action => (
              <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.875rem 1rem', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer', transition: 'border-color 0.15s',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: action.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>{action.label}</div>
                    <div style={{ color: '#475569', fontSize: '0.75rem' }}>{action.desc}</div>
                  </div>
                  <ChevronRight size={14} color="#334155" style={{ marginLeft: 'auto' }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
