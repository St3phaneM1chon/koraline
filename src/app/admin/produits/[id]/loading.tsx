export default function ProductEditLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 bg-white/10 rounded" />
        <div className="h-8 w-48 bg-white/10 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[var(--k-glass-thin)] rounded-lg p-6 space-y-4">
            <div className="h-6 w-32 bg-white/10 rounded" />
            <div className="h-10 w-full bg-white/5 rounded" />
            <div className="h-32 w-full bg-white/5 rounded" />
          </div>
          <div className="bg-[var(--k-glass-thin)] rounded-lg p-6 space-y-3">
            <div className="h-6 w-24 bg-white/10 rounded" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-white/5 rounded" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-[var(--k-glass-thin)] rounded-lg p-6 space-y-3">
            <div className="h-40 bg-white/10 rounded" />
            <div className="h-4 w-24 bg-white/5 rounded" />
          </div>
          <div className="bg-[var(--k-glass-thin)] rounded-lg p-6 space-y-3">
            <div className="h-6 w-24 bg-white/10 rounded" />
            <div className="h-10 w-full bg-white/5 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
