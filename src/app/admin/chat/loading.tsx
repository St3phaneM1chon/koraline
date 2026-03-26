export default function ChatLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="h-8 w-32 bg-white/10 rounded" />
      <div className="flex gap-4 h-[500px]">
        <div className="w-72 bg-[var(--k-glass-thin)] rounded-lg border border-[var(--k-border-subtle)] p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/10 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-24 bg-white/10 rounded" />
                <div className="h-3 w-32 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 bg-[var(--k-glass-thin)] rounded-lg border border-[var(--k-border-subtle)]" />
      </div>
    </div>
  );
}
