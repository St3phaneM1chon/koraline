'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-bold text-red-600 mb-2">Erreur</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{error.message || 'Une erreur est survenue'}</p>
      <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Reessayer
      </button>
    </div>
  );
}
