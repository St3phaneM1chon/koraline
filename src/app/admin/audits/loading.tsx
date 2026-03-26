export default function AuditsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="h-8 w-32 bg-white/10 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white/10 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[var(--k-glass-thin)] rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 bg-white/10 rounded-full" />
              <div className="h-5 w-20 bg-white/5 rounded-full" />
            </div>
            <div className="h-5 w-3/4 bg-white/10 rounded" />
            <div className="h-4 w-full bg-white/5 rounded" />
            <div className="h-8 w-24 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
