import { NextResponse } from 'next/server'
import { requireStudent } from '@/lib/auth-guards'
import { startOrResumeAttempt } from '@/lib/exam-helpers'

/**
 * POST /api/exam/start
 * Starts a new exam attempt for the authenticated student.
 * Enforces: max attempts, window check, single active attempt per test.
 * Returns: attempt ID + server deadline + randomized sanitized questions.
 * CRITICAL: correct answers are NEVER returned (EX-22, NFR-S5).
 */
export async function POST(req: Request) {
  const { session, error } = await requireStudent()
  if (error) return error

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { testId } = body as { testId?: string }
  if (!testId) return NextResponse.json({ error: 'testId required' }, { status: 400 })

  const result = await startOrResumeAttempt({
    userId: session!.user.id,
    testId,
  })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status || 400 })
  }

  return NextResponse.json(result.data)
}
