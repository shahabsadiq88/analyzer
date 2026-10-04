import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ExamEngine from '@/components/ExamEngine'

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

  // Start or resume attempt via API (server-to-server call)
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const headersList = await (await import('next/headers')).headers()
  const cookieHeader = headersList.get('cookie') || ''

  const res = await fetch(`${baseUrl}/api/exam/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ testId }),
    cache: 'no-store',
  })

  let data: any = null
  try {
    data = await res.json()
  } catch (err) {
    console.error('Failed to parse exam start response JSON:', err)
  }

  if (!res.ok || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white', maxWidth: 400, padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, marginBottom: '0.75rem' }}>Cannot Start Test</h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{data?.error || 'Something went wrong while starting the test.'}</p>
          <a href="/dashboard/tests" style={{ color: '#7ca3ff', textDecoration: 'none' }}>← Back to Tests</a>
        </div>
      </div>
    )
  }

  return <ExamEngine exam={data} />
}
