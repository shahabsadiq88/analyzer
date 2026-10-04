import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

// Route protection map — role-based access control enforced server-side (NFR-S3)
const protectedRoutes = {
  '/admin': ['ADMIN'],
  '/teacher': ['ADMIN', 'TEACHER'],
  '/dashboard': ['STUDENT', 'ADMIN', 'TEACHER'],
  '/exam': ['STUDENT'],
  '/results': ['STUDENT', 'ADMIN', 'TEACHER'],
} as const

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // Check if this is a protected route
  const matchedRoute = Object.entries(protectedRoutes).find(([route]) =>
    pathname.startsWith(route)
  )

  if (matchedRoute) {
    const [, allowedRoles] = matchedRoute

    // Not authenticated → redirect to login
    if (!token) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Wrong role → redirect to their appropriate dashboard
    const userRole = token.role as string
    if (!(allowedRoles as readonly string[]).includes(userRole)) {
      if (userRole === 'ADMIN') return NextResponse.redirect(new URL('/admin', req.url))
      if (userRole === 'TEACHER') return NextResponse.redirect(new URL('/teacher', req.url))
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Redirect authenticated users away from /login
  if (pathname === '/login' && token) {
    const role = token.role as string
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', req.url))
    if (role === 'TEACHER') return NextResponse.redirect(new URL('/teacher', req.url))
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  routes: [
    '/admin/:path*',
    '/teacher/:path*',
    '/dashboard/:path*',
    '/exam/:path*',
    '/results/:path*',
    '/login',
  ],
}
