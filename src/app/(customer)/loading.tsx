export default function Loading() {
  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border bg-card">
          <div className="shimmer h-48 bg-muted" />
          <div className="space-y-2 p-4"><div className="shimmer h-4 w-24 rounded bg-muted" /><div className="shimmer h-4 w-full rounded bg-muted" /></div>
        </div>
      ))}
    </div>
  );
}
