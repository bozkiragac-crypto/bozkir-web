'use client';

import { useMemo, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Dropdown } from '@/components/ui/Dropdown';
import { GalleryShowcase, type ShowcaseItem } from '@/components/home/GalleryShowcase';
import { useDictionary } from '@/i18n/DictionaryProvider';

/**
 * "Malzeme Vitrini" bölümü: başlık + kategori filtresi (dropdown, başlık
 * hizasında sağda) + mozaik vitrin. Filtre state'i burada tutulur; önceden
 * satırı kaplayan kategori çipleri kompakt bir dropdown'a indirildi.
 */
export function MaterialShowcase({
  items,
  eyebrow,
  title,
  body,
}: {
  items: ShowcaseItem[];
  eyebrow?: string;
  title: string;
  body?: string;
}) {
  const { t } = useDictionary();
  const [filter, setFilter] = useState('');

  const tags = useMemo(() => Array.from(new Set(items.map((i) => i.tag).filter(Boolean))), [items]);
  const shown = filter ? items.filter((i) => i.tag === filter) : items;

  return (
    <>
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          body={body}
          action={
            tags.length > 1 ? (
              <Dropdown
                value={filter}
                onChange={setFilter}
                ariaLabel={t('catalog.category')}
                className="min-w-[12rem]"
                options={[
                  { value: '', label: t('catalog.all') },
                  ...tags.map((tag) => ({ value: tag, label: tag })),
                ]}
              />
            ) : undefined
          }
        />
      </Container>

      <GalleryShowcase items={shown} />
    </>
  );
}
