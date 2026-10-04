import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BookOpen, ClipboardList, CheckCircle, ChevronRight, Play } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Teacher Dashboard' }

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) redirect('/login')

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id }
  })

  // We could filter by subjects assigned to this teacher, but for MVP we'll show global stats or let them access all.
  // We'll show basic stats
  const [totalLectures, totalQuestions] = await Promise.all([
    prisma.lecture.count(),
    prisma.question.count({ where: { deletedAt: null } })
  ])

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'white', marginBottom: '0.375rem',
        }}>
          Welcome, {session.user.name?.split(' ')[0] || 'Teacher'} 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>
          Manage your lectures and question bank contributions.
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: Play, label: 'Total Lectures', value: totalLectures, color: '#3366ff', bg: 'rgba(51,102,255,0.1)' },
          { icon: ClipboardList, label: 'Questions Authored', value: totalQuestions, color: '#10b981', bg: 'rgba(16,185,129,0.1)' }, // Simplified for MVP
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
        {/* Quick Actions */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '1rem', marginBottom: '1.25rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <Link href="/teacher/lectures" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.875rem 1rem', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3366ff', flexShrink: 0 }} />
                <div>
                  <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>Manage Lectures</div>
                  <div style={{ color: '#475569', fontSize: '0.75rem' }}>Upload or edit video lectures</div>
                </div>
                <ChevronRight size={14} color="#334155" style={{ marginLeft: 'auto' }} />
              </div>
            </Link>
            <Link href="/teacher/questions" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.875rem 1rem', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                <div>
                  <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>Manage Questions</div>
                  <div style={{ color: '#475569', fontSize: '0.75rem' }}>Contribute MCQs to the bank</div>
                </div>
                <ChevronRight size={14} color="#334155" style={{ marginLeft: 'auto' }} />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
