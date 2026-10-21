import type { ContentBlock } from '@/types/content';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SmartImage as Image } from '@/components/ui/SmartImage';
import { dictForRequest } from '@/i18n/server';
import type { Locale } from '@/i18n/config';

/** Belgeler & sertifikalar — admin içerik ekleyene kadar gizli. */
export async function Certifications({ block, locale }: { block: ContentBlock; locale: Locale }) {
  const items = block.items;
  if (items.length === 0) return null;
  const dict = await dictForRequest(locale);
  const h = dict.home.block;

  return (
    <Container className="pb-16">
      <SectionHeading
        eyebrow={block.subtitle || h.certifications}
        title={block.title}
        body={block.body}
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-4 rounded-lg border border-border bg-surface p-5"
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.title}
                width={56}
                height={56}
                className="h-14 w-14 flex-none rounded-md object-contain"
              />
            ) : null}
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              {item.tag && <p className="text-xs text-muted">{item.tag}</p>}
              {item.description && (
                <p className="mt-1 text-xs leading-relaxed text-muted-strong">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
