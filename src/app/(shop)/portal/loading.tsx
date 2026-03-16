export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin mb-4" />
      <p className="text-gray-500">Chargement...</p>
    </div>
  );
}
