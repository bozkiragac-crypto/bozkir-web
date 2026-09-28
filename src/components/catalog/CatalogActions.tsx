'use client';

import { Download, ExternalLink } from 'lucide-react';
import type { Catalog } from '@/types/catalog';
import { track } from '@/lib/analytics';

/** Katalog butonları — analytics olaylarını burada tetikler. */
export function CatalogActions({ catalog }: { catalog: Catalog }) {
  if (!catalog.pdfUrl) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm text-muted">
        <Download className="h-4 w-4" /> PDF yakında eklenecek
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={catalog.pdfUrl}
        download
        onClick={() => track('catalog_download', { catalog: catalog.slug })}
        className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-transform duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5"
      >
        <Download className="h-4 w-4" /> PDF İndir
      </a>
      <a
        href={catalog.pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track('catalog_view', { catalog: catalog.slug })}
        className="inline-flex h-12 items-center gap-2 rounded-full border border-border-strong px-6 text-sm font-medium transition-colors hover:bg-surface-2"
      >
        <ExternalLink className="h-4 w-4" /> Görüntüle
      </a>
    </div>
  );
}
