export default function EtatsFinanciersLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="h-8 w-48 bg-white/10 rounded" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white/10 rounded-lg" />
        ))}
      </div>
      <div className="bg-[var(--k-glass-thin)] rounded-lg p-6 space-y-3">
        <div className="h-6 w-40 bg-white/10 rounded" />
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-10 bg-white/5 rounded" />
        ))}
      </div>
    </div>
  );
}
