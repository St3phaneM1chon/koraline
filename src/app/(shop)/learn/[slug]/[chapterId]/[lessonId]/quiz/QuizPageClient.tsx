'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';
import QuizPlayer, {
  type QuizQuestionData,
  type QuizResult,
} from '@/components/lms/QuizPlayer';

interface Props {
  courseSlug: string;
  courseTitle: string;
  chapterId: string;
  lessonId: string;
  lessonTitle: string;
  quizId: string;
  enrollmentId: string;
}

interface QuizMeta {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  showResults: boolean;
}

export default function QuizPageClient({
  courseSlug,
  courseTitle,
  chapterId,
  lessonId,
  lessonTitle,
  quizId,
  enrollmentId,
}: Props) {
  const { t } = useTranslations();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizMeta | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionData[]>([]);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [attemptsRemaining, setAttemptsRemaining] = useState(0);
  const [canAttempt, setCanAttempt] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  // Check previous attempts, then start a new one if possible
  useEffect(() => {
    async function initQuiz() {
      try {
        // Check existing attempts
        const attRes = await fetch(`/api/lms/quiz/${quizId}/attempt`);
        if (!attRes.ok) {
          setError(t('lms.quiz.errorLoading'));
          setLoading(false);
          return;
        }
        const attData = await attRes.json();

        // If max attempts reached and last attempt passed, mark as already done
        if (!attData.canAttempt && attData.attempts?.[0]?.passed) {
          setCompleted(true);
          setResult({
            attemptId: attData.attempts[0].id,
            score: attData.attempts[0].score,
            passed: true,
            totalPoints: attData.attempts[0].totalPoints,
            earnedPoints: attData.attempts[0].earnedPoints,
          });
          setLoading(false);
          return;
        }

        if (!attData.canAttempt) {
          setCanAttempt(false);
          // Show last attempt result
          if (attData.attempts?.[0]) {
            setResult({
              attemptId: attData.attempts[0].id,
              score: attData.attempts[0].score,
              passed: attData.attempts[0].passed,
              totalPoints: attData.attempts[0].totalPoints,
              earnedPoints: attData.attempts[0].earnedPoints,
            });
          }
          setLoading(false);
          return;
        }

        // Start a new attempt — this returns questions without answers
        const startRes = await fetch(`/api/lms/quiz/${quizId}/attempt`, {
          method: 'POST',
        });
        if (!startRes.ok) {
          const errData = await startRes.json().catch(() => ({}));
          setError(errData.error || t('lms.quiz.errorLoading'));
          setLoading(false);
          return;
        }

        const startData = await startRes.json();
        setQuiz(startData.quiz);
        setQuestions(startData.questions);
        setAttemptNumber(startData.attemptNumber);
        setAttemptsRemaining(startData.attemptsRemaining);
        setLoading(false);
      } catch {
        setError(t('lms.quiz.errorLoading'));
        setLoading(false);
      }
    }
    initQuiz();
  }, [quizId, t]);

  // When quiz is completed, mark lesson as done if passed
  const handleComplete = useCallback(
    async (quizResult: QuizResult) => {
      setResult(quizResult);
      setCompleted(true);

      if (quizResult.passed) {
        // Mark lesson complete
        try {
          await fetch('/api/lms/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              enrollmentId,
              lessonId,
              isCompleted: true,
            }),
          });
        } catch {
          // Non-blocking — progress will be stale but quiz result is saved
        }
      }
    },
    [enrollmentId, lessonId]
  );

  const lessonUrl = `/learn/${courseSlug}/${chapterId}/${lessonId}`;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--k-bg-base)] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--k-accent-indigo)]" />
        <p className="text-[var(--k-text-secondary)] text-sm">{t('lms.quiz.loading')}</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--k-bg-base)] flex flex-col items-center justify-center gap-4 px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-red-700 font-medium mb-2">{error}</p>
          <Link href={lessonUrl} className="text-sm text-[var(--k-accent-indigo)] hover:underline">
            {t('learn.lessonViewer.backToCourse')}
          </Link>
        </div>
      </div>
    );
  }

  // No more attempts
  if (!canAttempt && !completed) {
    return (
      <div className="min-h-screen bg-[var(--k-bg-base)]">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-[var(--k-glass-regular)] backdrop-blur-xl rounded-xl border border-[var(--k-border-subtle)] p-8 text-center">
            <svg className="w-16 h-16 text-amber-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-bold text-[var(--k-text-primary)] mb-2">{t('lms.quiz.maxAttemptsReached')}</h2>
            {result && (
              <p className="text-[var(--k-text-secondary)] mb-4">
                {t('lms.quiz.lastScore')}: {result.score}% {result.passed ? '✓' : '✗'}
              </p>
            )}
            <Link
              href={lessonUrl}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--k-accent-indigo)] text-white font-medium rounded-lg hover:opacity-90 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('learn.lessonViewer.backToCourse')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Completed — show result summary
  if (completed && result) {
    return (
      <div className="min-h-screen bg-[var(--k-bg-base)]">
        {/* Top Bar */}
        <div className="bg-[var(--k-bg-surface)] border-b border-[var(--k-border-subtle)] sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href={lessonUrl} className="flex items-center gap-1 text-[var(--k-text-secondary)] hover:text-[var(--k-text-primary)] text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {lessonTitle}
            </Link>
            <span className="text-sm text-[var(--k-text-tertiary)]">{courseTitle}</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className={`bg-[var(--k-glass-regular)] backdrop-blur-xl rounded-xl border ${result.passed ? 'border-green-300' : 'border-red-300'} p-8 text-center`}>
            {result.passed ? (
              <svg className="w-20 h-20 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-20 h-20 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}

            <h2 className="text-2xl font-bold text-[var(--k-text-primary)] mb-2">
              {result.passed ? t('lms.quiz.passed') : t('lms.quiz.failed')}
            </h2>

            <div className="text-4xl font-bold mb-4" style={{ color: result.passed ? '#22c55e' : '#ef4444' }}>
              {result.score}%
            </div>

            <p className="text-[var(--k-text-secondary)] mb-2">
              {result.earnedPoints} / {result.totalPoints} {t('lms.quiz.points')}
            </p>

            {result.passed && (
              <p className="text-green-600 font-medium mb-6">{t('lms.quiz.lessonMarkedComplete')}</p>
            )}

            {!result.passed && attemptsRemaining > 0 && (
              <p className="text-amber-600 mb-6">
                {t('lms.quiz.attemptsRemaining', { count: attemptsRemaining })}
              </p>
            )}

            <div className="flex items-center justify-center gap-3 mt-4">
              <Link
                href={lessonUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-[var(--k-border-default)] text-[var(--k-text-secondary)] font-medium rounded-lg hover:bg-[var(--k-glass-ultra-thin)] transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('learn.lessonViewer.backToCourse')}
              </Link>

              {!result.passed && attemptsRemaining > 0 && (
                <button
                  onClick={() => {
                    setCompleted(false);
                    setResult(null);
                    setLoading(true);
                    // Re-trigger the useEffect by forcing a re-mount
                    router.refresh();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--k-accent-indigo)] text-white font-medium rounded-lg hover:opacity-90 transition text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('lms.quiz.retryQuiz')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active quiz
  return (
    <div className="min-h-screen bg-[var(--k-bg-base)]">
      {/* Top Bar */}
      <div className="bg-[var(--k-bg-surface)] border-b border-[var(--k-border-subtle)] sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href={lessonUrl} className="flex items-center gap-1 text-[var(--k-text-secondary)] hover:text-[var(--k-text-primary)] text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {lessonTitle}
          </Link>
          <span className="text-sm text-[var(--k-text-tertiary)]">{courseTitle}</span>
        </div>
      </div>

      {/* Quiz Player */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {quiz && (
          <QuizPlayer
            quizId={quizId}
            questions={questions}
            timeLimit={quiz.timeLimit}
            passingScore={quiz.passingScore}
            maxAttempts={3}
            attemptNumber={attemptNumber}
            title={quiz.title}
            description={quiz.description ?? undefined}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}
