'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, ChevronLeft, ChevronRight, Send, Wifi, WifiOff, AlertTriangle } from 'lucide-react'

interface Option { id: string; text: string; order: number }
interface Question {
  id: string; versionId: string; order: number; text: string
  imageUrl?: string | null; difficulty: string
  subject?: { name: string } | null; options: Option[]
}
interface ExamState {
  attemptId: string; testId: string; title: string
  remainingSeconds: number; deadline: string
  totalQuestions: number; marksPerQuestion: number
  negativeMarking: boolean; negativeMarkValue: number
  questions: Question[]
  savedAnswers?: Record<string, string | null>
  resumed?: boolean
}

const AUTOSAVE_DEBOUNCE_MS = 800

export default function ExamEngine({ exam }: { exam: ExamState }) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  // Pre-populate answers from server if resuming
  const [answers, setAnswers] = useState<Map<string, string | null>>(() => {
    if (exam.savedAnswers) {
      return new Map(Object.entries(exam.savedAnswers).filter(([, v]) => v !== null))
    }
    return new Map()
  })
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [remainingSeconds, setRemainingSeconds] = useState(exam.remainingSeconds)
  const [online, setOnline] = useState(true)
  const [savingAnswerId, setSavingAnswerId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [autoSubmitted, setAutoSubmitted] = useState(false)
  const saveQueue = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const deadlineRef = useRef(new Date(exam.deadline))

  const currentQ = exam.questions[currentIndex]

  // Countdown timer — server deadline is authoritative
  useEffect(() => {
    const tick = setInterval(() => {
      const now = new Date()
      const secs = Math.max(0, Math.floor((deadlineRef.current.getTime() - now.getTime()) / 1000))
      setRemainingSeconds(secs)
      if (secs <= 0) {
        clearInterval(tick)
        handleAutoSubmit()
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  // Online/offline detection
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  // Prevent accidental navigation
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const saveAnswer = useCallback(async (questionId: string, optionId: string | null) => {
    setSavingAnswerId(questionId)
    try {
      const res = await fetch('/api/exam/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: exam.attemptId, questionId, selectedOptionId: optionId }),
      })
      const data = await res.json()
      if (data.expired) {
        setAutoSubmitted(true)
        router.push(`/results/${exam.attemptId}`)
      }
    } catch { /* offline — will retry via queue */ }
    finally { setSavingAnswerId(null) }
  }, [exam.attemptId, router])

  function selectOption(questionId: string, optionId: string) {
    const prev = answers.get(questionId)
    const next = prev === optionId ? null : optionId // toggle
    setAnswers(prev => new Map(prev).set(questionId, next))

    // Debounced autosave
    const existing = saveQueue.current.get(questionId)
    if (existing) clearTimeout(existing)
    const t = setTimeout(() => saveAnswer(questionId, next), AUTOSAVE_DEBOUNCE_MS)
    saveQueue.current.set(questionId, t)
  }

  function toggleFlag(qId: string) {
    setFlagged(prev => { const s = new Set(prev); s.has(qId) ? s.delete(qId) : s.add(qId); return s })
  }

  async function handleAutoSubmit() {
    setAutoSubmitted(true)
    await submitAttempt()
  }

  async function submitAttempt() {
    // Flush all pending saves first
    for (const [, t] of saveQueue.current) clearTimeout(t)
    saveQueue.current.clear()

    setSubmitting(true)
    try {
      const res = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: exam.attemptId }),
      })
      const data = await res.json()
      if (res.ok) router.push(`/results/${exam.attemptId}`)
      else console.error('Submit failed:', data)
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Timer display
  const hrs = Math.floor(remainingSeconds / 3600)
  const mins = Math.floor((remainingSeconds % 3600) / 60)
  const secs = remainingSeconds % 60
  const timerStr = hrs > 0
    ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const timerClass = remainingSeconds <= 300 ? 'timer-danger' : remainingSeconds <= 600 ? 'timer-warning' : 'timer-normal'

  const answeredCount = [...answers.values()].filter(Boolean).length
  const flaggedCount = flagged.size

  return (
    <div className="exam-mode" style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <header className="exam-topbar" style={{
        position: 'sticky', top: 0, zIndex: 50, padding: '0.75rem 1.25rem',
        background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="exam-topbar-title" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {exam.title}
            </div>
            {exam.resumed && (
              <span style={{ padding: '0.1rem 0.5rem', borderRadius: 6, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.625rem', fontWeight: 700, flexShrink: 0 }}>
                RESUMED
              </span>
            )}
          </div>
          <div style={{ color: '#475569', fontSize: '0.75rem' }}>
            {answeredCount}/{exam.totalQuestions} answered · {flaggedCount} flagged
          </div>
        </div>

        {/* Timer */}
        <div style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.5rem',
          color: remainingSeconds <= 300 ? '#ef4444' : remainingSeconds <= 600 ? '#f59e0b' : '#94a3b8',
          letterSpacing: '0.05em', flexShrink: 0,
          animation: remainingSeconds <= 300 ? 'pulse 1s infinite' : 'none',
        }}>
          {timerStr}
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          {/* Online indicator */}
          <div title={online ? 'Connected' : 'Offline — answers will sync when reconnected'}>
            {online ? <Wifi size={16} color="#10b981" /> : <WifiOff size={16} color="#ef4444" />}
          </div>
          {savingAnswerId && <div style={{ color: '#475569', fontSize: '0.6875rem' }}>Saving...</div>}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            style={{
              padding: '0.5rem 1.125rem', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, #3366ff, #6644ff)',
              color: 'white', fontWeight: 700, fontSize: '0.875rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem',
              boxShadow: '0 4px 12px rgba(51,102,255,0.3)',
            }}>
            <Send size={14} /> Submit
          </button>
        </div>
      </header>

      <div className="exam-layout-container" style={{ display: 'flex', flex: 1, gap: 0, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '1.25rem' }}>
        {/* Question panel */}
        <div className="exam-question-panel" style={{ flex: 1, minWidth: 0, marginRight: '1.25rem' }}>
          <div style={{
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: '1.75rem',
          }}>
            {/* Question header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.875rem', color: '#3366ff' }}>
                  Q{currentIndex + 1}
                </span>
                {currentQ.subject && (
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: 6, background: 'rgba(51,102,255,0.1)', color: '#7ca3ff', fontSize: '0.6875rem', fontWeight: 600 }}>
                    {currentQ.subject.name}
                  </span>
                )}
              </div>
              <button
                onClick={() => toggleFlag(currentQ.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.375rem 0.75rem', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: flagged.has(currentQ.id) ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                  color: flagged.has(currentQ.id) ? '#f59e0b' : '#475569',
                  fontSize: '0.8125rem', fontWeight: 500,
                }}>
                <Flag size={13} fill={flagged.has(currentQ.id) ? '#f59e0b' : 'none'} /> Flag
              </button>
            </div>

            {/* Question text */}
            <p style={{ color: 'white', fontSize: '1.0625rem', lineHeight: 1.7, marginBottom: '1.75rem', fontWeight: 400 }}>
              {currentQ.text}
            </p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {currentQ.options.map((opt, i) => {
                const selected = answers.get(currentQ.id) === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => selectOption(currentQ.id, opt.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                      padding: '0.875rem 1rem', borderRadius: 10, border: 'none', cursor: 'pointer',
                      textAlign: 'left', width: '100%',
                      background: selected ? 'rgba(51,102,255,0.15)' : 'rgba(255,255,255,0.03)',
                      outline: selected ? '2px solid rgba(51,102,255,0.5)' : '2px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: selected ? '#3366ff' : 'rgba(255,255,255,0.06)',
                      color: selected ? 'white' : '#64748b',
                      fontSize: '0.8125rem', fontWeight: 700,
                    }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span style={{ color: selected ? '#e2e8f0' : '#94a3b8', fontSize: '0.9375rem', lineHeight: 1.6, paddingTop: '0.125rem' }}>
                      {opt.text}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nav buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', gap: '0.75rem' }}>
            <button onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1.125rem', borderRadius: 8, border: 'none', background: currentIndex === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)', color: currentIndex === 0 ? '#334155' : '#94a3b8', fontWeight: 600, fontSize: '0.875rem', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}>
              <ChevronLeft size={16} /> Previous
            </button>
            <button onClick={() => setCurrentIndex(i => Math.min(exam.totalQuestions - 1, i + 1))} disabled={currentIndex === exam.totalQuestions - 1}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1.125rem', borderRadius: 8, border: 'none', background: currentIndex === exam.totalQuestions - 1 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)', color: currentIndex === exam.totalQuestions - 1 ? '#334155' : '#94a3b8', fontWeight: 600, fontSize: '0.875rem', cursor: currentIndex === exam.totalQuestions - 1 ? 'not-allowed' : 'pointer' }}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Question palette */}
        <div className="exam-palette-panel" style={{ width: 220, flexShrink: 0 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1rem', position: 'sticky', top: '5rem' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem' }}>
              Question Palette
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.375rem', marginBottom: '1rem' }}>
              {exam.questions.map((q, i) => {
                const answered = !!answers.get(q.id)
                const isFlagged = flagged.has(q.id)
                const isCurrent = i === currentIndex
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    style={{
                      width: '100%', aspectRatio: '1', borderRadius: 6, border: 'none',
                      cursor: 'pointer', fontSize: '0.6875rem', fontWeight: 700,
                      background: isCurrent ? '#3366ff'
                        : isFlagged ? 'rgba(245,158,11,0.2)'
                        : answered ? 'rgba(16,185,129,0.15)'
                        : 'rgba(255,255,255,0.04)',
                      color: isCurrent ? 'white'
                        : isFlagged ? '#f59e0b'
                        : answered ? '#10b981'
                        : '#475569',
                      outline: isCurrent ? '2px solid rgba(51,102,255,0.5)' : 'none',
                      transition: 'all 0.1s',
                    }}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.6875rem', color: '#475569' }}>
              {[['#10b981', 'Answered'], ['#f59e0b', 'Flagged'], ['#475569', 'Not answered'], ['#3366ff', 'Current']].map(([color, lbl]) => (
                <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: color, opacity: 0.8 }} />
                  {lbl}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submit confirmation modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '2rem', maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <AlertTriangle size={40} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'white', marginBottom: '0.75rem', fontSize: '1.25rem' }}>
              Submit Test?
            </h2>
            <div style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              <strong style={{ color: '#94a3b8' }}>{answeredCount}</strong> of {exam.totalQuestions} questions answered.<br />
              {exam.totalQuestions - answeredCount > 0 && (
                <span style={{ color: '#f59e0b' }}>{exam.totalQuestions - answeredCount} unanswered questions. </span>
              )}
              This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                Keep going
              </button>
              <button onClick={() => { setShowConfirm(false); submitAttempt() }} disabled={submitting}
                style={{ flex: 1, padding: '0.75rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3366ff, #6644ff)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(51,102,255,0.3)' }}>
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {autoSubmitted && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏰</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.5rem' }}>Time's Up!</div>
            <div style={{ color: '#64748b' }}>Your test has been automatically submitted...</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        button:hover { opacity: 0.9; }

        @media (max-width: 768px) {
          .exam-layout-container {
            flex-direction: column !important;
            padding: 0.75rem !important;
          }
          .exam-question-panel {
            margin-right: 0 !important;
            margin-bottom: 1.25rem !important;
          }
          .exam-palette-panel {
            width: 100% !important;
          }
          .exam-topbar {
            padding: 0.75rem 0.875rem !important;
          }
          .exam-topbar-title {
            max-width: 140px;
          }
        }
      `}</style>
    </div>
  )
}
