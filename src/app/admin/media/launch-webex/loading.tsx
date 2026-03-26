export default function LaunchWebexLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="h-8 w-48 bg-white/10 rounded" />
      <div className="bg-[var(--k-glass-thin)] rounded-lg p-6 space-y-4">
        <div className="h-10 w-full bg-white/5 rounded" />
        <div className="h-10 w-full bg-white/5 rounded" />
        <div className="h-10 w-32 bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}
