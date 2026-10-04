import { NextResponse } from 'next/server'
import { getServerSession, Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Role } from '@prisma/client'

type AuthResult =
  | { session: Session; error: null }
  | { session: null; error: NextResponse }

/** 
 * Gets the current session and enforces authentication.
 * Returns an error NextResponse if unauthenticated.
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { session, error: null }
}

/**
 * Gets the current session and enforces a specific role.
 * Returns 401 if unauthenticated, 403 if wrong role.
 */
export async function requireRole(...roles: Role[]): Promise<AuthResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  if (!roles.includes(session.user.role)) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }
  return { session, error: null }
}

/** Shorthand: admin only */
export const requireAdmin = () => requireRole(Role.ADMIN)

/** Shorthand: admin or teacher */
export const requireTeacher = () => requireRole(Role.ADMIN, Role.TEACHER)

/** Shorthand: any authenticated user */
export const requireStudent = () => requireRole(Role.STUDENT, Role.ADMIN, Role.TEACHER)
