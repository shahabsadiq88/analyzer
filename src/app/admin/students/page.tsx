import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Users, UserCheck, UserX, Search, Plus, Mail, Phone, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export const metadata = { title: 'Students — Admin' }

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  const { q = '', page = '1' } = await searchParams
  const pageNum = Math.max(1, parseInt(page))
  const limit = 20
  const skip = (pageNum - 1) * limit

  const where = {
    role: 'STUDENT' as const,
    ...(q ? {
      OR: [
        { email: { contains: q, mode: 'insensitive' as const } },
        { studentProfile: { fullName: { contains: q, mode: 'insensitive' as const } } },
      ],
    } : {}),
  }

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        studentProfile: {
          include: {
            enrollments: { include: { course: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'white', marginBottom: '0.25rem' }}>
            Students
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{total} registered students</p>
        </div>
        <Link href="/admin/students/new" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.625rem 1.25rem', borderRadius: 10,
          background: 'linear-gradient(135deg, #3366ff, #6644ff)',
          color: 'white', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
          boxShadow: '0 4px 15px rgba(51,102,255,0.3)',
        }}>
          <Plus size={16} /> Add Student
        </Link>
      </div>

      {/* Search */}
      <form method="GET" style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={16} color="#475569" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email..."
            style={{
              width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
              background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, color: 'white', fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>
      </form>

      {/* Table */}
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Student', 'Email', 'City', 'Enrolled In', 'Joined', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '1rem 1.25rem', textAlign: 'left',
                    color: '#475569', fontSize: '0.75rem', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length ? students.map((s, i) => (
                <tr key={s.id} style={{
                  borderBottom: i < students.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.15s',
                }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #3366ff, #6644ff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: 'white',
                      }}>
                        {s.studentProfile?.fullName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                          {s.studentProfile?.fullName || '—'}
                        </div>
                        <div style={{ color: '#475569', fontSize: '0.6875rem' }}>@{s.username || s.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontSize: '0.875rem' }}>{s.email}</td>
                  <td style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                    {s.studentProfile?.city || '—'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {s.studentProfile?.enrollments.length ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {s.studentProfile.enrollments.slice(0, 2).map(e => (
                          <span key={e.id} style={{
                            padding: '0.2rem 0.5rem', borderRadius: 6,
                            background: 'rgba(51,102,255,0.12)', color: '#7ca3ff',
                            fontSize: '0.6875rem', fontWeight: 500,
                          }}>{e.course.name}</span>
                        ))}
                        {s.studentProfile.enrollments.length > 2 && (
                          <span style={{ color: '#475569', fontSize: '0.6875rem', padding: '0.2rem 0' }}>
                            +{s.studentProfile.enrollments.length - 2}
                          </span>
                        )}
                      </div>
                    ) : <span style={{ color: '#334155', fontSize: '0.8125rem' }}>Not enrolled</span>}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#64748b', fontSize: '0.8125rem' }}>
                    {formatDate(s.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      padding: '0.2rem 0.625rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600,
                      background: s.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: s.isActive ? '#10b981' : '#ef4444',
                    }}>
                      {s.isActive ? <UserCheck size={11} /> : <UserX size={11} />}
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#475569' }}>
                    <Users size={32} color="#334155" style={{ margin: '0 auto 0.75rem' }} />
                    <div>{q ? `No students found for "${q}"` : 'No students yet.'}</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
          }}>
            <div style={{ color: '#475569', fontSize: '0.8125rem' }}>
              Showing {skip + 1}–{Math.min(skip + limit, total)} of {total}
            </div>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <Link key={p} href={`?q=${q}&page=${p}`} style={{
                  width: 32, height: 32, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: p === pageNum ? '#3366ff' : 'rgba(255,255,255,0.04)',
                  color: p === pageNum ? 'white' : '#64748b',
                  textDecoration: 'none', fontSize: '0.8125rem', fontWeight: p === pageNum ? 600 : 400,
                }}>{p}</Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
