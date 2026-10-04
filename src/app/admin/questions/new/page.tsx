import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AddQuestionForm from '@/components/AddQuestionForm'

export const metadata = { title: 'Add Question — Admin' }

export default async function NewQuestionPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  const [subjects, chapters] = await Promise.all([
    prisma.subject.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.chapter.findMany({ select: { id: true, name: true, subjectId: true }, orderBy: { name: 'asc' } }),
  ])

  return <AddQuestionForm subjects={subjects} chapters={chapters} />
}
