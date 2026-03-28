import Link from 'next/link';

/**
 * 404 page for the /platform route group.
 * Inherits the PlatformLayout (header + footer) automatically.
 * Design: clean SaaS style consistent with Koraline branding.
 */
export default function PlatformNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 py-16">
      <div className="text-center max-w-lg">
        {/* 404 number */}
        <p className="text-[120px] sm:text-[160px] font-extrabold leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-blue-400 select-none">
          404
        </p>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 mb-3">
          Page non trouvee
        </h1>

        {/* Description */}
        <p className="text-base text-gray-500 mb-10 max-w-md mx-auto leading-relaxed">
          La page que vous recherchez n&apos;existe pas ou a ete deplacee.
        </p>

        {/* Helpful links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0066CC] text-white font-semibold rounded-xl hover:bg-[#0055AA] transition-colors text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
              />
            </svg>
            Accueil
          </Link>

          <Link
            href="/platform/features"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
            Fonctionnalites
          </Link>

          <Link
            href="/pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
            Tarifs
          </Link>
        </div>
      </div>
    </div>
  );
}
