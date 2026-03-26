export default function MonitoringLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      {/* Page header */}
      <div className="h-8 w-44 bg-white/10 rounded" />

      {/* Health status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--k-glass-thin)] rounded-xl p-5 border border-[var(--k-border-subtle)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-white/10 rounded" />
                <div className="h-3 w-16 bg-white/5 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Service health list */}
      <div className="bg-[var(--k-glass-thin)] rounded-xl border border-[var(--k-border-subtle)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--k-border-subtle)]">
          <div className="h-5 w-36 bg-white/10 rounded" />
        </div>
        <div className="divide-y divide-white/5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4 px-6">
              <div className="h-3 w-3 bg-white/10 rounded-full" />
              <div className="h-4 w-32 bg-white/10 rounded" />
              <div className="flex-1" />
              <div className="h-4 w-16 bg-white/5 rounded" />
              <div className="h-6 w-20 bg-white/10 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Performance metrics table */}
      <div className="bg-[var(--k-glass-thin)] rounded-xl border border-[var(--k-border-subtle)] p-6">
        <div className="h-5 w-48 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
