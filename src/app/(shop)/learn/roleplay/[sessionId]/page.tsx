'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/i18n/client';

interface Message {
  role: 'client' | 'student';
  content: string;
  timestamp: string;
}

interface CriterionScore {
  criterion: string;
  score: number;
  maxScore: number;
  feedback: string;
}

interface Evaluation {
  overallScore: number;
  criterionScores: CriterionScore[];
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
}

interface SessionInfo {
  id: string;
  status: string;
  score: number | null;
  passed: boolean;
  durationSec?: number;
}

interface ScenarioInfo {
  title: string;
  domain: string;
  difficulty: string;
  clientName: string;
  clientPersonality: string;
  situationBrief: string;
  maxMinutes: number;
  passingScore: number;
  evaluationCriteria: unknown;
}

export default function ActiveRolePlayPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { t } = useI18n();

  const [messages, setMessages] = useState<Message[]>([]);
  const [scenario, setScenario] = useState<ScenarioInfo | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [maxSec, setMaxSec] = useState(900); // 15 min default

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer
  useEffect(() => {
    if (sessionInfo?.status === 'COMPLETED') return;
    timerRef.current = setInterval(() => {
      setElapsedSec(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionInfo?.status]);

  // Load existing session data on mount (handles page refresh)
  useEffect(() => {
    // Try to restore scenario from sessionStorage (set by catalog page)
    try {
      const cached = sessionStorage.getItem(`roleplay-scenario-${sessionId}`);
      if (cached) {
        const parsed = JSON.parse(cached) as { scenario: ScenarioInfo; messages: Message[] };
        setScenario(parsed.scenario);
        if (parsed.messages?.length) setMessages(parsed.messages);
      }
    } catch {
      // silent — user will still be able to chat
    }
    setLoading(false);
  }, [sessionId]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput('');
    setSending(true);

    // Optimistically add student message
    const studentMsg: Message = {
      role: 'student',
      content: msg,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, studentMsg]);

    try {
      const res = await fetch(`/api/lms/roleplay/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.clientResponse]);
        setElapsedSec(data.elapsedSec ?? elapsedSec);
        setMaxSec(data.maxSec ?? maxSec);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error ?? 'Failed to send message');
      }
    } catch {
      setError('Network error');
    } finally {
      setSending(false);
    }
  }, [input, sending, sessionId, elapsedSec, maxSec]);

  const endSimulation = useCallback(async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/lms/roleplay/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionInfo(data.session);
        setEvaluation(data.evaluation ?? data);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch {
      setError('Failed to end simulation');
    } finally {
      setCompleting(false);
    }
  }, [sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const remainingSec = Math.max(0, maxSec - elapsedSec);
  const isTimeLow = remainingSec < 120;
  const isCompleted = sessionInfo?.status === 'COMPLETED';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Show evaluation results if completed
  if (isCompleted && evaluation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-[#143C78] text-white py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/learn/roleplay"
              className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('learn.roleplay.backToScenarios')}
            </Link>
            <h1 className="text-2xl font-bold">{t('learn.roleplay.evaluation')}</h1>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Score card */}
          <div className={`rounded-xl p-8 text-center ${
            sessionInfo?.passed ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
          }`}>
            <div className={`text-6xl font-bold mb-2 ${
              sessionInfo?.passed ? 'text-green-700' : 'text-orange-700'
            }`}>
              {evaluation.overallScore}%
            </div>
            <p className={`text-lg font-medium ${
              sessionInfo?.passed ? 'text-green-600' : 'text-orange-600'
            }`}>
              {sessionInfo?.passed ? t('learn.roleplay.passedResult') : t('learn.roleplay.failedResult')}
            </p>
            <p className="text-gray-600 mt-2">{evaluation.overallFeedback}</p>
            {sessionInfo?.durationSec && (
              <p className="text-sm text-gray-400 mt-2">
                {t('learn.roleplay.duration')}: {formatTime(sessionInfo.durationSec)}
              </p>
            )}
          </div>

          {/* Criterion scores */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {t('learn.roleplay.detailedScores')}
            </h2>
            <div className="space-y-4">
              {evaluation.criterionScores.map((cs, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{cs.criterion}</span>
                    <span className="text-sm font-bold text-gray-900">{cs.score}/{cs.maxScore}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        cs.score / cs.maxScore >= 0.7 ? 'bg-green-500' :
                        cs.score / cs.maxScore >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(cs.score / cs.maxScore) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{cs.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {evaluation.strengths.length > 0 && (
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="font-bold text-green-800 mb-3">{t('learn.roleplay.strengths')}</h3>
                <ul className="space-y-2">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.weaknesses.length > 0 && (
              <div className="bg-orange-50 rounded-xl p-6">
                <h3 className="font-bold text-orange-800 mb-3">{t('learn.roleplay.weaknesses')}</h3>
                <ul className="space-y-2">
                  {evaluation.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-orange-700">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <Link
              href="/learn/roleplay"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('learn.roleplay.backToScenarios')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active chat interface
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/learn/roleplay"
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900 text-sm">
                {scenario?.title ?? t('learn.roleplay.title')}
              </h1>
              {scenario?.clientName && (
                <p className="text-xs text-gray-500">
                  {t('learn.roleplay.clientSays')}: {scenario.clientName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className={`font-mono text-sm font-bold px-3 py-1 rounded-full ${
              isTimeLow ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-700'
            }`}>
              {formatTime(remainingSec)}
            </div>

            {/* End button */}
            <button
              onClick={endSimulation}
              disabled={completing || messages.filter(m => m.role === 'student').length === 0}
              className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {completing ? t('common.loading') : t('learn.roleplay.endSimulation')}
            </button>
          </div>
        </div>
      </div>

      {/* Situation brief */}
      {scenario?.situationBrief && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">{t('learn.roleplay.briefLabel')}:</span>{' '}
              {scenario.situationBrief}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'student'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-md'
                }`}
              >
                {msg.role === 'client' && (
                  <p className="text-xs text-gray-400 font-medium mb-1">
                    {scenario?.clientName ?? t('learn.roleplay.clientSays')}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={() => setError(null)} className="text-xs text-red-400 underline">
              {t('common.dismiss')}
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('learn.roleplay.yourResponse')}
            rows={2}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={sending || isCompleted}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending || isCompleted}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
