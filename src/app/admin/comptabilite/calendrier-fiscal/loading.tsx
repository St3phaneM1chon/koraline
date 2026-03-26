export default function CalendrierFiscalLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="h-8 w-48 bg-white/10 rounded" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-white/10 rounded-lg" />
        ))}
      </div>
      <div className="bg-[var(--k-glass-thin)] rounded-lg p-6 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 bg-white/5 rounded" />
        ))}
      </div>
    </div>
  );
}
