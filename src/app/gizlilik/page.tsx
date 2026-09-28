import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { LegalPage, LegalSection } from '@/components/ui/LegalPage';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = buildMetadata({
  title: 'Gizlilik Politikası | Bozkır Ağaç Ürünleri',
  description: 'Web sitemizin gizlilik politikası.',
  path: '/gizlilik',
  noIndex: true,
});

export default function PrivacyPage() {
  return (
    <LegalPage title="Gizlilik Politikası" updated="2026">
      <LegalSection title="1. Genel Bilgi">
        <p>
          Bu politika, {siteConfig.legalName} tarafından işletilen web sitesini ziyaret eden kullanıcıların
          bilgilerinin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
        </p>
      </LegalSection>

      <LegalSection title="2. Toplanan Bilgiler">
        <p>
          Teklif ve iletişim formlarını doldurduğunuzda paylaştığınız ad soyad, firma, telefon, e-posta ve
          talep içeriği; siteyi ziyaret ettiğinizde ise teknik veriler (IP, tarayıcı, ziyaret edilen
          sayfalar) toplanabilir.
        </p>
      </LegalSection>

      <LegalSection title="3. Kullanım Amaçları">
        <p>
          Bilgileriniz; taleplerinize dönüş yapmak, hizmetlerimizi sunmak ve iyileştirmek, site güvenliğini
          sağlamak ve yasal yükümlülükleri yerine getirmek amacıyla kullanılır.
        </p>
      </LegalSection>

      <LegalSection title="4. Üçüncü Taraf Hizmetler">
        <p>
          Site; barındırma, e-posta/iletişim altyapısı ve anonim ziyaret istatistikleri için üçüncü taraf
          hizmetlerden yararlanabilir. Bu hizmetler yalnızca hizmetin gerektirdiği verileri işler.
        </p>
      </LegalSection>

      <LegalSection title="5. Güvenlik">
        <p>
          Verilerin yetkisiz erişime karşı korunması için teknik ve idari tedbirler uygulanır. Buna karşın
          internet üzerinden iletimin mutlak güvenliği garanti edilemez.
        </p>
      </LegalSection>

      <LegalSection title="6. Değişiklikler">
        <p>
          Bu politika zaman zaman güncellenebilir. Güncel sürüm bu sayfada yayımlanır.
        </p>
      </LegalSection>

      <LegalSection title="7. İletişim">
        <p>Sorularınız için {siteConfig.email} adresinden bize ulaşabilirsiniz.</p>
      </LegalSection>
    </LegalPage>
  );
}
