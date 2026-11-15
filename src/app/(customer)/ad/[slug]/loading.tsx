export default function Loading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-3">
        <div className="shimmer h-[360px] rounded-3xl bg-muted" />
        <div className="flex gap-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="shimmer h-16 w-24 rounded-xl bg-muted" />)}</div>
        <div className="shimmer h-5 w-3/4 rounded bg-muted" />
        <div className="shimmer h-4 w-full rounded bg-muted" />
        <div className="shimmer h-4 w-5/6 rounded bg-muted" />
      </div>
      <div className="space-y-3 rounded-3xl border bg-card p-5">
        <div className="shimmer h-8 w-2/3 rounded bg-muted" />
        <div className="shimmer h-6 w-1/3 rounded bg-muted" />
        <div className="shimmer h-24 w-full rounded-2xl bg-muted" />
        <div className="shimmer h-11 w-full rounded-full bg-muted" />
      </div>
    </div>
  );
}
