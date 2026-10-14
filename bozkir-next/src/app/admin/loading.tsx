export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Yükleniyor…</span>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="skeleton h-7 w-40 rounded-md" />
          <div className="skeleton h-4 w-64 rounded-md" />
        </div>
        <div className="skeleton h-11 w-32 rounded-full" />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-6">
            <div className="skeleton h-5 w-5 rounded" />
            <div className="skeleton mt-6 h-9 w-16 rounded-md" />
            <div className="skeleton mt-3 h-4 w-24 rounded-md" />
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6">
        <div className="skeleton h-5 w-48 rounded-md" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-4 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
