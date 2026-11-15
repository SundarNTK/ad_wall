export default function Loading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4 rounded-3xl border bg-card p-7">
        <div className="grid grid-cols-5 gap-2">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="shimmer h-12 rounded-xl bg-muted" />)}</div>
        <div className="shimmer h-8 w-1/3 rounded bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="shimmer h-16 rounded-2xl bg-muted" />)}</div>
      </div>
      <div className="shimmer hidden h-72 rounded-3xl bg-muted lg:block" />
    </div>
  );
}
