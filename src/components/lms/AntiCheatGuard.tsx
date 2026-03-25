'use client';

/**
 * Anti-Cheat Guard — Detects tab switching, copy attempts, and suspicious behavior during exams.
 * Wraps quiz/exam content and reports violations to the server.
 */
import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';

interface AntiCheatGuardProps {
  children: ReactNode;
  quizAttemptId?: string;
  isExam?: boolean;
  onViolation?: (type: string, count: number) => void;
  maxViolations?: number; // Auto-submit after N violations
}

export default function AntiCheatGuard({
  children,
  quizAttemptId,
  isExam = false,
  onViolation,
  maxViolations = 5,
}: AntiCheatGuardProps) {
  const [violations, setViolations] = useState<Array<{ type: string; timestamp: Date }>>([]);
  const [showWarning, setShowWarning] = useState(false);
  const violationCount = useRef(0);

  const recordViolation = useCallback((type: string) => {
    violationCount.current += 1;
    const count = violationCount.current;

    setViolations(prev => [...prev, { type, timestamp: new Date() }]);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 3000);

    onViolation?.(type, count);

    // Log to server (non-blocking)
    if (quizAttemptId) {
      fetch('/api/lms/quiz/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizAttemptId, type, count }),
      }).catch(() => {});
    }
  }, [onViolation, quizAttemptId]);

  useEffect(() => {
    if (!isExam) return;

    // Tab visibility change
    const handleVisibility = () => {
      if (document.hidden) {
        recordViolation('tab_switch');
      }
    };

    // Window blur (switched to another app)
    const handleBlur = () => {
      recordViolation('window_blur');
    };

    // Copy/paste prevention
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('copy_attempt');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('paste_attempt');
    };

    // Right-click prevention
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordViolation('right_click');
    };

    // Keyboard shortcuts prevention (Ctrl+C, Ctrl+V, Ctrl+U, F12)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'u', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        recordViolation('keyboard_shortcut');
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        recordViolation('devtools_attempt');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExam, recordViolation]);

  return (
    <div className="relative">
      {/* Warning overlay */}
      {showWarning && isExam && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="font-medium">
              Avertissement ({violationCount.current}/{maxViolations}) — Restez sur cette page pendant l&apos;examen
            </span>
          </div>
        </div>
      )}

      {/* Violation counter (subtle) */}
      {isExam && violations.length > 0 && (
        <div className="absolute top-2 right-2 text-xs text-red-500 font-mono">
          {violations.length} avertissement(s)
        </div>
      )}

      {children}
    </div>
  );
}
