export default function MediasLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="flex justify-between">
        <div className="h-8 w-36 bg-white/10 rounded" />
        <div className="h-10 w-32 bg-white/10 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-[var(--k-glass-thin)] rounded-lg overflow-hidden">
            <div className="h-32 bg-white/10" />
            <div className="p-2 space-y-1">
              <div className="h-3 w-3/4 bg-white/10 rounded" />
              <div className="h-3 w-1/2 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
