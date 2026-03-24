export const dynamic = 'force-dynamic';

/**
 * Adaptive Learning Path API
 * GET  /api/lms/learning-path?courseId=xxx → returns personalized learning path
 * POST /api/lms/learning-path → generates a new adaptive path
 *
 * Algorithm:
 * 1. Topological sort of concept prerequisites (DAG)
 * 2. Skip concepts already mastered (from diagnostic or prior mastery)
 * 3. Inject remediation steps for prerequisite failures
 * 4. Map concepts to lessons and quizzes
 *
 * SEC-HARDENING: Wrapped with withUserGuard for centralized auth + CSRF + rate limiting.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withUserGuard } from '@/lib/user-api-guard';
import { prisma } from '@/lib/db';

const generatePathSchema = z.object({
  courseId: z.string().min(1),
  goalConcepts: z.array(z.string().min(1)).optional(), // Specific concepts to target; defaults to all course concepts
});

export const GET = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');
  const userId = session.user.id!;

  if (courseId) {
    // Find learning paths for this specific course
    const paths = await prisma.lmsLearningPath.findMany({
      where: { tenantId, userId, status: 'ACTIVE' },
      include: {
        steps: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    // Filter to paths whose goalConcepts overlap with course concepts
    const courseLessons = await prisma.course.findFirst({
      where: { id: courseId, tenantId },
      include: {
        chapters: {
          include: { lessons: { select: { id: true } } },
        },
      },
    });

    if (!courseLessons) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const lessonIds = courseLessons.chapters.flatMap(ch => ch.lessons.map(l => l.id));
    const conceptMappings = await prisma.lmsConceptLessonMap.findMany({
      where: { lessonId: { in: lessonIds } },
      select: { conceptId: true },
    });
    const courseConceptIds = new Set(conceptMappings.map(m => m.conceptId));

    // Return paths that target this course's concepts
    const relevantPaths = paths.filter(p =>
      p.goalConcepts.some(gc => courseConceptIds.has(gc))
    );

    if (relevantPaths.length === 0) {
      return NextResponse.json({
        path: null,
        message: 'No learning path generated yet for this course. POST to create one.',
      });
    }

    const path = relevantPaths[0];
    return NextResponse.json({
      path: formatPath(path),
    });
  }

  // Return all active learning paths for the student
  const paths = await prisma.lmsLearningPath.findMany({
    where: { tenantId, userId, status: { in: ['ACTIVE', 'PAUSED'] } },
    include: {
      steps: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({
    paths: paths.map(formatPath),
    total: paths.length,
  });
}, { skipCsrf: true });

export const POST = withUserGuard(async (request: NextRequest, { session }) => {
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = generatePathSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid learning path data' }, { status: 400 });
  }

  const { courseId, goalConcepts: explicitGoals } = parsed.data;
  const userId = session.user.id!;

  try {
    // 1. Get course and its lessons
    const course = await prisma.course.findFirst({
      where: { id: courseId, tenantId },
      include: {
        chapters: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, title: true, type: true, estimatedMinutes: true, quizId: true },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // 2. Get all concept mappings for course lessons
    const lessonIds = course.chapters.flatMap(ch => ch.lessons.map(l => l.id));
    const conceptMappings = await prisma.lmsConceptLessonMap.findMany({
      where: { lessonId: { in: lessonIds } },
      include: {
        concept: {
          select: { id: true, name: true, domain: true, targetBloomLevel: true },
        },
      },
    });

    const courseConceptIds = [...new Set(conceptMappings.map(m => m.conceptId))];
    const goalConceptIds = explicitGoals?.length ? explicitGoals : courseConceptIds;

    // 3. Build prerequisite graph
    const prereqs = await prisma.lmsConceptPrereq.findMany({
      where: {
        OR: [
          { conceptId: { in: courseConceptIds } },
          { prerequisiteId: { in: courseConceptIds } },
        ],
      },
    });

    // 4. Topological sort
    const sortedConceptIds = topologicalSort(courseConceptIds, prereqs);

    // 5. Get student's existing mastery
    const masteries = await prisma.lmsConceptMastery.findMany({
      where: { tenantId, userId, conceptId: { in: sortedConceptIds } },
    });
    const masteryMap = new Map(masteries.map(m => [m.conceptId, m]));

    // 6. Build concept lookup
    const allConcepts = await prisma.lmsConcept.findMany({
      where: { id: { in: sortedConceptIds }, tenantId },
      select: { id: true, name: true, targetBloomLevel: true, domain: true },
    });
    const conceptMap = new Map(allConcepts.map(c => [c.id, c]));

    // 7. Build lesson-to-concept mapping
    const lessonConceptMap = new Map<string, string[]>();
    for (const m of conceptMappings) {
      const list = lessonConceptMap.get(m.lessonId) || [];
      list.push(m.conceptId);
      lessonConceptMap.set(m.lessonId, list);
    }

    // 8. Build lesson lookup
    const lessonMap = new Map<string, { id: string; title: string; type: string; estimatedMinutes: number | null; quizId: string | null }>();
    for (const ch of course.chapters) {
      for (const l of ch.lessons) {
        lessonMap.set(l.id, l);
      }
    }

    // 9. Generate adaptive path steps
    interface PathStepInput {
      type: string;
      conceptId: string | null;
      lessonId: string | null;
      quizId: string | null;
      bloomLevel: number | null;
      skipped: boolean;
    }

    const steps: PathStepInput[] = [];

    for (const conceptId of sortedConceptIds) {
      // Skip if not in goal concepts and not a prerequisite of a goal
      if (!goalConceptIds.includes(conceptId)) continue;

      const concept = conceptMap.get(conceptId);
      const mastery = masteryMap.get(conceptId);
      const targetLevel = concept?.targetBloomLevel ?? 3;

      // Skip if already mastered at target level
      if (mastery && mastery.currentLevel >= targetLevel && mastery.confidence >= 0.7) {
        steps.push({
          type: 'LESSON',
          conceptId,
          lessonId: null,
          quizId: null,
          bloomLevel: targetLevel,
          skipped: true,
        });
        continue;
      }

      // Check prerequisite mastery for remediation
      const conceptPrereqs = prereqs.filter(p => p.conceptId === conceptId);
      for (const prereq of conceptPrereqs) {
        const prereqMastery = masteryMap.get(prereq.prerequisiteId);
        const prereqConcept = conceptMap.get(prereq.prerequisiteId);
        if (!prereqMastery || prereqMastery.currentLevel < (prereqConcept?.targetBloomLevel ?? 2)) {
          // Inject remediation for unmastered prerequisite
          const prereqLessons = conceptMappings.filter(m => m.conceptId === prereq.prerequisiteId);
          if (prereqLessons.length > 0) {
            steps.push({
              type: 'REMEDIATION',
              conceptId: prereq.prerequisiteId,
              lessonId: prereqLessons[0].lessonId ?? null,
              quizId: null,
              bloomLevel: prereqConcept?.targetBloomLevel ?? 2,
              skipped: false,
            });
          }
        }
      }

      // Add lesson steps for this concept
      const conceptLessons = conceptMappings
        .filter(m => m.conceptId === conceptId)
        .sort((a, b) => a.bloomLevel - b.bloomLevel);

      for (const cl of conceptLessons) {
        const lesson = lessonMap.get(cl.lessonId);
        steps.push({
          type: 'LESSON',
          conceptId,
          lessonId: cl.lessonId,
          quizId: lesson?.quizId ?? null,
          bloomLevel: cl.bloomLevel,
          skipped: false,
        });
      }

      // Add review step after lesson sequence
      steps.push({
        type: 'REVIEW',
        conceptId,
        lessonId: null,
        quizId: null,
        bloomLevel: targetLevel,
        skipped: false,
      });
    }

    // 10. Persist the learning path
    const path = await prisma.lmsLearningPath.create({
      data: {
        tenantId,
        userId,
        title: `Adaptive Path: ${course.title}`,
        goalConcepts: goalConceptIds,
        status: 'ACTIVE',
        totalSteps: steps.filter(s => !s.skipped).length,
        adaptedAt: new Date(),
        steps: {
          create: steps.map((s, idx) => ({
            sortOrder: idx,
            type: s.type,
            conceptId: s.conceptId,
            lessonId: s.lessonId,
            quizId: s.quizId,
            bloomLevel: s.bloomLevel,
            skipped: s.skipped,
          })),
        },
      },
      include: {
        steps: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json({
      path: formatPath(path),
      stats: {
        totalConcepts: sortedConceptIds.length,
        masteredConcepts: steps.filter(s => s.skipped).length,
        remediationSteps: steps.filter(s => s.type === 'REMEDIATION').length,
        activeSteps: steps.filter(s => !s.skipped).length,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      const safeMessages = ['Course not found', 'Circular dependency detected'];
      return NextResponse.json(
        { error: safeMessages.some(s => error.message.includes(s)) ? error.message : 'Failed to generate learning path' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to generate learning path' }, { status: 500 });
  }
});

// ── Topological Sort ──────────────────────────────────────────────────

/**
 * Topological sort of concept IDs based on prerequisite edges.
 * Prerequisites come before concepts that depend on them.
 * Uses Kahn's algorithm (BFS) for cycle detection.
 */
