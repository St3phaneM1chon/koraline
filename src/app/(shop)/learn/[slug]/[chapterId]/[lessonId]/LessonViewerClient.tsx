'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';

interface LessonData {
  id: string;
  title: string;
  type: string;
  textContent: string | null;
  videoUrl: string | null;
  quizId: string | null;
  description: string | null;
}

interface ChapterData {
  id: string;
  title: string;
}

interface NavigationData {
  prev: { id: string; title: string; chapterId: string } | null;
  next: { id: string; title: string; chapterId: string } | null;
  currentIndex: number;
  totalLessons: number;
}

interface Props {
  courseSlug: string;
  courseTitle: string;
  enrollmentId: string;
  lesson: LessonData;
  chapter: ChapterData;
  navigation: NavigationData;
  isCompleted: boolean;
}

export default function LessonViewerClient({
  courseSlug,
  courseTitle,
  enrollmentId,
  lesson,
  chapter,
  navigation,
  isCompleted: initialCompleted,
}: Props) {
  const { t } = useTranslations();
  const [completed, setCompleted] = useState(initialCompleted);
  const [marking, setMarking] = useState(false);

  const handleMarkComplete = async () => {
    setMarking(true);
    try {
      const res = await fetch('/api/lms/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          lessonId: lesson.id,
          isCompleted: true,
        }),
      });
      if (res.ok) {
        setCompleted(true);
      }
    } catch {
      // silent fail
    } finally {
      setMarking(false);
    }
  };

  // Simple markdown to HTML for text content
  const renderMarkdown = (md: string) => {
    return md
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-600">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-600">$2</li>')
      .replace(/\n\n/g, '</p><p class="text-gray-600 leading-relaxed mb-4">')
      .replace(/^/, '<p class="text-gray-600 leading-relaxed mb-4">')
      .replace(/$/, '</p>');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/learn/${courseSlug}`}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-900 text-sm flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('lms.lessonViewer.backToCourse')}
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500 truncate">{courseTitle}</span>
          </div>
          <span className="text-sm text-gray-400 flex-shrink-0">
            {t('lms.lessonViewer.lessonOf', {
              current: navigation.currentIndex,
              total: navigation.totalLessons,
            })}
          </span>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Chapter / Lesson Header */}
        <div className="mb-6">
          <p className="text-sm text-blue-600 font-medium mb-1">
            {t('lms.lessonViewer.chapterProgress', { chapter: chapter.title })}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-gray-500 mt-1">{lesson.description}</p>
          )}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          {lesson.type === 'VIDEO' && lesson.videoUrl && (
            <div className="aspect-video bg-black">
              <iframe
                src={lesson.videoUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          )}

          {lesson.type === 'TEXT' && lesson.textContent && (
            <div className="p-6 md:p-8">
              <div
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(lesson.textContent) }}
              />
            </div>
          )}

          {lesson.type === 'QUIZ' && lesson.quizId && (
            <div className="p-6 md:p-8 text-center">
              <svg className="w-16 h-16 text-purple-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t('lms.lessonViewer.quizLesson')}</h2>
              <p className="text-gray-500 mb-6">{lesson.description || t('lms.quiz.title')}</p>
              <Link
                href={`/learn/${courseSlug}/${chapter.id}/${lesson.id}/quiz`}
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t('lms.lessonViewer.takeQuiz')}
              </Link>
            </div>
          )}

          {/* Fallback for other lesson types */}
          {!['VIDEO', 'TEXT', 'QUIZ'].includes(lesson.type) && (
            <div className="p-6 md:p-8 text-center text-gray-500">
              <p>{lesson.description || lesson.title}</p>
            </div>
          )}
        </div>

        {/* Mark Complete + Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Mark Complete */}
          <div>
            {completed ? (
              <span className="inline-flex items-center gap-2 text-green-600 font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {t('lms.lessonViewer.markedComplete')}
              </span>
            ) : (
              <button
                onClick={handleMarkComplete}
                disabled={marking}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {marking ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {t('lms.lessonViewer.markComplete')}
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {navigation.prev && (
              <Link
                href={`/learn/${courseSlug}/${navigation.prev.chapterId}/${navigation.prev.id}`}
                className="inline-flex items-center gap-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('lms.lessonViewer.previousLesson')}
              </Link>
            )}
            {navigation.next && (
              <Link
                href={`/learn/${courseSlug}/${navigation.next.chapterId}/${navigation.next.id}`}
                className="inline-flex items-center gap-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {t('lms.lessonViewer.nextLesson')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
