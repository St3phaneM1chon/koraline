export default function RechercheComptaLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="h-8 w-36 bg-white/10 rounded" />
      <div className="h-10 w-full bg-white/5 rounded-lg" />
      <div className="bg-[var(--k-glass-thin)] rounded-lg p-6 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-white/5 rounded" />
        ))}
      </div>
    </div>
  );
}
