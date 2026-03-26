export default function NavigateurLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="h-8 w-36 bg-white/10 rounded" />
      <div className="flex gap-4 h-[500px]">
        <div className="w-64 bg-[var(--k-glass-thin)] rounded-lg border border-[var(--k-border-subtle)] p-4 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 bg-white/10 rounded" />
              <div className="h-4 w-32 bg-white/10 rounded" />
            </div>
          ))}
        </div>
        <div className="flex-1 bg-[var(--k-glass-thin)] rounded-lg border border-[var(--k-border-subtle)]" />
      </div>
    </div>
  );
}
