'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Trash2, Loader2, AlertCircle, CheckCircle, ChevronLeft, GripVertical } from 'lucide-react'

interface Question {
  id: string
  difficulty: string
  subject: { name: string } | null
  chapter: { name: string } | null
  versions: { text: string; options: { id: string; text: string; isCorrect: boolean }[] }[]
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.7rem 1rem',
  background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: 'white', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
}
const labelStyle: React.CSSProperties = {
  display: 'block', color: '#94a3b8', fontSize: '0.75rem',
  fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em',
}

export default function TestBuilderForm({
  courses, subjects,
}: {
  courses: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // Test settings
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [courseId, setCourseId] = useState('')
  const [type, setType] = useState<'SCHEDULED' | 'PRACTICE'>('PRACTICE')
  const [durationMinutes, setDurationMinutes] = useState(180)
  const [windowStart, setWindowStart] = useState('')
  const [windowEnd, setWindowEnd] = useState('')
  const [maxAttempts, setMaxAttempts] = useState(1)
  const [marksPerQuestion, setMarksPerQuestion] = useState(1)
  const [negativeMarking, setNegativeMarking] = useState(false)
  const [negativeMarkValue, setNegativeMarkValue] = useState(0.25)
  const [passPercentage, setPassPercentage] = useState(50)
  const [randomizeQuestions, setRandomizeQuestions] = useState(true)
  const [randomizeOptions, setRandomizeOptions] = useState(true)
  const [scoreVisibility, setScoreVisibility] = useState('IMMEDIATELY')
  const [answersVisibility, setAnswersVisibility] = useState('AFTER_WINDOW')

  // Question picker
  const [searchQ, setSearchQ] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [searchResults, setSearchResults] = useState<Question[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([])

  const searchQuestions = useCallback(async () => {
    setSearching(true)
    const params = new URLSearchParams({ limit: '30' })
    if (searchQ) params.set('q', searchQ)
    if (filterSubject) params.set('subject', filterSubject)
    if (filterDiff) params.set('difficulty', filterDiff)
    const res = await fetch(`/api/admin/questions?${params}`)
    const data = await res.json()
    setSearchResults(data.questions || [])
    setSearching(false)
  }, [searchQ, filterSubject, filterDiff])

  function addQuestion(q: Question) {
    if (!selectedQuestions.find(x => x.id === q.id)) {
      setSelectedQuestions(prev => [...prev, q])
    }
  }

  function removeQuestion(id: string) {
    setSelectedQuestions(prev => prev.filter(q => q.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Test title is required'); return }
    if (selectedQuestions.length === 0) { setError('Add at least one question'); return }
    if (type === 'SCHEDULED' && !windowStart) { setError('Scheduled tests require a start time'); return }

    startTransition(async () => {
      const res = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          courseId: courseId || undefined,
          type,
          durationMinutes,
          windowStart: windowStart ? new Date(windowStart).toISOString() : undefined,
          windowEnd: windowEnd ? new Date(windowEnd).toISOString() : undefined,
          maxAttempts,
          marksPerQuestion,
          negativeMarking,
          negativeMarkValue,
          passPercentage,
          randomizeQuestions,
          randomizeOptions,
          scoreVisibility,
          answersVisibility,
          explanationsVisibility: answersVisibility,
          questionIds: selectedQuestions.map(q => q.id),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create test'); return }
      router.push('/admin/tests')
    })
  }

  const diffColors: Record<string, string> = { EASY: '#10b981', MEDIUM: '#f59e0b', HARD: '#ef4444' }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
        <a href="/admin/tests" style={{ color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
          <ChevronLeft size={16} /> Tests
        </a>
        <span style={{ color: '#334155' }}>/</span>
        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>New Test</span>
      </div>

      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'white', marginBottom: '2rem' }}>Test Builder</h1>

      {error && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.875rem 1rem', color: '#fca5a5', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>

          {/* LEFT — Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Basic info */}
            <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem' }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1rem' }}>Basic Info</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>Title *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Cell Biology Mock Test 1" required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Optional instructions for students..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Course</label>
                    <select value={courseId} onChange={e => setCourseId(e.target.value)} style={inputStyle}>
                      <option value="">— All enrolled —</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Type</label>
                    <select value={type} onChange={e => setType(e.target.value as any)} style={inputStyle}>
                      <option value="PRACTICE">Practice (anytime)</option>
                      <option value="SCHEDULED">Scheduled (time window)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Timing */}
            <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem' }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1rem' }}>Timing</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>Duration (minutes)</label>
                  <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(+e.target.value)} min={1} max={720} style={inputStyle} />
                </div>
                {type === 'SCHEDULED' && (
                  <>
                    <div>
                      <label style={labelStyle}>Window Opens</label>
                      <input type="datetime-local" value={windowStart} onChange={e => setWindowStart(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Window Closes</label>
                      <input type="datetime-local" value={windowEnd} onChange={e => setWindowEnd(e.target.value)} style={inputStyle} />
                    </div>
                  </>
                )}
                <div>
                  <label style={labelStyle}>Max Attempts</label>
                  <input type="number" value={maxAttempts} onChange={e => setMaxAttempts(+e.target.value)} min={1} max={10} style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Scoring */}
            <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem' }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1rem' }}>Scoring</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>Marks per Q</label>
                  <input type="number" value={marksPerQuestion} onChange={e => setMarksPerQuestion(+e.target.value)} min={0.5} step={0.5} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Pass %</label>
                  <input type="number" value={passPercentage} onChange={e => setPassPercentage(+e.target.value)} min={0} max={100} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1.375rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={negativeMarking} onChange={e => setNegativeMarking(e.target.checked)} />
                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Negative marking</span>
                  </label>
                  {negativeMarking && (
                    <div>
                      <label style={labelStyle}>Deduct per wrong</label>
                      <input type="number" value={negativeMarkValue} onChange={e => setNegativeMarkValue(+e.target.value)} min={0.05} max={1} step={0.05} style={inputStyle} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Visibility & Randomization */}
            <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem' }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1rem' }}>Visibility & Randomization</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
                <div>
                  <label style={labelStyle}>Show Score</label>
                  <select value={scoreVisibility} onChange={e => setScoreVisibility(e.target.value)} style={inputStyle}>
                    <option value="IMMEDIATELY">Immediately</option>
                    <option value="AFTER_WINDOW">After window closes</option>
                    <option value="MANUAL">Manual release</option>
                    <option value="NEVER">Never</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Show Answers</label>
                  <select value={answersVisibility} onChange={e => setAnswersVisibility(e.target.value)} style={inputStyle}>
                    <option value="IMMEDIATELY">Immediately</option>
                    <option value="AFTER_WINDOW">After window closes</option>
                    <option value="MANUAL">Manual release</option>
                    <option value="NEVER">Never</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1.375rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={randomizeQuestions} onChange={e => setRandomizeQuestions(e.target.checked)} />
                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Shuffle questions</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={randomizeOptions} onChange={e => setRandomizeOptions(e.target.checked)} />
                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Shuffle options</span>
                  </label>
                </div>
              </div>
            </div>

            <button type="submit" disabled={pending || selectedQuestions.length === 0}
              style={{
                padding: '0.875rem', borderRadius: 10, border: 'none',
                background: (pending || selectedQuestions.length === 0) ? '#1e293b' : 'linear-gradient(135deg, #3366ff, #6644ff)',
                color: (pending || selectedQuestions.length === 0) ? '#334155' : 'white',
                fontWeight: 700, fontSize: '1rem', cursor: (pending || selectedQuestions.length === 0) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: (pending || selectedQuestions.length === 0) ? 'none' : '0 4px 15px rgba(51,102,255,0.3)',
              }}>
              {pending ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : `Create Test (${selectedQuestions.length} questions)`}
            </button>
          </div>

          {/* RIGHT — Question picker */}
          <div style={{ position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Selected */}
            <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                <h2 style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem' }}>
                  Selected ({selectedQuestions.length})
                </h2>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                  {selectedQuestions.length > 0 && `${(selectedQuestions.length * marksPerQuestion).toFixed(1)} total marks`}
                </div>
              </div>
              {selectedQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#334155', fontSize: '0.8rem' }}>
                  Search and add questions below
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 260, overflowY: 'auto' }}>
                  {selectedQuestions.map((q, i) => (
                    <div key={q.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.5rem 0.625rem', borderRadius: 7,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <span style={{ color: '#334155', fontSize: '0.6875rem', minWidth: 18, textAlign: 'right' }}>{i + 1}</span>
                      <span style={{ flex: 1, color: '#94a3b8', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.versions[0]?.text || 'No text'}
                      </span>
                      <button type="button" onClick={() => removeQuestion(q.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: 2, flexShrink: 0 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Search */}
            <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem' }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.875rem' }}>Add Questions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchQuestions())} placeholder="Search by text..." style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                  <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={inputStyle}>
                    <option value="">All subjects</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)} style={inputStyle}>
                    <option value="">All levels</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <button type="button" onClick={searchQuestions} disabled={searching}
                  style={{ padding: '0.5rem', borderRadius: 8, border: 'none', background: 'rgba(51,102,255,0.2)', color: '#7ca3ff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                  {searching ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
                  Search
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 320, overflowY: 'auto' }}>
                {searchResults.map(q => {
                  const already = !!selectedQuestions.find(x => x.id === q.id)
                  return (
                    <div key={q.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                      padding: '0.625rem', borderRadius: 8,
                      background: already ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${already ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                          {q.versions[0]?.text || 'No text'}
                        </div>
                        <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.625rem', color: diffColors[q.difficulty] || '#64748b' }}>{q.difficulty}</span>
                          {q.subject && <span style={{ fontSize: '0.625rem', color: '#475569' }}>· {q.subject.name}</span>}
                        </div>
                      </div>
                      <button type="button" onClick={() => already ? removeQuestion(q.id) : addQuestion(q)}
                        style={{
                          width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                          background: already ? 'rgba(16,185,129,0.15)' : 'rgba(51,102,255,0.15)',
                          color: already ? '#10b981' : '#7ca3ff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        {already ? <CheckCircle size={13} /> : <Plus size={13} />}
                      </button>
                    </div>
                  )
                })}
                {searchResults.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#334155', fontSize: '0.8rem' }}>
                    Press Search to find questions
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}
