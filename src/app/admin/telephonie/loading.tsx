export default function TelephonyLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="flex justify-between">
        <div className="h-8 w-48 bg-white/10 rounded" />
        <div className="h-10 w-32 bg-white/10 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--k-glass-thin)] rounded-xl p-4 border border-[var(--k-border-subtle)]">
            <div className="h-3 w-20 bg-white/5 rounded mb-2" />
            <div className="h-7 w-16 bg-white/10 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-[var(--k-glass-thin)] rounded-lg divide-y">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="h-8 w-8 bg-white/10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-white/10 rounded" />
              <div className="h-3 w-28 bg-white/5 rounded" />
            </div>
            <div className="h-6 w-20 bg-white/10 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
