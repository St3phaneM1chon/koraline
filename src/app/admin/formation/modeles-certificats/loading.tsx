export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-4 bg-muted rounded w-2/3" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-56 bg-muted rounded-xl" />
        <div className="h-56 bg-muted rounded-xl" />
        <div className="h-56 bg-muted rounded-xl" />
      </div>
    </div>
  );
}
