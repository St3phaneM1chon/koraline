export default function WebhooksLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      {/* Page header */}
      <div className="h-8 w-36 bg-white/10 rounded" />

      {/* Stat cards: deliveries, success, failed, avg duration */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--k-glass-thin)] rounded-xl p-5 border border-[var(--k-border-subtle)]">
            <div className="space-y-2">
              <div className="h-6 w-16 bg-white/10 rounded" />
              <div className="h-3 w-24 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Webhook deliveries list */}
      <div className="bg-[var(--k-glass-thin)] rounded-xl border border-[var(--k-border-subtle)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--k-border-subtle)] flex items-center justify-between">
          <div className="h-5 w-40 bg-white/10 rounded" />
          <div className="h-8 w-24 bg-white/10 rounded-lg" />
        </div>
        <div className="divide-y divide-white/5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4 px-6">
              <div className="h-6 w-6 bg-white/10 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-56 bg-white/10 rounded" />
                <div className="h-3 w-36 bg-white/5 rounded" />
              </div>
              <div className="h-4 w-12 bg-white/5 rounded" />
              <div className="h-6 w-16 bg-white/10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
