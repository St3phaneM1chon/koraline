export default function NavigateurViewLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="h-8 w-40 bg-white/10 rounded" />
      <div className="h-10 w-full bg-white/5 rounded-lg" />
      <div className="bg-[var(--k-glass-thin)] rounded-lg p-6">
        <div className="h-96 bg-white/5 rounded" />
      </div>
    </div>
  );
}
