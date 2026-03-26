export default function DevisesComptaLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="h-8 w-32 bg-white/10 rounded" />
      <div className="bg-[var(--k-glass-thin)] rounded-lg p-6 space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-10 bg-white/5 rounded" />
        ))}
      </div>
    </div>
  );
}
