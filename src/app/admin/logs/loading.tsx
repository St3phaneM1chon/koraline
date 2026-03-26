export default function LogsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="h-8 w-32 bg-white/10 rounded" />
      <div className="flex gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-white/10 rounded-full" />
        ))}
      </div>
      <div className="bg-[var(--k-glass-thin)] rounded-lg divide-y">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="p-3 flex items-center gap-4">
            <div className="h-3 w-20 bg-white/5 rounded" />
            <div className="h-4 w-16 bg-white/10 rounded-full" />
            <div className="flex-1 h-4 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
