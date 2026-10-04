'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, CheckCircle, Loader2, AlertCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface Option { text: string; isCorrect: boolean }

const inputStyle = {
  width: '100%', padding: '0.75rem 1rem',
  background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: 'white', fontSize: '0.9rem',
  outline: 'none', fontFamily: 'inherit',
}

const labelStyle = { display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }

export default function AddQuestionForm({
  subjects, chapters,
}: {
  subjects: { id: string; name: string }[]
  chapters: { id: string; name: string; subjectId: string }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [text, setText] = useState('')
  const [explanation, setExplanation] = useState('')
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [subjectId, setSubjectId] = useState('')
  const [chapterId, setChapterId] = useState('')
  const [source, setSource] = useState('')
  const [options, setOptions] = useState<Option[]>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ])

  const filteredChapters = chapters.filter(c => c.subjectId === subjectId)

  function setCorrect(idx: number) {
    setOptions(opts => opts.map((o, i) => ({ ...o, isCorrect: i === idx })))
  }

  function updateOption(idx: number, text: string) {
    setOptions(opts => opts.map((o, i) => i === idx ? { ...o, text } : o))
  }

  function addOption() {
    if (options.length < 6) setOptions(opts => [...opts, { text: '', isCorrect: false }])
  }

  function removeOption(idx: number) {
    if (options.length <= 2) return
    setOptions(opts => opts.filter((_, i) => i !== idx).map((o, i) => ({ ...o, isCorrect: options[i]?.isCorrect && i < idx ? true : o.isCorrect })))
  }

  async function handleSubmit(e: React.FormEvent, addAnother = false) {
    e.preventDefault()
    setError('')

    if (!text.trim()) { setError('Question text is required'); return }
    if (!options.some(o => o.isCorrect)) { setError('Mark exactly one option as correct'); return }
    if (options.some(o => !o.text.trim())) { setError('All option texts are required'); return }

    startTransition(async () => {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          explanation: explanation.trim() || undefined,
          difficulty,
          subjectId: subjectId || undefined,
          chapterId: chapterId || undefined,
          source: source.trim() || undefined,
          options: options.map((o, i) => ({ text: o.text.trim(), isCorrect: o.isCorrect, order: i })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save question'); return }
      if (addAnother) {
        setText(''); setExplanation(''); setSource(''); setChapterId('')
        setOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }])
        setSuccess(true); setTimeout(() => setSuccess(false), 2500)
      } else {
        router.push('/admin/questions')
      }
    })
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 780, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
        <Link href="/admin/questions" style={{ color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
          <ChevronLeft size={16} /> Questions
        </Link>
        <span style={{ color: '#334155' }}>/</span>
        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>New Question</span>
      </div>

      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'white', marginBottom: '2rem' }}>Add Question</h1>

      {error && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.875rem 1rem', color: '#fca5a5', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '0.875rem 1rem', color: '#6ee7b7', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          <CheckCircle size={16} /> Question saved! Add another one.
        </div>
      )}

      <form onSubmit={e => handleSubmit(e, false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Metadata row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Subject</label>
              <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setChapterId('') }} style={{ ...inputStyle }}>
                <option value="">— Select Subject —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Chapter</label>
              <select value={chapterId} onChange={e => setChapterId(e.target.value)} style={{ ...inputStyle }} disabled={!subjectId}>
                <option value="">— Select Chapter —</option>
                {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ ...inputStyle }}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Source / Year</label>
              <input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. PMDC 2023" style={{ ...inputStyle }} />
            </div>
          </div>

          {/* Question text */}
          <div>
            <label style={labelStyle}>Question Text *</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Enter the question stem here..."
              rows={4}
              required
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          {/* Options */}
          <div>
            <label style={labelStyle}>Answer Options * <span style={{ color: '#475569', textTransform: 'none', fontWeight: 400 }}>(click circle to mark correct)</span></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <button
                    type="button"
                    onClick={() => setCorrect(i)}
                    title="Mark as correct"
                    style={{
                      width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: opt.isCorrect ? '#10b981' : 'rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.isCorrect
                      ? <CheckCircle size={15} color="white" />
                      : <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #334155', display: 'block' }} />
                    }
                  </button>
                  <span style={{ color: '#475569', fontWeight: 600, fontSize: '0.8125rem', minWidth: 20 }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <input
                    value={opt.text}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    style={{
                      ...inputStyle,
                      border: opt.isCorrect ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.1)',
                      background: opt.isCorrect ? 'rgba(16,185,129,0.06)' : '#0f172a',
                    }}
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: 4, flexShrink: 0 }}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button type="button" onClick={addOption}
                style={{ marginTop: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: '1px dashed rgba(51,102,255,0.3)', borderRadius: 7, color: '#3366ff', fontSize: '0.8125rem', padding: '0.5rem 0.875rem', cursor: 'pointer' }}>
                <Plus size={13} /> Add Option
              </button>
            )}
          </div>

          {/* Explanation */}
          <div>
            <label style={labelStyle}>Explanation (shown after submission)</label>
            <textarea
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              placeholder="Explain why the correct answer is correct..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button
              type="button"
              onClick={e => handleSubmit(e, true)}
              disabled={pending}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}>
              {pending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
              Save & Add Another
            </button>
            <button
              type="submit"
              disabled={pending}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #3366ff, #6644ff)',
                color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(51,102,255,0.3)',
              }}>
              {pending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={16} />}
              Save Question
            </button>
          </div>
        </div>
      </form>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}
