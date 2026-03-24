'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Lock, CheckCircle, AlertTriangle, BookOpen, Trophy, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface ExamStatus {
  courseTitle: string;
  examQuizId: string;
  passingScore: number;
  allowed: boolean;
  progress: number;
  threshold: number;
  missingLessons: string[];
  previousAttempts: Array<{ id: string; score: number; passed: boolean; completedAt: string; timeTaken: number | null }>;
  bestScore: number | null;
  hasPassed: boolean;
}

export default function ExamenPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [exam, setExam] = useState<ExamStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // We need courseId, but we have slug — fetch course first
    fetch(`/api/lms/courses?slug=${slug}`)
      .then(r => r.json())
      .then(async (d) => {
        const course = d.data?.courses?.[0] ?? d.data;
        if (!course?.id) { setError('Cours non trouve'); return; }
        const res = await fetch(`/api/lms/exam/${course.id}`);
        const data = await res.json();
        if (res.ok) setExam(data.data);
        else setError(data.error ?? 'Erreur');
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement de l&apos;examen...</div>;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <p className="text-lg font-medium">{error}</p>
        <Link href={`/learn/${slug}`} className="text-primary hover:underline mt-2 inline-block">Retour au cours</Link>
      </div>
    </div>
  );
  if (!exam) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Examen de qualification</h1>
      <p className="text-muted-foreground mb-8">{exam.courseTitle}</p>

      {/* Already passed */}
      {exam.hasPassed && (
        <div className="rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-950/30 p-6 mb-8">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-xl font-bold text-green-700 dark:text-green-300">Examen reussi!</h2>
              <p className="text-sm text-green-600">Meilleur score: {exam.bestScore}% (requis: {exam.passingScore}%)</p>
            </div>
          </div>
        </div>
      )}

      {/* Locked */}
      {!exam.allowed && (
        <div className="rounded-xl border p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-6 w-6 text-amber-500" />
            <h2 className="text-lg font-semibold">Examen verrouille</h2>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progression</span>
              <span>{exam.progress}% / {exam.threshold}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div className="bg-primary rounded-full h-3 transition-all" style={{ width: `${exam.progress}%` }} />
            </div>
          </div>

          {exam.missingLessons.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Lecons restantes:</p>
              <ul className="space-y-1">
                {exam.missingLessons.slice(0, 10).map((lesson, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    {lesson}
                  </li>
                ))}
                {exam.missingLessons.length > 10 && (
                  <li className="text-sm text-muted-foreground">...et {exam.missingLessons.length - 10} autre(s)</li>
                )}
              </ul>
            </div>
          )}

          <Link href={`/learn/${slug}`} className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
            <BookOpen className="h-4 w-4" /> Continuer le cours
          </Link>
        </div>
      )}

      {/* Exam available */}
      {exam.allowed && !exam.hasPassed && (
        <div className="rounded-xl border p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h2 className="text-lg font-semibold">Examen disponible</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Vous avez complete toutes les lecons. Score minimum requis: <strong>{exam.passingScore}%</strong>.
          </p>
          <button
            onClick={() => {
              // Navigate to quiz player with examQuizId
              router.push(`/learn/${slug}?quiz=${exam.examQuizId}&exam=true`);
            }}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Commencer l&apos;examen
          </button>
        </div>
      )}

      {/* Previous attempts */}
      {exam.previousAttempts.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <RotateCcw className="h-4 w-4" /> Tentatives precedentes
          </h3>
          <div className="space-y-2">
            {exam.previousAttempts.map(attempt => (
              <div key={attempt.id} className={`flex items-center justify-between p-3 rounded-lg border ${attempt.passed ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-red-200 bg-red-50 dark:bg-red-950/20'}`}>
                <div className="flex items-center gap-3">
                  {attempt.passed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
                  <span className="font-medium">{Number(attempt.score).toFixed(0)}%</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${attempt.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {attempt.passed ? 'Reussi' : 'Echoue'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(attempt.completedAt).toLocaleDateString('fr-CA')}
                  {attempt.timeTaken && <span className="ml-2">({Math.round(attempt.timeTaken / 60)} min)</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
