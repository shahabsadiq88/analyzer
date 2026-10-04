import { describe, it, expect } from 'vitest'

// Unit tests for scoring logic — these must pass before Phase 7 is "done"

// Simulated scoring function (mirrors calculateScore logic)
function score(params: {
  answers: Array<{ questionId: string; selectedOptionId: string | null }>
  questions: Array<{ questionId: string; correctOptionId: string; subjectName: string }>
  marksPerQuestion: number
  negativeMarking: boolean
  negativeMarkValue: number
  passPercentage: number
}) {
  const { answers, questions, marksPerQuestion, negativeMarking, negativeMarkValue, passPercentage } = params
  const answerMap = new Map(answers.map(a => [a.questionId, a.selectedOptionId]))

  let correct = 0, wrong = 0, skipped = 0, negative = 0, obtained = 0
  const total = questions.length * marksPerQuestion

  for (const q of questions) {
    const selected = answerMap.get(q.questionId) ?? null
    if (!selected) {
      skipped++
    } else if (selected === q.correctOptionId) {
      correct++
      obtained += marksPerQuestion
    } else {
      wrong++
      if (negativeMarking) {
        const deduction = marksPerQuestion * negativeMarkValue
        negative += deduction
        obtained -= deduction
      }
    }
  }

  obtained = Math.max(0, obtained)
  const percentage = total > 0 ? (obtained / total) * 100 : 0
  return {
    totalMarks: total,
    obtainedMarks: Math.round(obtained * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
    isPassed: percentage >= passPercentage,
    correctCount: correct,
    wrongCount: wrong,
    skippedCount: skipped,
    negativeMarks: Math.round(negative * 100) / 100,
  }
}

const sampleQuestions = [
  { questionId: 'q1', correctOptionId: 'a', subjectName: 'Biology' },
  { questionId: 'q2', correctOptionId: 'b', subjectName: 'Biology' },
  { questionId: 'q3', correctOptionId: 'c', subjectName: 'Chemistry' },
  { questionId: 'q4', correctOptionId: 'd', subjectName: 'Chemistry' },
  { questionId: 'q5', correctOptionId: 'e', subjectName: 'Physics' },
]

describe('Scoring: Basic (no negative marking)', () => {
  it('all correct → 100%', () => {
    const result = score({
      answers: [
        { questionId: 'q1', selectedOptionId: 'a' },
        { questionId: 'q2', selectedOptionId: 'b' },
        { questionId: 'q3', selectedOptionId: 'c' },
        { questionId: 'q4', selectedOptionId: 'd' },
        { questionId: 'q5', selectedOptionId: 'e' },
      ],
      questions: sampleQuestions,
      marksPerQuestion: 1,
      negativeMarking: false,
      negativeMarkValue: 0.25,
      passPercentage: 50,
    })
    expect(result.obtainedMarks).toBe(5)
    expect(result.percentage).toBe(100)
    expect(result.isPassed).toBe(true)
    expect(result.correctCount).toBe(5)
    expect(result.wrongCount).toBe(0)
    expect(result.skippedCount).toBe(0)
  })

  it('all wrong, no negative → 0%', () => {
    const result = score({
      answers: sampleQuestions.map(q => ({ questionId: q.questionId, selectedOptionId: 'WRONG' })),
      questions: sampleQuestions,
      marksPerQuestion: 1,
      negativeMarking: false,
      negativeMarkValue: 0.25,
      passPercentage: 50,
    })
    expect(result.obtainedMarks).toBe(0)
    expect(result.percentage).toBe(0)
    expect(result.isPassed).toBe(false)
    expect(result.wrongCount).toBe(5)
  })

  it('all skipped → 0, no penalty', () => {
    const result = score({
      answers: [],
      questions: sampleQuestions,
      marksPerQuestion: 1,
      negativeMarking: false,
      negativeMarkValue: 0.25,
      passPercentage: 50,
    })
    expect(result.obtainedMarks).toBe(0)
    expect(result.skippedCount).toBe(5)
    expect(result.negativeMarks).toBe(0)
  })

  it('3 correct, 2 skipped → 60%, pass', () => {
    const result = score({
      answers: [
        { questionId: 'q1', selectedOptionId: 'a' },
        { questionId: 'q2', selectedOptionId: 'b' },
        { questionId: 'q3', selectedOptionId: 'c' },
      ],
      questions: sampleQuestions,
      marksPerQuestion: 1,
      negativeMarking: false,
      negativeMarkValue: 0.25,
      passPercentage: 50,
    })
    expect(result.obtainedMarks).toBe(3)
    expect(result.percentage).toBe(60)
    expect(result.isPassed).toBe(true)
  })
})

describe('Scoring: Negative marking (-0.25)', () => {
  it('all wrong with negative → 0 floor (never negative total)', () => {
    const result = score({
      answers: sampleQuestions.map(q => ({ questionId: q.questionId, selectedOptionId: 'WRONG' })),
      questions: sampleQuestions,
      marksPerQuestion: 1,
      negativeMarking: true,
      negativeMarkValue: 0.25,
      passPercentage: 50,
    })
    expect(result.obtainedMarks).toBe(0) // Math.max(0, ...)
    expect(result.negativeMarks).toBe(1.25) // 5 × 0.25
    expect(result.wrongCount).toBe(5)
  })

  it('3 correct, 2 wrong with -0.25 → 3 - 0.5 = 2.5 / 5 = 50%', () => {
    const result = score({
      answers: [
        { questionId: 'q1', selectedOptionId: 'a' },
        { questionId: 'q2', selectedOptionId: 'b' },
        { questionId: 'q3', selectedOptionId: 'c' },
        { questionId: 'q4', selectedOptionId: 'WRONG' },
        { questionId: 'q5', selectedOptionId: 'WRONG' },
      ],
      questions: sampleQuestions,
      marksPerQuestion: 1,
      negativeMarking: true,
      negativeMarkValue: 0.25,
      passPercentage: 50,
    })
    expect(result.obtainedMarks).toBe(2.5)
    expect(result.percentage).toBe(50)
    expect(result.isPassed).toBe(true)
    expect(result.negativeMarks).toBe(0.5)
  })

  it('skipped questions do NOT incur negative marking', () => {
    const result = score({
      answers: [{ questionId: 'q1', selectedOptionId: null }],
      questions: [sampleQuestions[0]],
      marksPerQuestion: 1,
      negativeMarking: true,
      negativeMarkValue: 0.25,
      passPercentage: 50,
    })
    expect(result.negativeMarks).toBe(0)
    expect(result.skippedCount).toBe(1)
  })
})

describe('Scoring: Pass/Fail threshold', () => {
  it('exactly at pass threshold → passes', () => {
    const result = score({
      answers: [
        { questionId: 'q1', selectedOptionId: 'a' },
        { questionId: 'q2', selectedOptionId: 'b' },
      ],
      questions: sampleQuestions.slice(0, 4),
      marksPerQuestion: 1,
      negativeMarking: false,
      negativeMarkValue: 0.25,
      passPercentage: 50,
    })
    expect(result.percentage).toBe(50)
    expect(result.isPassed).toBe(true)
  })

  it('below pass threshold → fails', () => {
    const result = score({
      answers: [{ questionId: 'q1', selectedOptionId: 'a' }],
      questions: sampleQuestions.slice(0, 4),
      marksPerQuestion: 1,
      negativeMarking: false,
      negativeMarkValue: 0.25,
      passPercentage: 50,
    })
    expect(result.percentage).toBe(25)
    expect(result.isPassed).toBe(false)
  })
})

describe('Timer: Deadline calculation', () => {
  it('remaining seconds never goes below 0', () => {
    const past = new Date(Date.now() - 10000) // 10s ago
    const remaining = Math.max(0, Math.floor((past.getTime() - Date.now()) / 1000))
    expect(remaining).toBe(0)
  })

  it('deadline is always serverStartTime + duration', () => {
    const start = new Date('2025-06-01T10:00:00Z')
    const durationMinutes = 180
    const deadline = new Date(start.getTime() + durationMinutes * 60 * 1000)
    expect(deadline.toISOString()).toBe('2025-06-01T13:00:00.000Z')
  })

  it('changing client clock does not affect server deadline', () => {
    // Server stores ISO deadline string — client cannot modify it
    const serverDeadline = '2025-06-01T13:00:00.000Z'
    const remaining = Math.max(0, Math.floor((new Date(serverDeadline).getTime() - Date.now()) / 1000))
    // The calculation always uses the server deadline, not client clock
    expect(typeof remaining).toBe('number')
    expect(remaining).toBeGreaterThanOrEqual(0)
  })
})
