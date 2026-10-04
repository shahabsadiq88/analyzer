import Link from 'next/link'
import { GraduationCap, BookOpen, ClipboardList, BarChart3, Shield, Clock } from 'lucide-react'

const features = [
  {
    icon: BookOpen,
    title: 'Expert Video Lectures',
    description: 'Biology, Chemistry, Physics taught by MDCAT specialists with years of coaching experience.',
  },
  {
    icon: ClipboardList,
    title: 'Practice & Mock Tests',
    description: '10,000+ MCQs with detailed explanations. Timed tests that mirror the real MDCAT experience.',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description: 'Track your progress by subject, chapter, and topic. Identify weak areas instantly.',
  },
  {
    icon: Clock,
    title: 'Server-Controlled Exams',
    description: 'Tamper-proof timer, auto-save, and auto-submit. Your progress is always safe.',
  },
  {
    icon: Shield,
    title: 'Secure & Fair',
    description: 'Per-student randomized questions, single-session control, and full audit logs.',
  },
  {
    icon: GraduationCap,
    title: 'MDCAT Pattern 2025',
    description: '180-MCQ format following the latest PMDC pattern with subject-wise distribution.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
        padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #3366ff, #6644ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={20} color="white" />
          </div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.125rem', color: 'white' }}>
            ANALYZER ACADEMY
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/login" style={{
            padding: '0.5rem 1.25rem', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.85)',
            textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
            transition: 'all 0.2s',
          }}>
            Login
          </Link>
          <Link href="/login" style={{
            padding: '0.5rem 1.25rem', borderRadius: 8,
            background: 'linear-gradient(135deg, #3366ff, #6644ff)',
            color: 'white',
            textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
            boxShadow: '0 4px 15px rgba(51,102,255,0.4)',
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '5rem 1.5rem 4rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(51,102,255,0.15)', border: '1px solid rgba(51,102,255,0.3)',
          borderRadius: 9999, padding: '0.375rem 1rem', marginBottom: '1.5rem',
          color: '#7ca3ff', fontSize: '0.8125rem', fontWeight: 600,
        }}>
          <span>🎯</span> MDCAT 2025 Preparation Platform
        </div>

        <h1 style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 800,
          fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
          lineHeight: 1.15, color: 'white', marginBottom: '1.25rem',
        }}>
          Ace Your MDCAT With{' '}
          <span style={{ background: 'linear-gradient(135deg, #3366ff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Expert Guidance
          </span>
        </h1>

        <p style={{ color: '#94a3b8', fontSize: '1.125rem', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 600, margin: '0 auto 2.5rem' }}>
          Comprehensive video lectures, 10,000+ practice MCQs, timed mock tests, and
          detailed analytics — everything you need to score high in MDCAT 2025.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" style={{
            padding: '0.875rem 2rem', borderRadius: 10,
            background: 'linear-gradient(135deg, #3366ff, #6644ff)',
            color: 'white', textDecoration: 'none',
            fontSize: '1rem', fontWeight: 700,
            boxShadow: '0 8px 30px rgba(51,102,255,0.4)',
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          }}>
            Start Learning Free →
          </Link>
          <Link href="/login" style={{
            padding: '0.875rem 2rem', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
            fontSize: '1rem', fontWeight: 500,
          }}>
            View Demo
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: '2rem', justifyContent: 'center',
          marginTop: '3rem', flexWrap: 'wrap',
        }}>
          {[['10,000+', 'Practice MCQs'], ['180', 'MDCAT Pattern'], ['3 Subjects', 'Biology, Chem, Physics'], ['99.5%', 'Uptime SLA']].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#7ca3ff' }}>{val}</div>
              <div style={{ color: '#64748b', fontSize: '0.8125rem', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '2rem 1.5rem 5rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}>
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '1.75rem',
                transition: 'all 0.2s',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(51,102,255,0.2), rgba(102,68,255,0.2))',
                  border: '1px solid rgba(51,102,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
                  <Icon size={20} color="#7ca3ff" />
                </div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  {f.title}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {f.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '1.5rem',
        textAlign: 'center',
        color: '#475569',
        fontSize: '0.8125rem',
      }}>
        © 2025 ANALYZER ACADEMY. Built by NEXKODE. All rights reserved.
      </footer>
    </main>
  )
}
