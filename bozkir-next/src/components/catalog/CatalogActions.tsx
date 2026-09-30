'use client';

import { Download, ExternalLink } from 'lucide-react';
import type { Catalog } from '@/types/catalog';
import { track } from '@/lib/analytics';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { useDictionary } from '@/i18n/DictionaryProvider';

/** Katalog butonları — analytics olaylarını burada tetikler. */
export function CatalogActions({ catalog }: { catalog: Catalog }) {
  const { dict } = useDictionary();
  if (!catalog.pdfUrl) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm text-muted">
        <Download className="h-4 w-4" /> {dict.pages.catalog.comingSoon}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <MagneticButton className="w-full sm:w-auto">
        <a
          href={catalog.pdfUrl}
          download
          onClick={() => track('catalog_download', { catalog: catalog.slug })}
          className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-transform duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 sm:w-auto"
        >
          <Download className="h-4 w-4" /> {dict.pages.catalog.download}
        </a>
      </MagneticButton>
      <a
        href={catalog.pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track('catalog_view', { catalog: catalog.slug })}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border-strong px-6 text-sm font-medium transition-colors hover:bg-surface-2 sm:w-auto"
      >
        <ExternalLink className="h-4 w-4" /> {dict.pages.catalog.view}
      </a>
    </div>
  );
}