function topologicalSort(
  conceptIds: string[],
  prereqs: Array<{ conceptId: string; prerequisiteId: string }>
): string[] {
  const idSet = new Set(conceptIds);

  // Build adjacency list and in-degree count
  const adjacency = new Map<string, string[]>(); // prereq -> [concepts that depend on it]
  const inDegree = new Map<string, number>();

  for (const id of conceptIds) {
    adjacency.set(id, []);
    inDegree.set(id, 0);
  }

  for (const p of prereqs) {
    if (!idSet.has(p.conceptId) || !idSet.has(p.prerequisiteId)) continue;
    adjacency.get(p.prerequisiteId)?.push(p.conceptId);
    inDegree.set(p.conceptId, (inDegree.get(p.conceptId) || 0) + 1);
  }

  // BFS from nodes with no prerequisites
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    for (const dependent of adjacency.get(current) || []) {
      const newDeg = (inDegree.get(dependent) || 1) - 1;
      inDegree.set(dependent, newDeg);
      if (newDeg === 0) queue.push(dependent);
    }
  }

  // If sorted doesn't contain all concepts, there's a cycle
  if (sorted.length < conceptIds.length) {
    // Add remaining concepts at the end (break cycles gracefully)
    for (const id of conceptIds) {
      if (!sorted.includes(id)) sorted.push(id);
    }
  }

  return sorted;
}

