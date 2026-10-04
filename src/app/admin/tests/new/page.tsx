import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import TestBuilderForm from '@/components/TestBuilderForm'

export const metadata = { title: 'New Test — Admin' }

export default async function NewTestPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  const [courses, subjects] = await Promise.all([
    prisma.course.findMany({ select: { id: true, name: true }, where: { isActive: true } }),
    prisma.subject.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  return <TestBuilderForm courses={courses} subjects={subjects} />
}
