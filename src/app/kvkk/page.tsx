import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { LegalPage, LegalSection } from '@/components/ui/LegalPage';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = buildMetadata({
  title: 'KVKK Aydınlatma Metni | Bozkır Ağaç Ürünleri',
  description: '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.',
  path: '/kvkk',
  noIndex: true,
});

export default function KvkkPage() {
  return (
    <LegalPage title="KVKK Aydınlatma Metni" updated="2026">
      <LegalSection title="1. Veri Sorumlusu">
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca kişisel verileriniz, veri
          sorumlusu sıfatıyla {siteConfig.legalName} tarafından aşağıda açıklanan kapsamda işlenmektedir.
        </p>
        <p>
          Adres: {siteConfig.address.street}, {siteConfig.address.postalCode} {siteConfig.address.locality} /{' '}
          {siteConfig.address.region}. E-posta: {siteConfig.email}
        </p>
      </LegalSection>

      <LegalSection title="2. İşlenen Kişisel Veriler">
        <p>
          Teklif ve iletişim talepleriniz kapsamında ad soyad, firma adı, telefon numarası, e-posta adresi,
          talep içeriği ve paylaştığınız dosyalar işlenebilir. Web sitemizi ziyaretinizde teknik veriler
          (IP adresi, tarayıcı bilgileri, çerez kayıtları) toplanabilir.
        </p>
      </LegalSection>

      <LegalSection title="3. İşleme Amaçları">
        <p>
          Kişisel verileriniz; teklif taleplerinin değerlendirilmesi, sipariş ve tedarik süreçlerinin
          yürütülmesi, müşteri ilişkilerinin yönetimi, talebinize dönüş yapılması, yasal yükümlülüklerin
          yerine getirilmesi ve site güvenliğinin sağlanması amaçlarıyla işlenir.
        </p>
      </LegalSection>

      <LegalSection title="4. Hukuki Sebepler">
        <p>
          Verileriniz; sözleşmenin kurulması veya ifası, hukuki yükümlülüklerin yerine getirilmesi, meşru
          menfaat ve açık rıza hukuki sebeplerine dayanılarak KVKK m.5 ve m.6 kapsamında işlenir.
        </p>
      </LegalSection>

      <LegalSection title="5. Aktarım">
        <p>
          Verileriniz; hizmet aldığımız bilişim/barındırma sağlayıcıları ve yasal olarak yetkili kamu
          kurumlarıyla, yalnızca ilgili amaçla sınırlı olarak paylaşılabilir. Yurt dışına aktarım
          yapılması hâlinde KVKK&apos;nın ilgili hükümlerine uygun hareket edilir.
        </p>
      </LegalSection>

      <LegalSection title="6. Saklama Süresi">
        <p>
          Verileriniz, işleme amaçlarının gerektirdiği süre ve ilgili mevzuatta öngörülen azami süreler
          boyunca saklanır; süre sonunda silinir, yok edilir veya anonim hâle getirilir.
        </p>
      </LegalSection>

      <LegalSection title="7. KVKK m.11 Kapsamındaki Haklarınız">
        <p>
          Kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme,
          işlenme amacını öğrenme, eksik/yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok
          edilmesini isteme, aktarıldığı üçüncü kişileri öğrenme, otomatik sistemlerle analiz sonucu
          aleyhinize çıkan sonuçlara itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz.
        </p>
      </LegalSection>

      <LegalSection title="8. Başvuru">
        <p>
          Haklarınıza ilişkin taleplerinizi {siteConfig.email} adresine iletebilirsiniz. Başvurularınız
          mevzuatta öngörülen süre içinde yanıtlanır.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
