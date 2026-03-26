export default function DeclarationTpsTvqLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="h-8 w-56 bg-white/10 rounded" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-white/10 rounded-lg" />
        ))}
      </div>
      <div className="bg-[var(--k-glass-thin)] rounded-lg p-6 space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-10 bg-white/5 rounded" />
        ))}
      </div>
    </div>
  );
}
