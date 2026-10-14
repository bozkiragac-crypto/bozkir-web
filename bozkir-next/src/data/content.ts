import type { ContentBlock, ContentItem } from '@/types/content';

/**
 * FALLBACK / TASLAK İÇERİK
 * DB content_blocks/content_items boşken ana sayfanın boş kalmaması için kullanılır.
 * TR zorunlu; EN/AR çevirileri opsiyoneldir (boşsa TR'ye düşer). Admin panelden
 * düzenlenen içerik bu taslağın üzerine yazılır.
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
    titleEn: data.titleEn ?? '',
    titleAr: data.titleAr ?? '',
    descriptionEn: data.descriptionEn ?? '',
    descriptionAr: data.descriptionAr ?? '',
    tagEn: data.tagEn ?? '',
    tagAr: data.tagAr ?? '',
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
    titleEn: 'Material Showcase',
    subtitleEn: 'Real surfaces, real colours',
    bodyEn:
      'Surface samples from our product groups. Request a catalogue and samples for real colours and textures.',
    titleAr: 'واجهة المواد',
    subtitleAr: 'أسطح حقيقية وألوان حقيقية',
    bodyAr: 'عينات أسطح من مجموعات منتجاتنا. اطلب الكتالوج والعينات للألوان والملمس الحقيقي.',
    items: galleryImages.map((imageUrl, i) => item('gallery', { imageUrl, sortOrder: i })),
  };

  const guide: ContentBlock = {
    key: 'guide',
    title: 'Malzeme Rehberi',
    subtitle: 'Hangi iş için hangi panel?',
    body: 'Doğru paneli seçmek; işçilik, dayanım ve maliyet dengesini belirler. Aşağıdaki kısa rehber, ihtiyacınıza uygun grubu bulmanıza yardımcı olur.',
    titleEn: 'Material Guide',
    subtitleEn: 'Which board for which job?',
    bodyEn:
      'Choosing the right board balances workability, durability and cost. This short guide helps you find the right group.',
    titleAr: 'دليل المواد',
    subtitleAr: 'أي لوح لأي عمل؟',
    bodyAr:
      'اختيار اللوح المناسب يوازن بين سهولة التشغيل والمتانة والتكلفة. يساعدك هذا الدليل على إيجاد المجموعة المناسبة.',
    items: [
      item('guide', {
        title: 'MDF',
        tag: 'Boya & Lak',
        description:
          'Homojen lif yapısı sayesinde pürüzsüz yüzey verir. Boya, lak ve freze/kabartma işlerinde tercih edilir.',
        titleEn: 'MDF',
        tagEn: 'Paint & Lacquer',
        descriptionEn:
          'Its homogeneous fibre structure gives a smooth surface. Preferred for painting, lacquering and routing.',
        titleAr: 'MDF',
        tagAr: 'دهان وورنيش',
        descriptionAr:
          'يمنح سطحًا أملس بفضل بنيته الليفية المتجانسة. يُفضّل في أعمال الدهان والورنيش والحفر.',
        linkUrl: '/kategoriler/mdf',
      }),
      item('guide', {
        title: 'MDF Lam',
        tag: 'Dekor',
        description:
          'Dekor kaplı yüzeyiyle farklı renk ve desen seçenekleri sunar; hızlı üretim sağlar, ek boya gerektirmez.',
        titleEn: 'MDF Laminate',
        tagEn: 'Decor',
        descriptionEn:
          'Its decor-coated surface offers many colours and patterns; enables fast production with no extra painting.',
        titleAr: 'MDF مغلّف',
        tagAr: 'ديكور',
        descriptionAr:
          'سطحه المكسو بالديكور يوفّر خيارات متعددة من الألوان والأنماط؛ يتيح إنتاجًا سريعًا دون دهان إضافي.',
        linkUrl: '/kategoriler/mdflam',
      }),
      item('guide', {
        title: 'Suntalam',
        tag: 'Ekonomik',
        description:
          'Yonga levha üzerine dekor kaplı panel. Gövde, raf ve kapak üretiminde ekonomik çözümdür.',
        titleEn: 'Suntalam',
        tagEn: 'Economical',
        descriptionEn:
          'A decor-coated panel over particleboard. An economical solution for carcasses, shelves and doors.',
        titleAr: 'سنتالام',
        tagAr: 'اقتصادي',
        descriptionAr: 'لوح مكسو بالديكور فوق ألواح الجسيمات. حل اقتصادي للهياكل والأرفف والأبواب.',
        linkUrl: '/kategoriler/suntalam',
      }),
      item('guide', {
        title: 'Sunta',
        tag: 'Gövde',
        description:
          'Mobilya gövdesi ve yapısal parçalarda kullanılan temel yonga levhadır; farklı kalınlıklarda tedarik edilir.',
        titleEn: 'Particleboard',
        tagEn: 'Carcass',
        descriptionEn:
          'The basic particleboard used for furniture carcasses and structural parts; available in various thicknesses.',
        titleAr: 'ألواح الجسيمات',
        tagAr: 'الهيكل',
        descriptionAr:
          'لوح الجسيمات الأساسي المستخدم في هياكل الأثاث والأجزاء الإنشائية؛ متوفر بسماكات مختلفة.',
        linkUrl: '/kategoriler/sunta',
      }),
      item('guide', {
        title: 'Lak Panel',
        tag: 'Parlak Yüzey',
        description: 'Pürüzsüz ve parlak yüzeyiyle modern iç mekânlarda şık bir görünüm sağlar.',
        titleEn: 'Lacquered Panel',
        tagEn: 'Gloss Surface',
        descriptionEn: 'Its smooth, glossy surface gives a stylish look in modern interiors.',
        titleAr: 'لوح ملمّع',
        tagAr: 'سطح لامع',
        descriptionAr: 'سطحه الأملس واللامع يمنح مظهرًا أنيقًا في المساحات الداخلية الحديثة.',
        linkUrl: '/kategoriler/lak-panel',
      }),
      item('guide', {
        title: 'PVC Kenar Bant',
        tag: 'Tamamlayıcı',
        description:
          'Panel kenarlarının tamamlayıcısıdır; dekor ve renk uyumuyla bütünlüklü bir görünüm oluşturur.',
        titleEn: 'PVC Edge Banding',
        tagEn: 'Complementary',
        descriptionEn:
          'It complements panel edges; creates a coherent look with matching decor and colour.',
        titleAr: 'شريط حواف PVC',
        tagAr: 'تكاملي',
        descriptionAr: 'يكمل حواف الألواح؛ يخلق مظهرًا متناسقًا مع تطابق الديكور واللون.',
        linkUrl: '/kategoriler/pvc-kenar-bant',
      }),
    ],
  };

  const applications: ContentBlock = {
    key: 'applications',
    title: 'Uygulama Alanları',
    subtitle: 'Panelin işe dönüştüğü yerler',
    body: '',
    titleEn: 'Application Areas',
    subtitleEn: 'Where panels become work',
    titleAr: 'مجالات الاستخدام',
    subtitleAr: 'حيث تتحول الألواح إلى منتَج',
    items: [
      item('applications', {
        title: 'Mutfak',
        imageUrl: '/images/gallery/SGL_849.webp',
        description: 'Dolap gövdesi ve kapaklarda dekor ve dayanım dengesi.',
        titleEn: 'Kitchen',
        descriptionEn: 'Balance of decor and durability in cabinet carcasses and doors.',
        titleAr: 'المطبخ',
        descriptionAr: 'توازن بين الديكور والمتانة في هياكل الخزائن والأبواب.',
      }),
      item('applications', {
        title: 'İç Mekân Kapı',
        imageUrl: '/images/gallery/milano.webp',
        description: 'Kapı panelleri ve pervaz uygulamaları.',
        titleEn: 'Interior Door',
        descriptionEn: 'Door panels and casing applications.',
        titleAr: 'باب داخلي',
        descriptionAr: 'ألواح الأبواب وأعمال الحواشي.',
      }),
      item('applications', {
        title: 'Dolap & Depolama',
        imageUrl: '/images/gallery/SGL_859.webp',
        description: 'Gövde ve raflarda geniş ürün seçenekleri.',
        titleEn: 'Cabinet & Storage',
        descriptionEn: 'A wide range of products for carcasses and shelves.',
        titleAr: 'خزائن وتخزين',
        descriptionAr: 'مجموعة واسعة من المنتجات للهياكل والأرفف.',
      }),
      item('applications', {
        title: 'Banyo & Islak Alan',
        imageUrl: '/images/gallery/VT_509.webp',
        description: 'Uygun panel seçimiyle nemli alanlara yönelik çözümler.',
        titleEn: 'Bathroom & Wet Areas',
        descriptionEn: 'Solutions for damp areas with the right panel choice.',
        titleAr: 'الحمام والمناطق الرطبة',
        descriptionAr: 'حلول للمناطق الرطبة باختيار اللوح المناسب.',
      }),
      item('applications', {
        title: 'Ofis & Ticari',
        imageUrl: '/images/gallery/YT_10H.webp',
        description: 'Yoğun kullanıma uygun, sürdürülebilir malzemeler.',
        titleEn: 'Office & Commercial',
        descriptionEn: 'Sustainable materials suited to heavy use.',
        titleAr: 'مكاتب وتجاري',
        descriptionAr: 'مواد مستدامة مناسبة للاستخدام المكثف.',
      }),
      item('applications', {
        title: 'Duvar & Dekor',
        imageUrl: '/images/gallery/SGL_770.webp',
        description: 'Duvar profili ve dekoratif yüzey uygulamaları.',
        titleEn: 'Wall & Decor',
        descriptionEn: 'Wall profile and decorative surface applications.',
        titleAr: 'جدار وديكور',
        descriptionAr: 'بروفايل الجدار وتطبيقات الأسطح الزخرفية.',
      }),
    ],
  };

  const process: ContentBlock = {
    key: 'process',
    title: 'Nasıl Çalışıyoruz',
    subtitle: 'Talepten teslimata',
    body: '',
    titleEn: 'How We Work',
    subtitleEn: 'From request to delivery',
    titleAr: 'كيف نعمل',
    subtitleAr: 'من الطلب إلى التسليم',
    items: [
      item('process', {
        title: 'Talep',
        description:
          'İhtiyacınızı, ürün kodlarını ve ölçüleri telefon, WhatsApp veya form üzerinden iletin.',
        titleEn: 'Request',
        descriptionEn:
          'Send your needs, product codes and dimensions via phone, WhatsApp or the form.',
        titleAr: 'الطلب',
        descriptionAr: 'أرسل احتياجك وأكواد المنتجات والمقاسات عبر الهاتف أو واتساب أو النموذج.',
      }),
      item('process', {
        title: 'Teklif',
        description: 'Ekibimiz stok durumu ve fiyat bilgisiyle geri döner.',
        titleEn: 'Quote',
        descriptionEn: 'Our team responds with stock status and pricing.',
        titleAr: 'عرض السعر',
        descriptionAr: 'يعود فريقنا بمعلومات المخزون والسعر.',
      }),
      item('process', {
        title: 'Hazırlık',
        description: 'Ürün stoktan hazırlanır; kesim ve sevkiyat planlanır.',
        titleEn: 'Preparation',
        descriptionEn: 'Products are prepared from stock; cutting and shipping are planned.',
        titleAr: 'التجهيز',
        descriptionAr: 'تُجهّز المنتجات من المخزون؛ ويُخطّط للقص والشحن.',
      }),
      item('process', {
        title: 'Sevkiyat',
        description: 'Belirlenen adrese teslim edilir; süreç boyunca bilgilendirilirsiniz.',
        titleEn: 'Delivery',
        descriptionEn: 'Delivered to the specified address; you are kept informed throughout.',
        titleAr: 'الشحن',
        descriptionAr: 'يُسلَّم إلى العنوان المحدد؛ ويُبقيك على اطلاع طوال العملية.',
      }),
    ],
  };

  const faq: ContentBlock = {
    key: 'faq',
    title: 'Sıkça Sorulan Sorular',
    subtitle: '',
    body: '',
    titleEn: 'Frequently Asked Questions',
    titleAr: 'الأسئلة الشائعة',
    items: [
      item('faq', {
        title: 'Kalınlık seçimini nasıl yapmalıyım?',
        description:
          'Kalınlık; kullanım yerine ve taşıyacağı yüke göre belirlenir. Gövde ve raflarda daha kalın, kapak ve dekoratif yüzeylerde daha ince paneller tercih edilir. İhtiyacınıza uygun seçim için bize danışabilirsiniz.',
        titleEn: 'How should I choose the thickness?',
        descriptionEn:
          'Thickness is determined by the application and the load it will bear. Thicker boards are preferred for carcasses and shelves, thinner ones for doors and decorative surfaces. Consult us for the right choice.',
        titleAr: 'كيف أختار السماكة؟',
        descriptionAr:
          'تُحدَّد السماكة حسب الاستخدام والحمل. تُفضّل الألواح الأسمك للهياكل والأرفف، والأدقّ للأبواب والأسطح الزخرفية. استشرنا للاختيار المناسب.',
      }),
      item('faq', {
        title: 'Numune temin ediyor musunuz?',
        description:
          'Renk ve dokuyu yerinde görmeniz için numune talebinizi bize iletebilirsiniz; ekibimiz uygun seçenekleri paylaşır.',
        titleEn: 'Do you provide samples?',
        descriptionEn:
          'You can send us a sample request to see the colour and texture; our team shares suitable options.',
        titleAr: 'هل توفّرون عينات؟',
        descriptionAr:
          'يمكنك إرسال طلب عينة لرؤية اللون والملمس؛ ويشاركك فريقنا بالخيارات المناسبة.',
      }),
      item('faq', {
        title: 'Minimum sipariş adedi var mı?',
        description:
          'Sipariş koşulları ürün grubuna göre değişebilir. Talebinize özel bilgi için bizimle iletişime geçin.',
        titleEn: 'Is there a minimum order quantity?',
        descriptionEn:
          'Order terms may vary by product group. Contact us for details specific to your request.',
        titleAr: 'هل هناك حد أدنى للطلب؟',
        descriptionAr: 'قد تختلف شروط الطلب حسب مجموعة المنتج. تواصل معنا للحصول على تفاصيل طلبك.',
      }),
      item('faq', {
        title: 'Teslimat süresi ne kadar?',
        description:
          'Teslim süresi; ürünün stok durumuna, adede ve teslimat adresine göre değişir. Sipariş sırasında net süre paylaşılır.',
        titleEn: 'What is the delivery time?',
        descriptionEn:
          'Delivery time depends on stock status, quantity and destination. The exact time is shared during ordering.',
        titleAr: 'ما مدة التسليم؟',
        descriptionAr:
          'تعتمد مدة التسليم على حالة المخزون والكمية وعنوان التسليم. تُحدَّد المدة النهائية عند الطلب.',
      }),
      item('faq', {
        title: 'Hangi bölgelere sevkiyat yapıyorsunuz?',
        description:
          'Antakya merkezli olarak Hatay ve çevre bölgelere sevkiyat yapıyoruz. Farklı bölgeler için bize ulaşabilirsiniz.',
        titleEn: 'Which regions do you ship to?',
        descriptionEn:
          'Based in Antakya, we ship to Hatay and surrounding regions. Contact us for other regions.',
        titleAr: 'إلى أي مناطق تشحنون؟',
        descriptionAr:
          'من مركزنا في أنطاكيا، نشحن إلى هاتاي والمناطق المجاورة. تواصل معنا للمناطق الأخرى.',
      }),
      item('faq', {
        title: 'Ödeme seçenekleri neler?',
        description: 'Nakit, kredi kartı ve çek ile ödeme imkânı sunuyoruz.',
        titleEn: 'What are the payment options?',
        descriptionEn: 'We offer payment by cash, credit card and cheque.',
        titleAr: 'ما خيارات الدفع؟',
        descriptionAr: 'نوفّر الدفع نقدًا وببطاقة الائتمان وبالشيك.',
      }),
    ],
  };

  // Güven blokları: uydurma referans/belge yok. Admin panelden doldurulur;
  // öğe eklenene kadar ilgili bölüm sitede görünmez.
  const testimonials: ContentBlock = {
    key: 'testimonials',
    title: 'Referanslar',
    subtitle: 'Bizimle çalışanlar',
    body: '',
    titleEn: 'Testimonials',
    subtitleEn: 'Those who work with us',
    titleAr: 'آراء العملاء',
    subtitleAr: 'من يعملون معنا',
    items: [],
  };

  const certifications: ContentBlock = {
    key: 'certifications',
    title: 'Belgeler & Sertifikalar',
    subtitle: 'Kalite ve uygunluk',
    body: '',
    titleEn: 'Certificates & Documents',
    subtitleEn: 'Quality & compliance',
    titleAr: 'الشهادات والمستندات',
    subtitleAr: 'الجودة والمطابقة',
    items: [],
  };

  const facilities: ContentBlock = {
    key: 'facilities',
    title: 'Tesisimiz',
    subtitle: 'Depo ve operasyon',
    body: '',
    titleEn: 'Our Facility',
    subtitleEn: 'Warehouse & operations',
    titleAr: 'منشأتنا',
    subtitleAr: 'المستودع والعمليات',
    items: [],
  };

  return { gallery, guide, applications, process, faq, testimonials, certifications, facilities };
}

export const fallbackContent: Record<string, ContentBlock> = buildFallback();
