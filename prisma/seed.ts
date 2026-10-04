import { PrismaClient, Role, QuestionDifficulty, QuestionStatus, TestType, VisibilityOption } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding MDCAT Academy LMS...')

  // ============================================================
  // 1. Admin User
  // ============================================================
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mdcatacademy.com' },
    update: {},
    create: {
      email: 'admin@mdcatacademy.com',
      username: 'admin',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // ============================================================
  // 2. Teacher User
  // ============================================================
  const teacherPassword = await bcrypt.hash('teacher123', 12)
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@mdcatacademy.com' },
    update: {},
    create: {
      email: 'teacher@mdcatacademy.com',
      username: 'drsmith',
      passwordHash: teacherPassword,
      role: Role.TEACHER,
      teacherProfile: {
        create: {
          fullName: 'Dr. Ahmad Ali',
          bio: 'MBBS, FCPS. 10 years MDCAT coaching experience.',
          phone: '+92-300-0000000',
        },
      },
    },
  })
  console.log('✅ Teacher created:', teacher.email)

  // ============================================================
  // 3. Student Users
  // ============================================================
  const studentPassword = await bcrypt.hash('student123', 12)
  const student1 = await prisma.user.upsert({
    where: { email: 'ali@student.com' },
    update: {},
    create: {
      email: 'ali@student.com',
      username: 'ali_student',
      passwordHash: studentPassword,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          fullName: 'Ali Hassan',
          phone: '+92-321-1234567',
          city: 'Lahore',
          targetYear: 2025,
        },
      },
    },
  })

  const student2 = await prisma.user.upsert({
    where: { email: 'sara@student.com' },
    update: {},
    create: {
      email: 'sara@student.com',
      username: 'sara_student',
      passwordHash: studentPassword,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          fullName: 'Sara Khan',
          phone: '+92-333-9876543',
          city: 'Karachi',
          targetYear: 2025,
        },
      },
    },
  })
  console.log('✅ Students created:', student1.email, student2.email)

  // ============================================================
  // 4. Course: MDCAT Preparation 2025
  // ============================================================
  const course = await prisma.course.upsert({
    where: { slug: 'mdcat-2025' },
    update: {},
    create: {
      name: 'MDCAT Preparation 2025',
      slug: 'mdcat-2025',
      description: 'Complete MDCAT preparation course covering Biology, Chemistry, Physics, and English.',
      isActive: true,
      order: 1,
    },
  })
  console.log('✅ Course created:', course.name)

  // ============================================================
  // 5. Subjects
  // ============================================================
  const biologySubject = await prisma.subject.upsert({
    where: { id: 'subject-biology' },
    update: {},
    create: {
      id: 'subject-biology',
      courseId: course.id,
      name: 'Biology',
      description: 'Cell biology, genetics, ecology, physiology and more.',
      order: 1,
    },
  })

  const chemSubject = await prisma.subject.upsert({
    where: { id: 'subject-chemistry' },
    update: {},
    create: {
      id: 'subject-chemistry',
      courseId: course.id,
      name: 'Chemistry',
      description: 'Organic, inorganic and physical chemistry.',
      order: 2,
    },
  })

  const physicsSubject = await prisma.subject.upsert({
    where: { id: 'subject-physics' },
    update: {},
    create: {
      id: 'subject-physics',
      courseId: course.id,
      name: 'Physics',
      description: 'Mechanics, waves, electricity, and modern physics.',
      order: 3,
    },
  })
  console.log('✅ Subjects created: Biology, Chemistry, Physics')

  // ============================================================
  // 6. Chapter: Cell Biology
  // ============================================================
  const cellBioChapter = await prisma.chapter.upsert({
    where: { id: 'chapter-cell-biology' },
    update: {},
    create: {
      id: 'chapter-cell-biology',
      subjectId: biologySubject.id,
      name: 'Cell Biology',
      description: 'Cell structure, organelles, cell division, and membrane transport.',
      order: 1,
    },
  })

  const geneticsChapter = await prisma.chapter.upsert({
    where: { id: 'chapter-genetics' },
    update: {},
    create: {
      id: 'chapter-genetics',
      subjectId: biologySubject.id,
      name: 'Genetics',
      description: 'DNA, RNA, protein synthesis, inheritance patterns.',
      order: 2,
    },
  })
  console.log('✅ Chapters created: Cell Biology, Genetics')

  // ============================================================
  // 7. Topics
  // ============================================================
  const cellStructureTopic = await prisma.topic.create({
    data: {
      chapterId: cellBioChapter.id,
      name: 'Cell Structure & Organelles',
      order: 1,
    },
  }).catch(() => prisma.topic.findFirst({ where: { chapterId: cellBioChapter.id, name: 'Cell Structure & Organelles' } }))

  // ============================================================
  // 8. Lectures (MVP: YouTube URLs)
  // ============================================================
  const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId: teacher.id } })

  await prisma.lecture.upsert({
    where: { id: 'lecture-cell-intro' },
    update: {},
    create: {
      id: 'lecture-cell-intro',
      chapterId: cellBioChapter.id,
      teacherId: teacherProfile?.id,
      title: 'Introduction to Cell Biology',
      description: 'Overview of prokaryotic and eukaryotic cells.',
      videoUrl: 'https://www.youtube.com/watch?v=URUJD5NEXC8',
      videoDuration: 1800,
      order: 1,
      isPublished: true,
    },
  })

  await prisma.lecture.upsert({
    where: { id: 'lecture-cell-organelles' },
    update: {},
    create: {
      id: 'lecture-cell-organelles',
      chapterId: cellBioChapter.id,
      teacherId: teacherProfile?.id,
      title: 'Cell Organelles in Detail',
      description: 'Mitochondria, ER, Golgi apparatus, ribosomes, and more.',
      videoUrl: 'https://www.youtube.com/watch?v=lHYRZaVMbOk',
      videoDuration: 2400,
      order: 2,
      isPublished: true,
    },
  })

  await prisma.lecture.upsert({
    where: { id: 'lecture-cell-division' },
    update: {},
    create: {
      id: 'lecture-cell-division',
      chapterId: cellBioChapter.id,
      teacherId: teacherProfile?.id,
      title: 'Cell Division: Mitosis & Meiosis',
      description: 'Stages of mitosis and meiosis with diagrams.',
      videoUrl: 'https://www.youtube.com/watch?v=f-ldPgEfAHI',
      videoDuration: 3000,
      order: 3,
      isPublished: true,
    },
  })
  console.log('✅ Lectures created (3 Cell Biology lectures)')

  // ============================================================
  // 9. Enrollments
  // ============================================================
  const student1Profile = await prisma.studentProfile.findUnique({ where: { userId: student1.id } })
  const student2Profile = await prisma.studentProfile.findUnique({ where: { userId: student2.id } })

  if (student1Profile) {
    await prisma.enrollment.upsert({
      where: { courseId_studentId: { courseId: course.id, studentId: student1Profile.id } },
      update: {},
      create: { courseId: course.id, studentId: student1Profile.id },
    })
  }
  if (student2Profile) {
    await prisma.enrollment.upsert({
      where: { courseId_studentId: { courseId: course.id, studentId: student2Profile.id } },
      update: {},
      create: { courseId: course.id, studentId: student2Profile.id },
    })
  }
  console.log('✅ Students enrolled in MDCAT 2025 course')

  // ============================================================
  // 10. Sample MCQs (Cell Biology — 10 questions)
  // ============================================================
  const sampleQuestions = [
    {
      text: 'Which organelle is known as the "powerhouse of the cell"?',
      explanation: 'Mitochondria produce ATP through cellular respiration, earning the nickname "powerhouse of the cell."',
      difficulty: QuestionDifficulty.EASY,
      options: [
        { text: 'Nucleus', isCorrect: false },
        { text: 'Mitochondria', isCorrect: true },
        { text: 'Ribosome', isCorrect: false },
        { text: 'Golgi apparatus', isCorrect: false },
      ],
    },
    {
      text: 'The fluid mosaic model of the cell membrane was proposed by:',
      explanation: 'Singer and Nicolson proposed the fluid mosaic model in 1972, describing the membrane as a dynamic structure.',
      difficulty: QuestionDifficulty.MEDIUM,
      options: [
        { text: 'Watson and Crick', isCorrect: false },
        { text: 'Singer and Nicolson', isCorrect: true },
        { text: 'Schleiden and Schwann', isCorrect: false },
        { text: 'Danielli and Davson', isCorrect: false },
      ],
    },
    {
      text: 'Which of the following is NOT found in a prokaryotic cell?',
      explanation: 'Prokaryotes lack membrane-bound organelles including the nucleus, mitochondria, and Golgi apparatus.',
      difficulty: QuestionDifficulty.EASY,
      options: [
        { text: 'Ribosome', isCorrect: false },
        { text: 'Cell membrane', isCorrect: false },
        { text: 'Mitochondria', isCorrect: true },
        { text: 'DNA', isCorrect: false },
      ],
    },
    {
      text: 'During which phase of mitosis do chromosomes align at the cell\'s equator?',
      explanation: 'During Metaphase, chromosomes are arranged along the metaphase plate (cell equator).',
      difficulty: QuestionDifficulty.MEDIUM,
      options: [
        { text: 'Prophase', isCorrect: false },
        { text: 'Metaphase', isCorrect: true },
        { text: 'Anaphase', isCorrect: false },
        { text: 'Telophase', isCorrect: false },
      ],
    },
    {
      text: 'The process by which a cell engulfs large particles is called:',
      explanation: 'Phagocytosis is the process of engulfing large particles. Pinocytosis involves fluid uptake.',
      difficulty: QuestionDifficulty.EASY,
      options: [
        { text: 'Pinocytosis', isCorrect: false },
        { text: 'Exocytosis', isCorrect: false },
        { text: 'Phagocytosis', isCorrect: true },
        { text: 'Osmosis', isCorrect: false },
      ],
    },
    {
      text: 'Which organelle is responsible for protein synthesis?',
      explanation: 'Ribosomes are the sites of protein synthesis, translating mRNA into polypeptide chains.',
      difficulty: QuestionDifficulty.EASY,
      options: [
        { text: 'Golgi apparatus', isCorrect: false },
        { text: 'Lysosome', isCorrect: false },
        { text: 'Ribosome', isCorrect: true },
        { text: 'Vacuole', isCorrect: false },
      ],
    },
    {
      text: 'The centromere connects:',
      explanation: 'The centromere is the region connecting the two sister chromatids of a replicated chromosome.',
      difficulty: QuestionDifficulty.MEDIUM,
      options: [
        { text: 'Two homologous chromosomes', isCorrect: false },
        { text: 'Two sister chromatids', isCorrect: true },
        { text: 'A chromosome to the spindle fiber', isCorrect: false },
        { text: 'The nucleus to the cytoplasm', isCorrect: false },
      ],
    },
    {
      text: 'In meiosis, crossing over occurs during:',
      explanation: 'Crossing over occurs in Prophase I during meiosis, when homologous chromosomes exchange segments.',
      difficulty: QuestionDifficulty.HARD,
      options: [
        { text: 'Prophase I', isCorrect: true },
        { text: 'Metaphase II', isCorrect: false },
        { text: 'Anaphase I', isCorrect: false },
        { text: 'Telophase II', isCorrect: false },
      ],
    },
    {
      text: 'Which part of the cell membrane is hydrophobic?',
      explanation: 'The fatty acid tails of phospholipids are hydrophobic (water-repelling), forming the inner core of the bilayer.',
      difficulty: QuestionDifficulty.MEDIUM,
      options: [
        { text: 'Phosphate head', isCorrect: false },
        { text: 'Glycerol group', isCorrect: false },
        { text: 'Fatty acid tails', isCorrect: true },
        { text: 'Integral proteins', isCorrect: false },
      ],
    },
    {
      text: 'The number of chromosomes in a human somatic cell is:',
      explanation: 'Human somatic (body) cells are diploid (2n) with 46 chromosomes (23 pairs).',
      difficulty: QuestionDifficulty.EASY,
      options: [
        { text: '23', isCorrect: false },
        { text: '46', isCorrect: true },
        { text: '92', isCorrect: false },
        { text: '44', isCorrect: false },
      ],
    },
  ]

  for (let i = 0; i < sampleQuestions.length; i++) {
    const q = sampleQuestions[i]
    const question = await prisma.question.create({
      data: {
        subjectId: biologySubject.id,
        chapterId: cellBioChapter.id,
        difficulty: q.difficulty,
        status: QuestionStatus.ACTIVE,
        text: q.text,
      },
    })

    const version = await prisma.questionVersion.create({
      data: {
        questionId: question.id,
        versionNumber: 1,
        text: q.text,
        explanation: q.explanation,
        options: {
          create: q.options.map((opt, idx) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: idx,
          })),
        },
      },
    })

    await prisma.question.update({
      where: { id: question.id },
      data: { currentVersionId: version.id },
    })
  }
  console.log('✅ 10 sample Cell Biology MCQs created')

  // ============================================================
  // 11. Sample Test: Cell Biology Quiz
  // ============================================================
  const questions = await prisma.question.findMany({
    where: { chapterId: cellBioChapter.id, status: QuestionStatus.ACTIVE },
  })

  const sampleTest = await prisma.test.create({
    data: {
      courseId: course.id,
      subjectId: biologySubject.id,
      title: 'Cell Biology Quiz',
      description: 'A 10-question quiz covering cell structure, organelles, and cell division.',
      type: TestType.PRACTICE,
      durationMinutes: 15,
      maxAttempts: 3,
      marksPerQuestion: 1,
      negativeMarking: false,
      passPercentage: 50,
      randomizeQuestions: true,
      randomizeOptions: true,
      scoreVisibility: VisibilityOption.IMMEDIATELY,
      answersVisibility: VisibilityOption.IMMEDIATELY,
      explanationsVisibility: VisibilityOption.IMMEDIATELY,
      isPublished: true,
      publishedAt: new Date(),
      testQuestions: {
        create: questions.map((q, idx) => ({
          questionId: q.id,
          order: idx + 1,
        })),
      },
    },
  })
  console.log('✅ Sample test created:', sampleTest.title)

  // ============================================================
  // 12. Announcement
  // ============================================================
  await prisma.announcement.create({
    data: {
      title: 'Welcome to MDCAT Academy 2025!',
      content: 'Your journey to medical school starts here. Access your lectures and practice tests from the dashboard. Best of luck!',
      isActive: true,
      createdBy: admin.id,
    },
  })
  console.log('✅ Welcome announcement created')

  console.log('\n🎉 Seeding complete!')
  console.log('\n📋 Login credentials:')
  console.log('   Admin:   admin@mdcatacademy.com / admin123')
  console.log('   Teacher: teacher@mdcatacademy.com / teacher123')
  console.log('   Student: ali@student.com / student123')
  console.log('   Student: sara@student.com / student123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
