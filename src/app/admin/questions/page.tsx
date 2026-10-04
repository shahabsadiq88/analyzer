import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ClipboardList, Plus, Filter, Search, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Question Bank — Admin' }

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subject?: string; difficulty?: string; page?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  const { q = '', subject = '', difficulty = '', page = '1' } = await searchParams
  const pageNum = Math.max(1, parseInt(page))
  const limit = 25
  const skip = (pageNum - 1) * limit

  const where: any = {
    deletedAt: null,
    ...(subject ? { subjectId: subject } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(q ? { versions: { some: { text: { contains: q, mode: 'insensitive' } } } } : {}),
  }

  const [questions, total, subjects] = await Promise.all([
    prisma.question.findMany({
      where,
      include: {
        subject: { select: { name: true } },
        chapter: { select: { name: true } },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.question.count({ where }),
    prisma.subject.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  const totalPages = Math.ceil(total / limit)
  const difficultyColors: Record<string, { color: string; bg: string }> = {
    EASY: { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    MEDIUM: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    HARD: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'white', marginBottom: '0.25rem' }}>
            Question Bank
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{total.toLocaleString()} questions</p>
        </div>
        <Link href="/admin/questions/new" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.625rem 1.25rem', borderRadius: 10,
          background: 'linear-gradient(135deg, #3366ff, #6644ff)',
          color: 'white', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
          boxShadow: '0 4px 15px rgba(51,102,255,0.3)',
        }}>
          <Plus size={16} /> Add Question
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={15} color="#475569" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input name="q" defaultValue={q} placeholder="Search question text..."
            style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.375rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'white', fontSize: '0.875rem', outline: 'none' }} />
        </div>
        <select name="subject" defaultValue={subject}
          style={{ padding: '0.625rem 1rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'white', fontSize: '0.875rem', outline: 'none', minWidth: 140 }}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select name="difficulty" defaultValue={difficulty}
          style={{ padding: '0.625rem 1rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'white', fontSize: '0.875rem', outline: 'none' }}>
          <option value="">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
        <button type="submit" style={{ padding: '0.625rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Filter size={14} /> Filter
        </button>
      </form>

      {/* Questions list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {questions.map((q, i) => {
          const version = q.versions[0]
          const diff = difficultyColors[q.difficulty] || difficultyColors.MEDIUM
          const correctOption = version?.options.find(o => o.isCorrect)
          return (
            <div key={q.id} style={{
              background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'flex-start', gap: '1rem',
            }}>
              <div style={{ color: '#334155', fontSize: '0.75rem', fontWeight: 700, minWidth: 28, paddingTop: 2, textAlign: 'right' }}>
                {skip + i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '0.5rem' }}>
                  {version?.text || 'No text yet'}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.6875rem', fontWeight: 600, background: diff.bg, color: diff.color }}>
                    {q.difficulty}
                  </span>
                  {q.subject && <span style={{ padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.6875rem', background: 'rgba(51,102,255,0.1)', color: '#7ca3ff' }}>{q.subject.name}</span>}
                  {q.chapter && <span style={{ padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.6875rem', background: 'rgba(255,255,255,0.04)', color: '#64748b' }}>{q.chapter.name}</span>}
                  {q.source && <span style={{ padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.6875rem', background: 'rgba(255,255,255,0.04)', color: '#64748b' }}>src: {q.source}</span>}
                </div>
                {correctOption && (
                  <div style={{ marginTop: '0.5rem', color: '#10b981', fontSize: '0.75rem' }}>
                    ✓ {correctOption.text}
                  </div>
                )}
              </div>
              <Link href={`/admin/questions/${q.id}/edit`} style={{
                padding: '0.35rem 0.75rem', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)',
                color: '#64748b', textDecoration: 'none', fontSize: '0.8rem', flexShrink: 0,
              }}>
                Edit
              </Link>
            </div>
          )
        })}

        {questions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <ClipboardList size={40} color="#334155" style={{ margin: '0 auto 1rem' }} />
            <div style={{ color: 'white', fontWeight: 600, marginBottom: '0.5rem' }}>No questions found</div>
            <Link href="/admin/questions/new" style={{ color: '#7ca3ff', fontSize: '0.875rem' }}>Add your first question →</Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
            <Link key={p} href={`?q=${q}&subject=${subject}&difficulty=${difficulty}&page=${p}`} style={{
              width: 34, height: 34, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: p === pageNum ? '#3366ff' : 'rgba(255,255,255,0.04)',
              color: p === pageNum ? 'white' : '#64748b', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: p === pageNum ? 600 : 400,
            }}>{p}</Link>
          ))}
        </div>
      )}
    </div>
  )
}
