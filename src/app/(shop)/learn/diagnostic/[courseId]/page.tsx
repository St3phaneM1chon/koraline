'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/i18n/client';

interface DiagnosticQuestion {
  id: string;
  conceptId: string;
  conceptName: string;
  question: string;
  type: string;
  options: Array<{ id: string; text: string }>;
  correctAnswer: string | null;
}

interface ConceptResult {
  conceptId: string;
  conceptName: string;
  known: boolean;
  confidence: number;
  responseTimeSec: number;
}

interface DiagnosticResults {
  results: ConceptResult[];
  knownConcepts: number;
  unknownConcepts: number;
  lessonsToSkip: string[];
}

type Phase = 'loading' | 'ready' | 'quiz' | 'submitting' | 'results';

export default function DiagnosticQuizPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { t } = useI18n();

  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, { answer: string | string[]; responseTimeSec: number }>>(new Map());
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const maxSec = 300; // 5 minutes
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Load diagnostic questions
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/lms/diagnostic?courseId=${courseId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions);
            setPhase('ready');
          } else {
            setError(t('learn.diagnostic.noQuestions'));
            setPhase('ready');
          }
        } else {
          setError(t('learn.diagnostic.loadError'));
        }
      } catch {
        setError(t('learn.diagnostic.loadError'));
      } finally {
        if (phase === 'loading') setPhase('ready');
      }
    };
    load();
  }, [courseId, t, phase]);

  // Timer
  useEffect(() => {
    if (phase !== 'quiz') return;
    timerRef.current = setInterval(() => {
      setElapsedSec(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (phase === 'quiz' && elapsedSec >= maxSec) {
      submitAnswers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSec, phase]);

  const startQuiz = () => {
    setPhase('quiz');
    startTimeRef.current = Date.now();
    setQuestionStartTime(Date.now());
    setCurrentIndex(0);
  };

  const selectAnswer = useCallback((answer: string | string[]) => {
    const question = questions[currentIndex];
    const responseTimeSec = Math.round((Date.now() - questionStartTime) / 1000);

    setAnswers(prev => {
      const next = new Map(prev);
      next.set(question.id, { answer, responseTimeSec });
      return next;
    });

    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setQuestionStartTime(Date.now());
      }
    }, 300);
  }, [currentIndex, questions, questionStartTime]);

  const submitAnswers = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('submitting');

    const answerArray = Array.from(answers.entries()).map(([questionId, data]) => ({
      questionId,
      answer: data.answer,
      responseTimeSec: data.responseTimeSec,
    }));

    try {
      const res = await fetch('/api/lms/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, answers: answerArray }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setPhase('results');
      } else {
        setError(t('learn.diagnostic.submitError'));
        setPhase('quiz');
      }
    } catch {
      setError(t('learn.diagnostic.submitError'));
      setPhase('quiz');
    }
  }, [answers, courseId, t]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const remainingSec = Math.max(0, maxSec - elapsedSec);
  const isTimeLow = remainingSec < 60;
  const currentQuestion = questions[currentIndex];

  // Loading state
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Results phase
  if (phase === 'results' && results) {
    const knownCount = results.knownConcepts;
    const unknownCount = results.unknownConcepts;
    const estimatedTimeSaved = results.lessonsToSkip.length * 15; // rough estimate: 15 min per lesson

    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-[#143C78] text-white py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold">{t('learn.diagnostic.results')}</h1>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-5 text-center border border-green-200">
              <p className="text-3xl font-bold text-green-700">{knownCount}</p>
              <p className="text-sm text-green-600">{t('learn.diagnostic.conceptsKnown')}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-5 text-center border border-red-200">
              <p className="text-3xl font-bold text-red-700">{unknownCount}</p>
              <p className="text-sm text-red-600">{t('learn.diagnostic.conceptsToLearn')}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-5 text-center border border-blue-200">
              <p className="text-3xl font-bold text-blue-700">~{estimatedTimeSaved}m</p>
              <p className="text-sm text-blue-600">{t('learn.diagnostic.timeSaved')}</p>
            </div>
          </div>

          {/* Concept map */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {t('learn.diagnostic.conceptMap')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {results.results.map((result) => (
                <div
                  key={result.conceptId}
                  className={`p-3 rounded-lg border-2 ${
                    result.known
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                  }`}
                >
                  <p className={`text-sm font-medium ${
                    result.known ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.conceptName}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs ${
                      result.known ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.known ? t('learn.diagnostic.known') : t('learn.diagnostic.unknown')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {result.responseTimeSec}s
                    </span>
                  </div>
                  {/* Confidence bar */}
                  <div className="mt-2 w-full bg-white/50 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        result.known ? 'bg-green-500' : 'bg-red-400'
                      }`}
                      style={{ width: `${Math.round(result.confidence * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lessons skipped */}
          {results.lessonsToSkip.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <p className="text-sm text-blue-800">
                {results.lessonsToSkip.length} {t('learn.diagnostic.lessonsSkipped')}
              </p>
            </div>
          )}

          {/* Action */}
          <div className="flex justify-center gap-4">
            <Link
              href={`/learn`}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('learn.diagnostic.startLearning')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Ready / pre-start
  if (phase === 'ready') {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-[#143C78] text-white py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-bold mb-3">{t('learn.diagnostic.title')}</h1>
            <p className="text-lg text-blue-200">{t('learn.diagnostic.subtitle')}</p>
          </div>
        </section>

        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                <p className="text-gray-600 mb-4">
                  {questions.length} {t('learn.diagnostic.question').toLowerCase()}s
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  {t('learn.diagnostic.timeRemaining')}: 5:00
                </p>
                <button
                  onClick={startQuiz}
                  disabled={questions.length === 0}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('learn.diagnostic.startDiagnostic')}
                </button>
              </div>
              <Link href="/learn" className="text-sm text-gray-500 hover:text-gray-700">
                {t('learn.backToLearning')}
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  // Quiz phase
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {t('learn.diagnostic.question')} {currentIndex + 1} {t('learn.diagnostic.of')} {questions.length}
          </div>

          <div className={`font-mono text-sm font-bold px-3 py-1 rounded-full ${
            isTimeLow ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-700'
          }`}>
            {formatTime(remainingSec)}
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-3xl mx-auto mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full">
          {currentQuestion && (
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <p className="text-xs text-blue-600 font-medium mb-3">
                {currentQuestion.conceptName}
              </p>
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {(currentQuestion.options ?? []).map((option) => {
                  const isSelected = answers.get(currentQuestion.id)?.answer === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => selectAnswer(option.id)}
                      className={`w-full text-start px-5 py-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(prev => prev - 1);
                  setQuestionStartTime(Date.now());
                }
              }}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-gray-500 text-sm disabled:opacity-30"
            >
              {t('common.previous')}
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={submitAnswers}
                disabled={answers.size < questions.length}
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('learn.diagnostic.submit')}
              </button>
            ) : (
              <button
                onClick={() => {
                  setCurrentIndex(prev => prev + 1);
                  setQuestionStartTime(Date.now());
                }}
                className="px-4 py-2 text-blue-600 text-sm font-medium hover:text-blue-700"
              >
                {t('common.next')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Submitting overlay */}
      {phase === 'submitting' && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">{t('learn.diagnostic.analyzing')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
