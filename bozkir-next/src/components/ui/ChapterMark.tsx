import { cn } from '@/lib/utils';

/**
 * Sinematik bölüm işareti: ince çizgi + bölüm etiketi.
 * Ana sayfada kaydırma boyunca tekrar eden ince bir ritim kurar.
 */
export function ChapterMark({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <p className={cn('chapter-mark flex items-center gap-3', className)}>
      <span className="h-px w-8 bg-accent/50" aria-hidden />
      <span>{label}</span>
    </p>
  );
}
