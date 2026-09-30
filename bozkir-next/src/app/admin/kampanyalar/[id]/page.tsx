import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { getDb } from '@/lib/db/client';
import { campaigns } from '@/lib/db/schema';
import { publicUrl } from '@/lib/storage/s3';
import { CampaignForm } from '@/components/admin/CampaignForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCampaignPage({ params }: PageProps) {
  const { id } = await params;
  const db = getDb();
  if (!db) notFound();

  const rows = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  const campaign = rows[0];
  if (!campaign) notFound();

  return (
    <div>
      <Link href="/admin/kampanyalar" className="inline-flex items-center gap-2 text-sm text-muted-strong hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kampanyalar
      </Link>
      <h1 className="mt-6 text-2xl font-medium tracking-tight">Kampanyayı Düzenle</h1>
      <div className="mt-8 rounded-xl border border-border bg-surface p-7">
        <CampaignForm
          initial={{
            id: campaign.id,
            title: campaign.title ?? '',
            description: campaign.description ?? '',
            imageUrl: publicUrl(campaign.imageUrl ?? ''),
            linkUrl: campaign.linkUrl ?? '',
            linkLabel: campaign.linkLabel ?? 'İncele',
            sortOrder: campaign.sortOrder ?? 0,
            isActive: campaign.isActive ?? true,
            startsAt: campaign.startsAt ? campaign.startsAt.toISOString() : '',
            endsAt: campaign.endsAt ? campaign.endsAt.toISOString() : '',
            titleEn: campaign.titleEn ?? '',
            titleAr: campaign.titleAr ?? '',
            descriptionEn: campaign.descriptionEn ?? '',
            descriptionAr: campaign.descriptionAr ?? '',
            linkLabelEn: campaign.linkLabelEn ?? '',
            linkLabelAr: campaign.linkLabelAr ?? '',
          }}
        />
      </div>
    </div>
  );
}
