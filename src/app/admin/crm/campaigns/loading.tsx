export default function CrmCampaignsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-live="polite" aria-busy="true">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-white/10 rounded" />
        <div className="h-10 w-32 bg-white/10 rounded-lg" />
      </div>

      {/* Content area */}
      <div className="bg-[var(--k-glass-thin)] rounded-xl border border-[var(--k-border-subtle)] p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 flex-1 bg-white/10 rounded" />
              <div className="h-4 w-24 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
