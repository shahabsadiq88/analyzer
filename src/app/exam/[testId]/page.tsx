import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ExamEngine from '@/components/ExamEngine'
import { startOrResumeAttempt } from '@/lib/exam-helpers'
import Link from 'next/link'

export const metadata = { title: 'Exam' }

// No Sidebar layout for exam — full-screen, distraction free
export default async function ExamPage({
  params,
}: {
  params: Promise<{ testId: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'STUDENT') redirect('/dashboard')

  const { testId } = await params

  try {
    const result = await startOrResumeAttempt({
      userId: session.user.id,
      testId,
    })

    if (result.error || !result.data) {
      return (
        <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ textAlign: 'center', color: 'white', maxWidth: 440, width: '100%', padding: '2.5rem', background: '#1e293b', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.75rem' }}>Cannot Start Test</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>{result.error || 'Something went wrong while starting the test.'}</p>
            <Link href="/dashboard/tests" style={{
              display: 'inline-block', padding: '0.75rem 1.75rem', borderRadius: 10,
              background: 'linear-gradient(135deg, #3366ff, #6644ff)',
              color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem',
              boxShadow: '0 4px 15px rgba(51,102,255,0.3)',
            }}>
              ← Back to Tests
            </Link>
          </div>
        </div>
      )
    }

    return <ExamEngine exam={result.data} />
  } catch (err: any) {
    console.error('Error starting exam attempt:', err)
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', color: 'white', maxWidth: 440, width: '100%', padding: '2.5rem', background: '#1e293b', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.75rem' }}>Error Loading Test</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>{err?.message || 'An unexpected error occurred while loading this test.'}</p>
          <Link href="/dashboard/tests" style={{
            display: 'inline-block', padding: '0.75rem 1.75rem', borderRadius: 10,
            background: 'linear-gradient(135deg, #3366ff, #6644ff)',
            color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem',
            boxShadow: '0 4px 15px rgba(51,102,255,0.3)',
          }}>
            ← Back to Tests
          </Link>
        </div>
      </div>
    )
  }
}
