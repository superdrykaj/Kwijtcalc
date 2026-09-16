export default function Loading() {
  return (
    <div className="container-page py-24" aria-busy="true">
      <span className="sr-only">Bezig met laden…</span>
      <div className="h-4 w-32 animate-pulse rounded bg-ink-800" />
      <div className="mt-6 h-12 w-2/3 animate-pulse rounded bg-ink-800" />
      <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-ink-800" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-ink-800" />
        ))}
      </div>
    </div>
  );
}