// ── Helpers ───────────────────────────────────────────────────────────

interface PathRecord {
  id: string;
  title: string | null;
  goalConcepts: string[];
  status: string;
  currentStep: number;
  totalSteps: number;
  adaptedAt: Date | null;
  startedAt: Date;
  completedAt: Date | null;
  steps: Array<{
    id: string;
    sortOrder: number;
    type: string;
    conceptId: string | null;
    lessonId: string | null;
    quizId: string | null;
    bloomLevel: number | null;
    isCompleted: boolean;
    completedAt: Date | null;
    skipped: boolean;
  }>;
}

function formatPath(path: PathRecord) {
  const completedSteps = path.steps.filter(s => s.isCompleted && !s.skipped).length;
  const activeSteps = path.steps.filter(s => !s.skipped).length;
  const progress = activeSteps > 0 ? Math.round((completedSteps / activeSteps) * 100) : 0;

  return {
    id: path.id,
    title: path.title,
    status: path.status,
    goalConcepts: path.goalConcepts,
    currentStep: path.currentStep,
    totalSteps: path.totalSteps,
    progress,
    adaptedAt: path.adaptedAt?.toISOString() ?? null,
    startedAt: path.startedAt.toISOString(),
    completedAt: path.completedAt?.toISOString() ?? null,
    steps: path.steps.map(s => ({
      id: s.id,
      sortOrder: s.sortOrder,
      type: s.type,
      conceptId: s.conceptId,
      lessonId: s.lessonId,
      quizId: s.quizId,
      bloomLevel: s.bloomLevel,
      isCompleted: s.isCompleted,
      completedAt: s.completedAt?.toISOString() ?? null,
      skipped: s.skipped,
    })),
  };
}
