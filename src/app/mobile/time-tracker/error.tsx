'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Mobile error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <h2 className="text-xl font-bold mb-3">Something went wrong</h2>
      <p className="text-gray-500 mb-6 text-sm">Please try again or go back.</p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
      >
        Retry
      </button>
    </div>
  );
}
