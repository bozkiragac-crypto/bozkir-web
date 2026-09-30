#!/usr/bin/env node
/**
 * İçerik (content_blocks + content_items) için TR/EN/AR tohumlama.
 * - Blok başlık/alt başlık çevirilerini doldurur (boşsa).
 * - İçerik öğelerini (items) fallback'ten yükler ve EN/AR çevirilerini ekler.
 * Idempotent: öğeler zaten varsa (aynı block + sortOrder) atlar.
 *
 * Kullanım: node scripts/seed-content-i18n.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

const ROOT = path.resolve(import.meta.dirname, '..');
for (const file of ['.env.local', '.env']) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const blockMeta = {
  gallery: { title_en: 'Material Showcase', title_ar: 'واجهة المواد', subtitle_en: 'Real surfaces, real colours', subtitle_ar: 'أسطح حقيقية وألوان حقيقية' },
  guide: { title_en: 'Material Guide', title_ar: 'دليل المواد', subtitle_en: 'Which panel for which job?', subtitle_ar: 'أي لوح لأي استخدام؟' },
  applications: { title_en: 'Application Areas', title_ar: 'مجالات التطبيق', subtitle_en: 'Where the panel becomes the work', subtitle_ar: 'حيث يتحوّل اللوح إلى عمل' },
  process: { title_en: 'How We Work', title_ar: 'كيف نعمل', subtitle_en: 'From request to delivery', subtitle_ar: 'من الطلب إلى التسليم' },
  faq: { title_en: 'Frequently Asked Questions', title_ar: 'الأسئلة الشائعة', subtitle_en: '', subtitle_ar: '' },
};

const galleryImages = ['SGL_849','SGL_859','SGL_98A','SGL_02B','SGL_Z39','SGL_Z28','SGL_770','SGL_297','VT_344','VT_408','VT_509','VT_681','VT_084','YT_10H','YT_Z28','YT_Z33','milano','dubai','odessa','lima'].map((n) => `/images/gallery/${n}.webp`);

/** items[block] = [{ title, title_en, title_ar, description, description_en, description_ar, tag, tag_en, tag_ar, imageUrl, linkUrl }] */
const items = {
  gallery: galleryImages.map((imageUrl) => ({ imageUrl })),
  guide: [
    { title: 'MDF', title_en: 'MDF', title_ar: 'MDF', tag: 'Boya & Lak', tag_en: 'Paint & Lacquer', tag_ar: 'دهان وورنيش', description: 'Homojen lif yapısı sayesinde pürüzsüz yüzey verir. Boya, lak ve freze/kabartma işlerinde tercih edilir.', description_en: 'Provides a smooth surface thanks to its homogeneous fibre structure. Preferred for painting, lacquering and milling/embossing.', description_ar: 'يمنح سطحاً أملس بفضل بنيته الليفية المتجانسة. يُفضّل في أعمال الدهان والورنيش والحفر/النقش.', linkUrl: '/kategoriler/mdf' },
    { title: 'MDF Lam', title_en: 'MDF Lam', title_ar: 'MDF لام', tag: 'Dekor', tag_en: 'Decor', tag_ar: 'ديكور', description: 'Dekor kaplı yüzeyiyle farklı renk ve desen seçenekleri sunar; hızlı üretim sağlar, ek boya gerektirmez.', description_en: 'With its decor-coated surface it offers various colour and pattern options; enables fast production without additional painting.', description_ar: 'بفضل سطحه المكسو بالديكور يوفّر خيارات متنوعة من الألوان والأنماط؛ ويتيح إنتاجاً سريعاً دون دهان إضافي.', linkUrl: '/kategoriler/mdflam' },
    { title: 'Suntalam', title_en: 'Suntalam', title_ar: 'سونتا لام', tag: 'Ekonomik', tag_en: 'Economical', tag_ar: 'اقتصادي', description: 'Yonga levha üzerine dekor kaplı panel. Gövde, raf ve kapak üretiminde ekonomik çözümdür.', description_en: 'Decor-coated panel over particleboard. An economical solution for bodies, shelves and doors.', description_ar: 'لوح مكسو بالديكور فوق ألواح الجسيمات. حل اقتصادي للهياكل والأرفف والأبواب.', linkUrl: '/kategoriler/suntalam' },
    { title: 'Sunta', title_en: 'Chipboard', title_ar: 'خشب مضغوط', tag: 'Gövde', tag_en: 'Body', tag_ar: 'هيكل', description: 'Mobilya gövdesi ve yapısal parçalarda kullanılan temel yonga levhadır; farklı kalınlıklarda tedarik edilir.', description_en: 'The basic particleboard used in furniture bodies and structural parts; supplied in various thicknesses.', description_ar: 'لوح الجسيمات الأساسي المستخدم في هياكل الأثاث والأجزاء الإنشائية؛ يُتاح بسماكات مختلفة.', linkUrl: '/kategoriler/sunta' },
    { title: 'Lak Panel', title_en: 'Lacquer Panel', title_ar: 'لوح الدهان', tag: 'Parlak Yüzey', tag_en: 'Glossy Surface', tag_ar: 'سطح لامع', description: 'Pürüzsüz ve parlak yüzeyiyle modern iç mekânlarda şık bir görünüm sağlar.', description_en: 'With its smooth and glossy surface it provides a stylish look in modern interiors.', description_ar: 'بسطحه الأملس واللامع يمنح مظهراً أنيقاً في المساحات الداخلية الحديثة.', linkUrl: '/kategoriler/lak-panel' },
    { title: 'PVC Kenar Bant', title_en: 'PVC Edge Banding', title_ar: 'شريط حواف PVC', tag: 'Tamamlayıcı', tag_en: 'Complementary', tag_ar: 'مكمّل', description: 'Panel kenarlarının tamamlayıcısıdır; dekor ve renk uyumuyla bütünlüklü bir görünüm oluşturur.', description_en: 'Complements panel edges; creates a cohesive look with matching decor and colour.', description_ar: 'يكمّل حواف الألواح؛ ويخلق مظهراً متناسقاً مع الديكور واللون المطابقين.', linkUrl: '/kategoriler/pvc-kenar-bant' },
  ],
  applications: [
    { title: 'Mutfak', title_en: 'Kitchen', title_ar: 'المطبخ', description: 'Dolap gövdesi ve kapaklarda dekor ve dayanım dengesi.', description_en: 'A balance of decor and durability in cabinet bodies and doors.', description_ar: 'توازن بين الديكور والمتانة في هياكل الخزائن وأبوابها.', imageUrl: '/images/gallery/SGL_849.webp' },
    { title: 'İç Mekân Kapı', title_en: 'Interior Door', title_ar: 'باب داخلي', description: 'Kapı panelleri ve pervaz uygulamaları.', description_en: 'Door panels and casing applications.', description_ar: 'تطبيقات ألواح الأبواب والإطارات.', imageUrl: '/images/gallery/milano.webp' },
    { title: 'Dolap & Depolama', title_en: 'Cabinet & Storage', title_ar: 'خزانة وتخزين', description: 'Gövde ve raflarda geniş ürün seçenekleri.', description_en: 'A wide range of products for bodies and shelves.', description_ar: 'تشكيلة واسعة من المنتجات للهياكل والأرفف.', imageUrl: '/images/gallery/SGL_859.webp' },
    { title: 'Banyo & Islak Alan', title_en: 'Bathroom & Wet Areas', title_ar: 'الحمام والمناطق الرطبة', description: 'Uygun panel seçimiyle nemli alanlara yönelik çözümler.', description_en: 'Solutions for humid areas with the right panel choice.', description_ar: 'حلول للمناطق الرطبة باختيار اللوح المناسب.', imageUrl: '/images/gallery/VT_509.webp' },
    { title: 'Ofis & Ticari', title_en: 'Office & Commercial', title_ar: 'المكتب والتجاري', description: 'Yoğun kullanıma uygun, sürdürülebilir malzemeler.', description_en: 'Durable materials suitable for heavy use.', description_ar: 'مواد متينة مناسبة للاستخدام المكثّف.', imageUrl: '/images/gallery/YT_10H.webp' },
    { title: 'Duvar & Dekor', title_en: 'Wall & Decor', title_ar: 'الجدار والديكور', description: 'Duvar profili ve dekoratif yüzey uygulamaları.', description_en: 'Wall profile and decorative surface applications.', description_ar: 'تطبيقات بروفايل الجدار والأسطح الديكورية.', imageUrl: '/images/gallery/SGL_770.webp' },
  ],
  process: [
    { title: 'Talep', title_en: 'Request', title_ar: 'الطلب', description: 'İhtiyacınızı, ürün kodlarını ve ölçüleri telefon, WhatsApp veya form üzerinden iletin.', description_en: 'Send your need, product codes and dimensions by phone, WhatsApp or the form.', description_ar: 'أرسل احتياجك وأكواد المنتجات والأبعاد عبر الهاتف أو واتساب أو النموذج.' },
    { title: 'Teklif', title_en: 'Quote', title_ar: 'عرض السعر', description: 'Ekibimiz stok durumu ve fiyat bilgisiyle geri döner.', description_en: 'Our team gets back to you with stock and price information.', description_ar: 'يعود إليك فريقنا بمعلومات المخزون والسعر.' },
    { title: 'Hazırlık', title_en: 'Preparation', title_ar: 'التحضير', description: 'Ürün stoktan hazırlanır; kesim ve sevkiyat planlanır.', description_en: 'The product is prepared from stock; cutting and shipping are planned.', description_ar: 'يُجهّز المنتج من المخزون؛ ويُخطّط للقص والشحن.' },
    { title: 'Sevkiyat', title_en: 'Delivery', title_ar: 'التسليم', description: 'Belirlenen adrese teslim edilir; süreç boyunca bilgilendirilirsiniz.', description_en: 'Delivered to the specified address; you are kept informed throughout.', description_ar: 'يُسلَّم إلى العنوان المحدد؛ ويتم إبقاؤك على اطلاع طوال العملية.' },
  ],
  faq: [
    { title: 'Kalınlık seçimini nasıl yapmalıyım?', title_en: 'How should I choose the thickness?', title_ar: 'كيف أختار السماكة؟', description: 'Kalınlık; kullanım yerine ve taşıyacağı yüke göre belirlenir. Gövde ve raflarda daha kalın, kapak ve dekoratif yüzeylerde daha ince paneller tercih edilir. İhtiyacınıza uygun seçim için bize danışabilirsiniz.', description_en: 'Thickness is determined by the place of use and the load it will bear. Thicker panels are preferred for bodies and shelves, thinner ones for doors and decorative surfaces. Consult us for the right choice.', description_ar: 'تُحدَّد السماكة حسب مكان الاستخدام والحمل الذي ستتحمله. تُفضّل الألواح الأسمك للهياكل والأرفف، والأرقّ للأبواب والأسطح الديكورية. استشرنا للاختيار المناسب.' },
    { title: 'Numune temin ediyor musunuz?', title_en: 'Do you provide samples?', title_ar: 'هل توفّرون عيّنات؟', description: 'Renk ve dokuyu yerinde görmeniz için numune talebinizi bize iletebilirsiniz; ekibimiz uygun seçenekleri paylaşır.', description_en: 'You can send us a sample request to see the colour and texture for yourself; our team shares suitable options.', description_ar: 'يمكنك إرسال طلب عيّنة لرؤية اللون والملمس بنفسك؛ ويشارك فريقنا الخيارات المناسبة.' },
    { title: 'Minimum sipariş adedi var mı?', title_en: 'Is there a minimum order quantity?', title_ar: 'هل هناك حد أدنى للطلب؟', description: 'Sipariş koşulları ürün grubuna göre değişebilir. Talebinize özel bilgi için bizimle iletişime geçin.', description_en: 'Order terms may vary by product group. Contact us for information specific to your request.', description_ar: 'قد تختلف شروط الطلب حسب مجموعة المنتج. تواصل معنا للحصول على معلومات خاصة بطلبك.' },
    { title: 'Teslimat süresi ne kadar?', title_en: 'How long is the delivery time?', title_ar: 'كم تستغرق مدة التسليم؟', description: 'Teslim süresi; ürünün stok durumuna, adede ve teslimat adresine göre değişir. Sipariş sırasında net süre paylaşılır.', description_en: 'Delivery time varies by stock status, quantity and delivery address. The exact time is shared when ordering.', description_ar: 'تختلف مدة التسليم حسب حالة المخزون والكمية وعنوان التسليم. تُشارك المدة الدقيقة عند الطلب.' },
    { title: 'Hangi bölgelere sevkiyat yapıyorsunuz?', title_en: 'Which regions do you ship to?', title_ar: 'إلى أي مناطق تشحنون؟', description: 'Antakya merkezli olarak Hatay ve çevre bölgelere sevkiyat yapıyoruz. Farklı bölgeler için bize ulaşabilirsiniz.', description_en: 'Based in Antakya, we ship to Hatay and surrounding regions. Contact us for other regions.', description_ar: 'انطلاقاً من أنطاكية، نشحن إلى هاتاي والمناطق المجاورة. تواصل معنا للمناطق الأخرى.' },
    { title: 'Ödeme seçenekleri neler?', title_en: 'What are the payment options?', title_ar: 'ما هي خيارات الدفع؟', description: 'Nakit, kredi kartı ve çek ile ödeme imkânı sunuyoruz.', description_en: 'We offer cash, credit card and cheque payment options.', description_ar: 'نوفّر الدفع نقداً وببطاقة الائتمان وبالشيك.' },
  ],
};

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// 1) Blok çevirileri
let blocksUpdated = 0;
for (const [key, f] of Object.entries(blockMeta)) {
  const res = await client.query(
    `UPDATE content_blocks
       SET title_en = COALESCE(NULLIF(title_en, ''), $2),
           title_ar = COALESCE(NULLIF(title_ar, ''), $3),
           subtitle_en = COALESCE(NULLIF(subtitle_en, ''), $4),
           subtitle_ar = COALESCE(NULLIF(subtitle_ar, ''), $5),
           updated_at = now()
     WHERE key = $1`,
    [key, f.title_en, f.title_ar, f.subtitle_en, f.subtitle_ar],
  );
  blocksUpdated += res.rowCount ?? 0;
}

// 2) Öğeler (yalnızca o blok için hiç öğe yoksa ekle)
let itemsInserted = 0;
for (const [blockKey, list] of Object.entries(items)) {
  const existing = await client.query('SELECT count(*)::int n FROM content_items WHERE block_key = $1', [blockKey]);
  if (existing.rows[0].n > 0) continue;
  let order = 0;
  for (const it of list) {
    await client.query(
      `INSERT INTO content_items
        (block_key, title, description, image_url, link_url, tag, sort_order, is_active,
         title_en, title_ar, description_en, description_ar, tag_en, tag_ar)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$9,$10,$11,$12,$13)`,
      [
        blockKey,
        it.title ?? null,
        it.description ?? null,
        it.imageUrl ?? null,
        it.linkUrl ?? null,
        it.tag ?? null,
        order++,
        it.title_en ?? null,
        it.title_ar ?? null,
        it.description_en ?? null,
        it.description_ar ?? null,
        it.tag_en ?? null,
        it.tag_ar ?? null,
      ],
    );
    itemsInserted++;
  }
}

await client.end();
console.log(`Blok çevirisi: ${blocksUpdated}, eklenen öğe: ${itemsInserted}.`);
