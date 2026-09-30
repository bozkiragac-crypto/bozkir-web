import type { ContentBlock, ContentItem } from '@/types/content';

/**
 * FALLBACK / TASLAK İÇERİK
 * Supabase content_blocks/content_items boşken veya SQL çalıştırılmamışken
 * ana sayfanın boş kalmaması için kullanılır. Admin panelden düzenlenen
 * içerik bu taslağın üzerine yazılır.
 *
 * Not: Uydurma teknik sayı yoktur; SSS'teki politika cevapları yuvarlak ve
 * her koşulda doğru olacak şekilde yazılmıştır (net politika için düzenlenmeli).
 */
let seq = 0;
function item(blockKey: string, data: Partial<ContentItem>): ContentItem {
  seq += 1;
  return {
    id: `${blockKey}-${seq}`,
    blockKey,
    title: data.title ?? '',
    description: data.description ?? '',
    imageUrl: data.imageUrl ?? '',
    linkUrl: data.linkUrl ?? '',
    tag: data.tag ?? '',
    sortOrder: data.sortOrder ?? seq,
  };
}

const galleryImages = [
  '/images/gallery/SGL_849.webp',
  '/images/gallery/SGL_859.webp',
  '/images/gallery/SGL_98A.webp',
  '/images/gallery/SGL_02B.webp',
  '/images/gallery/SGL_Z39.webp',
  '/images/gallery/SGL_Z28.webp',
  '/images/gallery/SGL_770.webp',
  '/images/gallery/SGL_297.webp',
  '/images/gallery/VT_344.webp',
  '/images/gallery/VT_408.webp',
  '/images/gallery/VT_509.webp',
  '/images/gallery/VT_681.webp',
  '/images/gallery/VT_084.webp',
  '/images/gallery/YT_10H.webp',
  '/images/gallery/YT_Z28.webp',
  '/images/gallery/YT_Z33.webp',
  '/images/gallery/milano.webp',
  '/images/gallery/dubai.webp',
  '/images/gallery/odessa.webp',
  '/images/gallery/lima.webp',
];

