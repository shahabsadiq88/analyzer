import { prisma } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

interface AuditParams {
  actorId?: string
  targetUserId?: string
  action: AuditAction
  entityType: string
  entityId: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  reason?: string
  ipAddress?: string
}

/**
 * Write an audit log entry.
 * Failures are caught and logged to console — audit log issues must never crash the main operation.
 */
export async function auditLog(params: AuditParams): Promise<void> {
  try {
    // Cast to any to bypass complex Prisma union type — runtime fields are validated by DB constraints
    await prisma.auditLog.create({ data: params as any })
  } catch (error) {
    console.error('[AuditLog] Failed to write audit entry:', error, params)
  }
}

/**
 * Calculate scoring for an attempt.
 * IMPORTANT: This runs server-side only. Correct answers are never sent to the client.
 */
export async function calculateScore(attemptId: string): Promise<{
  totalMarks: number
  obtainedMarks: number
  percentage: number
  isPassed: boolean
  correctCount: number
  wrongCount: number
  skippedCount: number
  negativeMarks: number
  subjectBreakdown: Record<string, { correct: number; wrong: number; skipped: number; marks: number }>
}> {
  const attempt = await prisma.attempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: {
      test: true,
      questions: {
        include: {
          version: {
            include: {
              options: { select: { id: true, isCorrect: true } },
            },
          },
        },
      },
      answers: {
        include: {
          selectedOption: { select: { id: true, isCorrect: true } },
        },
      },
    },
  })

  const { test } = attempt
  const marksPerQ = Number(test.marksPerQuestion)
  const negativeMarkValue = Number(test.negativeMarkValue)
  const totalQuestions = attempt.questions.length
  const totalMarks = totalQuestions * marksPerQ

  let correctCount = 0
  let wrongCount = 0
  let skippedCount = 0
  let negativeMarks = 0
  let obtainedMarks = 0

  const subjectBreakdown: Record<string, { correct: number; wrong: number; skipped: number; marks: number }> = {}

  // Build answer map for quick lookup
  const answerMap = new Map(attempt.answers.map(a => [a.questionId, a]))

  for (const aq of attempt.questions) {
    const answer = answerMap.get(aq.questionId)
    const correctOptionId = aq.version.options.find(o => o.isCorrect)?.id

    // Get subject ID from question
    const question = await prisma.question.findUnique({
      where: { id: aq.questionId },
      select: { subjectId: true, subject: { select: { name: true } } },
    })
    const subjectKey = question?.subject?.name || 'Unknown'

    if (!subjectBreakdown[subjectKey]) {
      subjectBreakdown[subjectKey] = { correct: 0, wrong: 0, skipped: 0, marks: 0 }
    }

    if (!answer?.selectedOptionId) {
      // Skipped — no penalty
      skippedCount++
      subjectBreakdown[subjectKey].skipped++
    } else if (answer.selectedOptionId === correctOptionId) {
      // Correct
      correctCount++
      obtainedMarks += marksPerQ
      subjectBreakdown[subjectKey].correct++
      subjectBreakdown[subjectKey].marks += marksPerQ
    } else {
      // Wrong
      wrongCount++
      if (test.negativeMarking) {
        const deduction = marksPerQ * negativeMarkValue
        negativeMarks += deduction
        obtainedMarks -= deduction
        subjectBreakdown[subjectKey].marks -= deduction
      }
      subjectBreakdown[subjectKey].wrong++
    }
  }

  obtainedMarks = Math.max(0, obtainedMarks) // Never negative total
  const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0
  const isPassed = percentage >= Number(test.passPercentage)

  return {
    totalMarks,
    obtainedMarks,
    percentage: Math.round(percentage * 100) / 100,
    isPassed,
    correctCount,
    wrongCount,
    skippedCount,
    negativeMarks,
    subjectBreakdown,
  }
}

/**
 * Check if answers/explanations should be visible to the student now.
 */
export function isAnswerVisible(
  visibility: string,
  windowEnd: Date | null,
  submittedAt: Date | null
): boolean {
  const now = new Date()
  switch (visibility) {
    case 'IMMEDIATELY': return true
    case 'NEVER': return false
    case 'AFTER_WINDOW':
      if (!windowEnd) return true // Practice test
      return now > new Date(windowEnd)
    case 'MANUAL': return false // Admin must release manually
    default: return false
  }
}

/**
 * Get client-safe question data (strips correct answer flags during active attempt).
 * CRITICAL: This function enforces NFR-S5 / EX-22.
 */
export function sanitizeQuestionForClient(
  question: any,
  attemptStatus: string,
  answersVisible: boolean
) {
  if (attemptStatus === 'IN_PROGRESS') {
    // NEVER include correct answer info during active test
    return {
      ...question,
      options: question.options?.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        imageUrl: opt.imageUrl,
        order: opt.order,
        // isCorrect: OMITTED intentionally
        // explanation: OMITTED intentionally
      })),
      explanation: undefined, // Strip explanation
    }
  }

  if (!answersVisible) {
    // After submit but before visibility window — show options without correct flag
    return {
      ...question,
      options: question.options?.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        imageUrl: opt.imageUrl,
        order: opt.order,
      })),
      explanation: undefined,
    }
  }

  // Answers are visible — return full data
  return question
}
