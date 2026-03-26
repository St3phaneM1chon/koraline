export default function ClientsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="h-8 w-32 bg-white/10 rounded" />
      <div className="flex gap-4">
        <div className="h-10 flex-1 bg-white/5 rounded-lg" />
        <div className="h-10 w-28 bg-white/10 rounded-lg" />
      </div>
      <div className="bg-[var(--k-glass-thin)] rounded-lg divide-y">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-white/10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-white/10 rounded" />
              <div className="h-3 w-56 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
