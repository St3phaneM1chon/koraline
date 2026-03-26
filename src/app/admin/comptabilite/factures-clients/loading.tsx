export default function FacturesClientsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="flex justify-between">
        <div className="h-8 w-48 bg-white/10 rounded" />
        <div className="h-10 w-36 bg-white/10 rounded-lg" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-white/10 rounded-lg" />
        ))}
      </div>
      <div className="bg-[var(--k-glass-thin)] rounded-lg divide-y">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="h-5 w-24 bg-white/10 rounded" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-40 bg-white/10 rounded" />
              <div className="h-3 w-28 bg-white/5 rounded" />
            </div>
            <div className="h-5 w-20 bg-white/10 rounded" />
            <div className="h-6 w-16 bg-white/10 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
