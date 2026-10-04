'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, Share2, Maximize2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
  lecture: {
    id: string
    title: string
    description: string | null
    videoUrl: string | null
    videoProvider?: string | null
    videoDuration: number | null
    order: number
    notes?: string | null
    chapter: { name: string; subject: { name: string; course: { id: string } } }
  }
  subjectId: string
  prevLecture: { id: string; title: string } | null
  nextLecture: { id: string; title: string } | null
  isCompleted: boolean
  courseId: string
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/)
  return m ? m[1] : null
}

export default function LecturePlayer({ lecture, subjectId, prevLecture, nextLecture, isCompleted: initialCompleted, courseId }: Props) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [marking, setMarking] = useState(false)
  const [error, setError] = useState('')

  const videoId = lecture.videoUrl ? extractYouTubeId(lecture.videoUrl) : null
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`
    : lecture.videoUrl

  async function markComplete() {
    if (completed || marking) return
    setMarking(true)
    try {
      await fetch('/api/lectures/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId: lecture.id }),
      })
      setCompleted(true)
    } catch {
      setError('Failed to mark complete. Please try again.')
    } finally {
      setMarking(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <Link href="/dashboard/courses" style={{ color: '#475569', fontSize: '0.8125rem', textDecoration: 'none' }}>Courses</Link>
        <ChevronRight size={12} color="#334155" />
        <Link href={`/dashboard/courses/${courseId}/subjects/${subjectId}`} style={{ color: '#475569', fontSize: '0.8125rem', textDecoration: 'none' }}>
          {lecture.chapter.subject.name}
        </Link>
        <ChevronRight size={12} color="#334155" />
        <span style={{ color: '#94a3b8', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
          {lecture.title}
        </span>
      </div>

      {/* Video player */}
      <div style={{
        borderRadius: 16, overflow: 'hidden', marginBottom: '1.25rem',
        background: '#000',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {embedUrl ? (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={embedUrl}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={lecture.title}
              onEnded={markComplete}
            />
          </div>
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#475569' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎬</div>
            <div>Video coming soon</div>
          </div>
        )}
      </div>

      {/* Lecture info + actions */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)', color: 'white', marginBottom: '0.25rem' }}>
            {lecture.title}
          </h1>
          <div style={{ color: '#64748b', fontSize: '0.8125rem' }}>
            {lecture.chapter.name} · {lecture.chapter.subject.name}
            {lecture.videoDuration && ` · ${Math.floor(lecture.videoDuration / 60)}m ${lecture.videoDuration % 60}s`}
          </div>
        </div>
        <button
          onClick={markComplete}
          disabled={completed || marking}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.625rem 1.25rem', borderRadius: 10, border: 'none',
            background: completed ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #3366ff, #6644ff)',
            color: completed ? '#10b981' : 'white',
            fontSize: '0.875rem', fontWeight: 600,
            cursor: completed ? 'default' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: completed ? 'none' : '0 4px 12px rgba(51,102,255,0.3)',
          }}
        >
          <CheckCircle size={16} />
          {completed ? 'Completed' : marking ? 'Marking...' : 'Mark Complete'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Description */}
      {lecture.description && (
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
          <h3 style={{ color: 'white', fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>About this lecture</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.7 }}>{lecture.description}</p>
        </div>
      )}

      {/* Notes */}
      {lecture.notes && (
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
          <h3 style={{ color: 'white', fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>Lecture Notes</h3>
          <div style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{lecture.notes}</div>
        </div>
      )}

      {/* Prev / Next navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem' }}>
        {prevLecture ? (
          <Link href={`/dashboard/courses/${courseId}/subjects/${subjectId}/lectures/${prevLecture.id}`} style={{ textDecoration: 'none', flex: 1 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.875rem 1.125rem', borderRadius: 12,
              background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
            }}>
              <ChevronLeft size={18} color="#64748b" />
              <div>
                <div style={{ color: '#475569', fontSize: '0.6875rem', marginBottom: '0.125rem' }}>Previous</div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                  {prevLecture.title}
                </div>
              </div>
            </div>
          </Link>
        ) : <div style={{ flex: 1 }} />}

        {nextLecture ? (
          <Link href={`/dashboard/courses/${courseId}/subjects/${subjectId}/lectures/${nextLecture.id}`} style={{ textDecoration: 'none', flex: 1 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem',
              padding: '0.875rem 1.125rem', borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(51,102,255,0.12), rgba(102,68,255,0.08))',
              border: '1px solid rgba(51,102,255,0.2)', cursor: 'pointer',
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#7ca3ff', fontSize: '0.6875rem', marginBottom: '0.125rem' }}>Next Lecture</div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                  {nextLecture.title}
                </div>
              </div>
              <ChevronRight size={18} color="#7ca3ff" />
            </div>
          </Link>
        ) : (
          <Link href={`/dashboard/courses/${courseId}/subjects/${subjectId}`} style={{ textDecoration: 'none', flex: 1 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem',
              padding: '0.875rem 1.125rem', borderRadius: 12,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer',
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#10b981', fontSize: '0.6875rem', marginBottom: '0.125rem' }}>Chapter Done!</div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>Back to Subject</div>
              </div>
              <CheckCircle size={18} color="#10b981" />
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
