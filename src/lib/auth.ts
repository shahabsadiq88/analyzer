import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'fallback_secret_for_jwt_tokens_2026',
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.email.toLowerCase() },
              { username: credentials.email.toLowerCase() },
            ],
            isActive: true,
            deletedAt: null,
          },
          include: {
            studentProfile: true,
            teacherProfile: true,
          },
        })

        if (!user) {
          throw new Error('Invalid credentials')
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!passwordMatch) {
          throw new Error('Invalid credentials')
        }

        const fullName =
          user.studentProfile?.fullName ||
          user.teacherProfile?.fullName ||
          user.email

        return {
          id: user.id,
          email: user.email,
          name: fullName,
          role: user.role,
          profileId: user.studentProfile?.id || user.teacherProfile?.id || null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.profileId = (user as any).profileId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.profileId = token.profileId as string | null
      }
      return session
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log login event for audit trail (EX-18)
      if (user.id) {
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: 'LOGIN',
            entityType: 'User',
            entityId: user.id,
            newValue: { timestamp: new Date().toISOString() },
          },
        }).catch(console.error) // Don't fail login if audit log fails
      }
    },
  },
}
