export default function CustomerDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 bg-white/10 rounded" />
        <div className="h-8 w-48 bg-white/10 rounded" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 bg-white/10 rounded-full" />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-white/10 rounded" />
          <div className="h-4 w-56 bg-white/5 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-white/10 rounded-lg" />
        ))}
      </div>
      <div className="bg-[var(--k-glass-thin)] rounded-lg p-6 space-y-3">
        <div className="h-6 w-32 bg-white/10 rounded" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-white/5 rounded" />
        ))}
      </div>
    </div>
  );
}
