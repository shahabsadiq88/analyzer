import { z } from 'zod'
import { NextResponse } from 'next/server'

/**
 * Validate a request body against a Zod schema.
 * Returns parsed data or an error NextResponse.
 */
export async function validateBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: NextResponse }> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return {
      data: null,
      error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    }
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        },
        { status: 422 }
      ),
    }
  }

  return { data: result.data, error: null }
}

/**
 * Validate query params against a Zod schema.
 */
export function validateParams<T extends z.ZodTypeAny>(
  params: Record<string, string | string[]>,
  schema: T
): { data: z.infer<T>; error: null } | { data: null; error: NextResponse } {
  const result = schema.safeParse(params)
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        {
          error: 'Invalid parameters',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      ),
    }
  }
  return { data: result.data, error: null }
}

// ============================================================
// Common Zod Schemas
// ============================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const idSchema = z.object({
  id: z.string().cuid(),
})

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name required'),
  role: z.enum(['STUDENT', 'TEACHER']).default('STUDENT'),
  phone: z.string().optional(),
  city: z.string().optional(),
})

export const createCourseSchema = z.object({
  name: z.string().min(1, 'Course name required').max(200),
  description: z.string().optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
})

export const createSubjectSchema = z.object({
  courseId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  order: z.number().int().default(0),
})

export const createChapterSchema = z.object({
  subjectId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  order: z.number().int().default(0),
})

export const createQuestionSchema = z.object({
  subjectId: z.string().cuid().optional(),
  chapterId: z.string().cuid().optional(),
  topicId: z.string().cuid().optional(),
  text: z.string().min(10, 'Question text too short'),
  explanation: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  source: z.string().optional(),
  tags: z.array(z.string()).default([]),
  options: z.array(z.object({
    text: z.string().min(1, 'Option text required'),
    isCorrect: z.boolean(),
    order: z.number().int().default(0),
  })).min(2, 'At least 2 options').max(6),
}).refine(
  (data) => data.options.filter(o => o.isCorrect).length === 1,
  { message: 'Exactly one option must be marked as correct' }
)

export const createTestSchema = z.object({
  courseId: z.string().cuid().optional(),
  subjectId: z.string().cuid().optional(),
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  type: z.enum(['SCHEDULED', 'PRACTICE']).default('SCHEDULED'),
  durationMinutes: z.number().int().min(1).max(720),
  windowStart: z.string().datetime().optional(),
  windowEnd: z.string().datetime().optional(),
  maxAttempts: z.number().int().min(1).default(1),
  marksPerQuestion: z.number().positive().default(1),
  negativeMarking: z.boolean().default(false),
  negativeMarkValue: z.number().min(0).max(1).default(0.25),
  passPercentage: z.number().min(0).max(100).default(50),
  randomizeQuestions: z.boolean().default(true),
  randomizeOptions: z.boolean().default(true),
  scoreVisibility: z.enum(['IMMEDIATELY', 'AFTER_WINDOW', 'NEVER', 'MANUAL']).default('IMMEDIATELY'),
  answersVisibility: z.enum(['IMMEDIATELY', 'AFTER_WINDOW', 'NEVER', 'MANUAL']).default('AFTER_WINDOW'),
  explanationsVisibility: z.enum(['IMMEDIATELY', 'AFTER_WINDOW', 'NEVER', 'MANUAL']).default('AFTER_WINDOW'),
  questionIds: z.array(z.string().cuid()).min(1, 'At least one question required'),
})

export const submitAnswerSchema = z.object({
  attemptId: z.string().cuid(),
  questionId: z.string().cuid(),
  selectedOptionId: z.string().cuid().nullable(),
})

export const submitAttemptSchema = z.object({
  attemptId: z.string().cuid(),
})
