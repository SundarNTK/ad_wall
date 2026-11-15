export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="shimmer h-9 w-48 rounded bg-muted" />
      <div className="mt-4 flex gap-2">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="shimmer h-10 w-28 rounded-full bg-muted" />)}</div>
      <div className="mt-6 space-y-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="shimmer h-20 rounded-2xl bg-muted" />)}</div>
    </div>
  );
}
