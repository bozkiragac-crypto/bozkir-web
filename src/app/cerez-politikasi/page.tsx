import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { LegalPage, LegalSection } from '@/components/ui/LegalPage';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = buildMetadata({
  title: 'Çerez Politikası | Bozkır Ağaç Ürünleri',
  description: 'Web sitemizde kullanılan çerezler ve yönetimi.',
  path: '/cerez-politikasi',
  noIndex: true,
});

const cookieTypes = [
  {
    type: 'Zorunlu çerezler',
    purpose: 'Sitenin temel işlevleri (güvenlik, formlar, oturum) için gereklidir.',
    duration: 'Oturum',
  },
  {
    type: 'Performans/analitik çerezleri',
    purpose: 'Ziyaretlerin anonim istatistikleri ile siteyi iyileştirmek için kullanılır.',
    duration: 'Kalıcı (azami 24 ay)',
  },
  {
    type: 'Tercih çerezleri',
    purpose: 'Dil/tema gibi kullanıcı tercihlerini hatırlamak için kullanılır.',
    duration: 'Kalıcı (azami 12 ay)',
  },
];

export default function CookiePage() {
  return (
    <LegalPage title="Çerez Politikası" updated="2026">
      <LegalSection title="1. Çerez Nedir?">
        <p>
          Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınıza kaydedilen küçük metin
          dosyalarıdır. Deneyiminizi iyileştirmek ve anonim istatistikler toplamak için kullanılır.
        </p>
      </LegalSection>

      <LegalSection title="2. Kullandığımız Çerez Türleri">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-foreground">
              <tr>
                <th className="p-4 font-medium">Tür</th>
                <th className="p-4 font-medium">Amaç</th>
                <th className="p-4 font-medium">Süre</th>
              </tr>
            </thead>
            <tbody>
              {cookieTypes.map((c) => (
                <tr key={c.type} className="border-t border-border">
                  <td className="p-4">{c.type}</td>
                  <td className="p-4">{c.purpose}</td>
                  <td className="p-4 whitespace-nowrap">{c.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="3. Üçüncü Taraf Çerezleri">
        <p>
          Analitik hizmet sağlayıcıları (ör. Google Analytics) anonim kullanım istatistikleri için çerez
          yerleştirebilir. Bu çerezler kimliğinizi doğrudan tanımlamaz.
        </p>
      </LegalSection>

      <LegalSection title="4. Çerezleri Nasıl Yönetirsiniz?">
        <p>
          Tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezlerin
          engellenmesi hâlinde sitenin bazı bölümleri düzgün çalışmayabilir.
        </p>
      </LegalSection>

      <LegalSection title="5. İletişim">
        <p>Çerez politikasına ilişkin sorularınız için {siteConfig.email} adresine yazabilirsiniz.</p>
      </LegalSection>
    </LegalPage>
  );
}
