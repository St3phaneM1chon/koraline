export default function RapportsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="h-8 w-36 bg-white/10 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--k-glass-thin)] rounded-xl p-6 border border-[var(--k-border-subtle)]">
            <div className="space-y-2">
              <div className="h-6 w-16 bg-white/10 rounded" />
              <div className="h-3 w-24 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[var(--k-glass-thin)] rounded-xl p-6 border border-[var(--k-border-subtle)] h-64" />
    </div>
  );
}
