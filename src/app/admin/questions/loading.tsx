export default function QuestionsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      <div className="flex justify-between">
        <div className="h-8 w-36 bg-white/10 rounded" />
        <div className="h-10 w-32 bg-white/10 rounded-lg" />
      </div>
      <div className="h-10 w-full bg-white/5 rounded-lg" />
      <div className="bg-[var(--k-glass-thin)] rounded-lg divide-y">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 space-y-2">
            <div className="h-4 w-3/4 bg-white/10 rounded" />
            <div className="h-3 w-1/2 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
