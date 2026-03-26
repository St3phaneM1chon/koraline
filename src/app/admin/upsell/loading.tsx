export default function UpsellLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="flex justify-between">
        <div className="h-8 w-32 bg-white/10 rounded" />
        <div className="h-10 w-32 bg-white/10 rounded-lg" />
      </div>
      <div className="bg-[var(--k-glass-thin)] rounded-lg divide-y">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 bg-white/10 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-white/10 rounded" />
              <div className="h-3 w-32 bg-white/5 rounded" />
            </div>
            <div className="h-8 w-12 bg-white/10 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
