import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { CheckCircle, XCircle, MinusCircle, Trophy, BarChart3, Clock, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { isAnswerVisible, sanitizeQuestionForClient } from '@/lib/exam-helpers'
import { formatDate, getGrade } from '@/lib/utils'

export const metadata = { title: 'Results' }

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const { attemptId } = await params

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } })
  if (!profile) redirect('/dashboard')

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      test: true,
      result: true,
      student: { select: { fullName: true } },
      questions: {
        include: {
          version: {
            include: {
              options: { orderBy: { order: 'asc' } },
            },
          },
        },
        orderBy: { position: 'asc' },
      },
      answers: true,
    },
  })

  if (!attempt) notFound()
  if (attempt.studentId !== profile.id && session.user.role === 'STUDENT') notFound()
  if (!attempt.result) redirect('/dashboard/tests') // Not submitted yet

  const result = attempt.result
  const test = attempt.test

  const answersVisible = isAnswerVisible(test.answersVisibility, test.windowEnd, attempt.submittedAt)
  const scoreVisible = isAnswerVisible(test.scoreVisibility, test.windowEnd, attempt.submittedAt)

  const answerMap = new Map(attempt.answers.map((a: { questionId: string; selectedOptionId: string | null }) => [a.questionId, a.selectedOptionId]))
  const grade = getGrade(Number(result.percentage))

  const subjectBreakdown = result.subjectBreakdown as Record<string, { correct: number; wrong: number; skipped: number; marks: number }> | null

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '1.5rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Score card */}
        <div style={{
          background: result.isPassed
            ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))'
            : 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.06))',
          border: `1px solid ${result.isPassed ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          borderRadius: 20, padding: '2rem', marginBottom: '1.5rem', textAlign: 'center',
        }}>
          <div style={{ marginBottom: '1rem' }}>
            {result.isPassed
              ? <Trophy size={48} color="#10b981" style={{ margin: '0 auto' }} />
              : <XCircle size={48} color="#ef4444" style={{ margin: '0 auto' }} />
            }
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', color: 'white', marginBottom: '0.375rem' }}>
            {test.title}
          </h1>
          <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            Submitted {attempt.submittedAt ? formatDate(attempt.submittedAt, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''}
            {attempt.status === 'AUTO_SUBMITTED' && <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>(auto-submitted)</span>}
          </div>

          {scoreVisible ? (
            <>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(3rem, 8vw, 5rem)', lineHeight: 1, color: result.isPassed ? '#10b981' : '#ef4444', marginBottom: '0.5rem' }}>
                {Number(result.percentage).toFixed(1)}%
              </div>
              <div style={{ display: 'inline-block', padding: '0.375rem 1.25rem', borderRadius: 9999, fontWeight: 700, fontSize: '1rem', background: result.isPassed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: result.isPassed ? '#10b981' : '#ef4444', marginBottom: '2rem' }}>
                {result.isPassed ? '✓ PASSED' : '✗ FAILED'}
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                {[
                  { icon: CheckCircle, label: 'Correct', value: result.correctCount, color: '#10b981' },
                  { icon: XCircle, label: 'Wrong', value: result.wrongCount, color: '#ef4444' },
                  { icon: MinusCircle, label: 'Skipped', value: result.skippedCount, color: '#64748b' },
                  { icon: BarChart3, label: 'Score', value: `${Number(result.obtainedMarks).toFixed(1)}/${result.totalMarks}`, color: '#7ca3ff' },
                ].map(s => {
                  const Icon = s.icon
                  return (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <Icon size={20} color={s.color} style={{ margin: '0 auto 0.375rem' }} />
                      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.375rem', color: 'white' }}>{s.value}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{s.label}</div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div style={{ padding: '2rem', color: '#475569', fontSize: '0.9375rem' }}>
              🔒 Score will be released after the exam window closes.
            </div>
          )}
        </div>

        {/* Subject breakdown */}
        {scoreVisible && subjectBreakdown && Object.keys(subjectBreakdown).length > 0 && (
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={16} color="#7ca3ff" /> Subject Breakdown
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
              {Object.entries(subjectBreakdown).map(([subj, data]) => {
                const total = data.correct + data.wrong + data.skipped
                const pct = total > 0 ? Math.round((data.correct / total) * 100) : 0
                return (
                  <div key={subj} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '1rem' }}>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.625rem' }}>{subj}</div>
                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', marginBottom: '0.625rem', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 50 ? '#10b981' : '#ef4444', borderRadius: 3 }} />
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                      {data.correct}✓ {data.wrong}✗ {data.skipped}— · {pct}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Question review */}
        {answersVisible && (
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '1rem', marginBottom: '1.25rem' }}>
              Question Review
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {attempt.questions.map((aq: any, i: number) => {
                const selectedId = answerMap.get(aq.questionId) || null
                const correctOpt = aq.version.options.find((o: any) => o.isCorrect)
                const isCorrect = selectedId && selectedId === correctOpt?.id
                const isSkipped = !selectedId

                return (
                  <div key={aq.id} style={{
                    padding: '1.125rem', borderRadius: 12,
                    background: isCorrect ? 'rgba(16,185,129,0.06)' : isSkipped ? 'rgba(255,255,255,0.02)' : 'rgba(239,68,68,0.06)',
                    border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.15)' : isSkipped ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.15)'}`,
                  }}>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ color: '#334155', fontSize: '0.75rem', fontWeight: 700, minWidth: 22 }}>Q{i + 1}</span>
                      <p style={{ color: 'white', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>{aq.version.text}</p>
                      <div style={{ flexShrink: 0 }}>
                        {isCorrect ? <CheckCircle size={18} color="#10b981" /> : isSkipped ? <MinusCircle size={18} color="#64748b" /> : <XCircle size={18} color="#ef4444" />}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginLeft: '1.75rem' }}>
                      {aq.version.options.map((opt: any) => {
                        const isSelected = opt.id === selectedId
                        const isRight = opt.isCorrect
                        return (
                          <div key={opt.id} style={{
                            padding: '0.4rem 0.75rem', borderRadius: 7, fontSize: '0.8125rem',
                            background: isRight ? 'rgba(16,185,129,0.1)' : isSelected && !isRight ? 'rgba(239,68,68,0.1)' : 'transparent',
                            color: isRight ? '#10b981' : isSelected && !isRight ? '#ef4444' : '#64748b',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                          }}>
                            {isRight && '✓ '}{isSelected && !isRight && '✗ '}{opt.text}
                          </div>
                        )
                      })}
                    </div>
                    {aq.version.explanation && (
                      <div style={{ marginTop: '0.75rem', marginLeft: '1.75rem', padding: '0.625rem 0.875rem', borderRadius: 8, background: 'rgba(51,102,255,0.08)', border: '1px solid rgba(51,102,255,0.15)' }}>
                        <div style={{ color: '#7ca3ff', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Explanation</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8125rem', lineHeight: 1.6 }}>{aq.version.explanation}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!answersVisible && (
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '2rem', textAlign: 'center', color: '#475569', marginBottom: '1.5rem' }}>
            🔒 Answer review will be available {test.answersVisibility === 'AFTER_WINDOW' ? 'after the exam window closes' : 'when released by your teacher'}.
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {test.type === 'PRACTICE' && (
            <Link href={`/exam/${test.id}`} style={{
              padding: '0.75rem 1.75rem', borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem',
              boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            }}>
              ↻ Retake Test
            </Link>
          )}
          <Link href="/dashboard/tests" style={{
            padding: '0.75rem 1.75rem', borderRadius: 10,
            background: 'linear-gradient(135deg, #3366ff, #6644ff)',
            color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem',
            boxShadow: '0 4px 15px rgba(51,102,255,0.3)',
          }}>
            Back to Tests
          </Link>
          <Link href="/dashboard" style={{
            padding: '0.75rem 1.75rem', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.9375rem',
          }}>
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
