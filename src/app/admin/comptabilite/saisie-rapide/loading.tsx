export default function SaisieRapideLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="h-8 w-40 bg-white/10 rounded" />
      <div className="bg-[var(--k-glass-thin)] rounded-lg p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 bg-white/10 rounded" />
            <div className="h-10 w-full bg-white/5 rounded" />
          </div>
        ))}
        <div className="h-10 w-32 bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}
