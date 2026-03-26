/**
 * #17 Peer Review Workflows - Students rate each other's assignments with rubric
 */

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  levels: { score: number; label: string; description: string }[];
}

export interface PeerReviewRubric {
  id: string;
  name: string;
  criteria: RubricCriterion[];
  totalPoints: number;
}

export interface PeerReviewScore {
  criterionId: string;
  score: number;
  comment: string;
}

export interface PeerReviewSubmission {
  reviewerId: string;
  submissionId: string;
  scores: PeerReviewScore[];
  overallComment: string;
  totalScore: number;
}

export const DEFAULT_RUBRIC: PeerReviewRubric = {
  id: 'default-peer-review',
  name: 'Standard Peer Review',
  criteria: [
    { id: 'understanding', name: 'Understanding', description: 'Demonstrates clear understanding', maxPoints: 5,
      levels: [{ score: 5, label: 'Excellent', description: 'Complete' }, { score: 3, label: 'Adequate', description: 'Basic' }, { score: 1, label: 'Beginning', description: 'Minimal' }] },
    { id: 'application', name: 'Application', description: 'Applies concepts correctly', maxPoints: 5,
      levels: [{ score: 5, label: 'Excellent', description: 'Sophisticated' }, { score: 3, label: 'Adequate', description: 'Basic' }, { score: 1, label: 'Beginning', description: 'None' }] },
    { id: 'communication', name: 'Communication', description: 'Expresses ideas clearly', maxPoints: 5,
      levels: [{ score: 5, label: 'Excellent', description: 'Clear' }, { score: 3, label: 'Adequate', description: 'Ok' }, { score: 1, label: 'Beginning', description: 'Unclear' }] },
    { id: 'completeness', name: 'Completeness', description: 'Addresses all parts', maxPoints: 5,
      levels: [{ score: 5, label: 'Complete', description: 'All parts' }, { score: 3, label: 'Partial', description: 'Some' }, { score: 1, label: 'Minimal', description: 'Little' }] },
  ],
  totalPoints: 20,
};

export function assignPeerReviewers(studentIds: string[], reviewsPerStudent: number = 2): { reviewerId: string; submissionId: string }[] {
  if (studentIds.length < reviewsPerStudent + 1) return [];
  const shuffled = [...studentIds].sort(() => Math.random() - 0.5);
  const assignments: { reviewerId: string; submissionId: string }[] = [];
  for (let i = 0; i < shuffled.length; i++) {
    for (let r = 1; r <= reviewsPerStudent; r++) {
      assignments.push({ reviewerId: shuffled[(i + r) % shuffled.length], submissionId: shuffled[i] });
    }
  }
  return assignments;
}

export function aggregatePeerScores(reviews: PeerReviewSubmission[], rubric: PeerReviewRubric = DEFAULT_RUBRIC): {
  avgScore: number; maxScore: number; percentage: number; reviewCount: number;
} {
  if (reviews.length === 0) return { avgScore: 0, maxScore: rubric.totalPoints, percentage: 0, reviewCount: 0 };
  const totalScores = reviews.map(r => r.scores.reduce((s, sc) => s + sc.score, 0));
  const avg = totalScores.reduce((s, v) => s + v, 0) / totalScores.length;
  return {
    avgScore: Math.round(avg * 10) / 10,
    maxScore: rubric.totalPoints,
    percentage: Math.round((avg / rubric.totalPoints) * 100),
    reviewCount: reviews.length,
  };
}