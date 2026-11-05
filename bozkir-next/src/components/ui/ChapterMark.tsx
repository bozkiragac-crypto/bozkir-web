import { cn } from '@/lib/utils';

/**
 * Sinematik bölüm işareti: "03 / 14 — UYGULAMA".
 * Ana sayfada kaydırma boyunca tekrar eden ince bir ritim kurar.
 */
export function ChapterMark({
  index,
  total,
  label,
  className,
}: {
  index: number;
  total: number;
  label: string;
  className?: string;
}) {
  return (
    <p className={cn('chapter-mark flex items-center gap-3', className)}>
      <span aria-hidden>
        {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
      <span className="h-px w-8 bg-accent/50" aria-hidden />
      <span>{label}</span>
    </p>
  );
}