function buildFallback(): Record<string, ContentBlock> {
  seq = 0;

  const gallery: ContentBlock = {
    key: 'gallery',
    title: 'Malzeme Vitrini',
    subtitle: 'Gerçek yüzeyler, gerçek renkler',
    body: 'Ürün gruplarımızdan yüzey örnekleri. Gerçek renk ve dokular için katalog ve numune talep edebilirsiniz.',
    items: galleryImages.map((imageUrl, i) => item('gallery', { imageUrl, sortOrder: i })),
  };

  const guide: ContentBlock = {
    key: 'guide',
    title: 'Malzeme Rehberi',
    subtitle: 'Hangi iş için hangi panel?',
    body: 'Doğru paneli seçmek; işçilik, dayanım ve maliyet dengesini belirler. Aşağıdaki kısa rehber, ihtiyacınıza uygun grubu bulmanıza yardımcı olur.',
    items: [
      item('guide', {
        title: 'MDF',
        tag: 'Boya & Lak',
        description:
          'Homojen lif yapısı sayesinde pürüzsüz yüzey verir. Boya, lak ve freze/kabartma işlerinde tercih edilir.',
        linkUrl: '/kategoriler/mdf',
      }),
      item('guide', {
        title: 'MDF Lam',
        tag: 'Dekor',
        description:
          'Dekor kaplı yüzeyiyle farklı renk ve desen seçenekleri sunar; hızlı üretim sağlar, ek boya gerektirmez.',
        linkUrl: '/kategoriler/mdflam',
      }),
      item('guide', {
        title: 'Suntalam',
        tag: 'Ekonomik',
        description: 'Yonga levha üzerine dekor kaplı panel. Gövde, raf ve kapak üretiminde ekonomik çözümdür.',
        linkUrl: '/kategoriler/suntalam',
      }),
      item('guide', {
        title: 'Sunta',
        tag: 'Gövde',
        description: 'Mobilya gövdesi ve yapısal parçalarda kullanılan temel yonga levhadır; farklı kalınlıklarda tedarik edilir.',
        linkUrl: '/kategoriler/sunta',
      }),
      item('guide', {
        title: 'Lak Panel',
        tag: 'Parlak Yüzey',
        description: 'Pürüzsüz ve parlak yüzeyiyle modern iç mekânlarda şık bir görünüm sağlar.',
        linkUrl: '/kategoriler/lak-panel',
      }),
      item('guide', {
        title: 'PVC Kenar Bant',
        tag: 'Tamamlayıcı',
        description: 'Panel kenarlarının tamamlayıcısıdır; dekor ve renk uyumuyla bütünlüklü bir görünüm oluşturur.',
        linkUrl: '/kategoriler/pvc-kenar-bant',
      }),
    ],
  };

  const applications: ContentBlock = {
    key: 'applications',
    title: 'Uygulama Alanları',
    subtitle: 'Panelin işe dönüştüğü yerler',
    body: '',
    items: [
      item('applications', { title: 'Mutfak', imageUrl: '/images/gallery/SGL_849.webp', description: 'Dolap gövdesi ve kapaklarda dekor ve dayanım dengesi.' }),
      item('applications', { title: 'İç Mekân Kapı', imageUrl: '/images/gallery/milano.webp', description: 'Kapı panelleri ve pervaz uygulamaları.' }),
      item('applications', { title: 'Dolap & Depolama', imageUrl: '/images/gallery/SGL_859.webp', description: 'Gövde ve raflarda geniş ürün seçenekleri.' }),
      item('applications', { title: 'Banyo & Islak Alan', imageUrl: '/images/gallery/VT_509.webp', description: 'Uygun panel seçimiyle nemli alanlara yönelik çözümler.' }),
      item('applications', { title: 'Ofis & Ticari', imageUrl: '/images/gallery/YT_10H.webp', description: 'Yoğun kullanıma uygun, sürdürülebilir malzemeler.' }),
      item('applications', { title: 'Duvar & Dekor', imageUrl: '/images/gallery/SGL_770.webp', description: 'Duvar profili ve dekoratif yüzey uygulamaları.' }),
    ],
  };

  const process: ContentBlock = {
    key: 'process',
    title: 'Nasıl Çalışıyoruz',
    subtitle: 'Talepten teslimata',
    body: '',
    items: [
      item('process', { title: 'Talep', description: 'İhtiyacınızı, ürün kodlarını ve ölçüleri telefon, WhatsApp veya form üzerinden iletin.' }),
      item('process', { title: 'Teklif', description: 'Ekibimiz stok durumu ve fiyat bilgisiyle geri döner.' }),
      item('process', { title: 'Hazırlık', description: 'Ürün stoktan hazırlanır; kesim ve sevkiyat planlanır.' }),
      item('process', { title: 'Sevkiyat', description: 'Belirlenen adrese teslim edilir; süreç boyunca bilgilendirilirsiniz.' }),
    ],
  };

  const faq: ContentBlock = {
    key: 'faq',
    title: 'Sıkça Sorulan Sorular',
    subtitle: '',
    body: '',
    items: [
      item('faq', { title: 'Kalınlık seçimini nasıl yapmalıyım?', description: 'Kalınlık; kullanım yerine ve taşıyacağı yüke göre belirlenir. Gövde ve raflarda daha kalın, kapak ve dekoratif yüzeylerde daha ince paneller tercih edilir. İhtiyacınıza uygun seçim için bize danışabilirsiniz.' }),
      item('faq', { title: 'Numune temin ediyor musunuz?', description: 'Renk ve dokuyu yerinde görmeniz için numune talebinizi bize iletebilirsiniz; ekibimiz uygun seçenekleri paylaşır.' }),
      item('faq', { title: 'Minimum sipariş adedi var mı?', description: 'Sipariş koşulları ürün grubuna göre değişebilir. Talebinize özel bilgi için bizimle iletişime geçin.' }),
      item('faq', { title: 'Teslimat süresi ne kadar?', description: 'Teslim süresi; ürünün stok durumuna, adede ve teslimat adresine göre değişir. Sipariş sırasında net süre paylaşılır.' }),
      item('faq', { title: 'Hangi bölgelere sevkiyat yapıyorsunuz?', description: 'Antakya merkezli olarak Hatay ve çevre bölgelere sevkiyat yapıyoruz. Farklı bölgeler için bize ulaşabilirsiniz.' }),
      item('faq', { title: 'Ödeme seçenekleri neler?', description: 'Nakit, kredi kartı ve çek ile ödeme imkânı sunuyoruz.' }),
    ],
  };

  return { gallery, guide, applications, process, faq };
}

export const fallbackContent: Record<string, ContentBlock> = buildFallback();
