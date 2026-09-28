export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center pt-[var(--header-height)]">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-foreground" />
        Yükleniyor...
      </div>
    </div>
  );
}
