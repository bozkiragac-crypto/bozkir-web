import type { Locale } from '@/i18n/config';
import type { Product } from '@/types/product';

/**
 * Kategori bazlı ürün içeriği şablonları (runtime fallback).
 *
 * Amaç: içerik alanları boş ürünlerde PDP/kart/hızlı bakışta boş bölüm
 * göstermemek. Veri tabanına yazılmaz; admin panelden gerçek açıklama
 * girildiği anda şablon otomatik olarak ezilir.
 *
 * Uydurma teknik veri yoktur: metinler yalnızca kategoriye özgü genel
 * açıklama ve uygulama alanlarıdır. Kalınlık gibi ürün bazlı bilgiler yalnızca
 * gerçekten kayıtlıysa eklenir.
 */

interface LocalizedText {
  tr: string;
  en: string;
  ar: string;
}

interface LocalizedList {
  tr: string[];
  en: string[];
  ar: string[];
}

interface CategoryContent {
  short: LocalizedText;
  description: LocalizedText;
  applications: LocalizedList;
}

const GENERIC: CategoryContent = {
  short: {
    tr: 'Bozkır Ağaç ürünü',
    en: 'Bozkır Wood product',
    ar: 'منتج بوزكير الخشبي',
  },
  description: {
    tr: 'Uygulama ve tedarik detayları için bizimle iletişime geçebilirsiniz.',
    en: 'Contact us for application and supply details.',
    ar: 'تواصل معنا لتفاصيل الاستخدام والتوريد.',
  },
  applications: { tr: [], en: [], ar: [] },
};

const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  mdflam: {
    short: {
      tr: 'Dekor kaplı MDF panel',
      en: 'Decor-coated MDF panel',
      ar: 'لوح MDF مكسو بالديكور',
    },
    description: {
      tr: 'Melamin reçine emdirilmiş dekor kağıdıyla kaplanmış MDF panellerdir. Geniş dekor ve renk yelpazesiyle iç mekân mobilya ve panel uygulamalarında kullanılır.',
      en: 'MDF panels covered with melamine resin-impregnated decorative paper. With a wide range of decors and colours, they are used in interior furniture and panel applications.',
      ar: 'ألواح MDF مغطاة بورق ديكوري مشبع براتنج الميلامين. تتميز بتشكيلة واسعة من الديكورات والألوان وتُستخدم في الأثاث الداخلي وتطبيقات الألواح.',
    },
    applications: {
      tr: [
        'Mutfak ve banyo dolabı',
        'Gardırop ve depolama',
        'İç mekân duvar paneli',
        'Ofis mobilyası',
      ],
      en: [
        'Kitchen and bathroom cabinets',
        'Wardrobes and storage',
        'Interior wall panels',
        'Office furniture',
      ],
      ar: ['خزائن المطبخ والحمام', 'خزائن الملابس والتخزين', 'ألواح جدران داخلية', 'أثاث المكاتب'],
    },
  },
  'lak-panel': {
    short: {
      tr: 'Parlak veya mat lake yüzeyli panel',
      en: 'Gloss or matt lacquered panel',
      ar: 'لوح مدهون لامع أو مطفي',
    },
    description: {
      tr: 'Yüksek parlaklık veya mat yüzey seçenekleri sunan lake kaplı panellerdir. İç mekân mobilya ve dekoratif yüzey uygulamalarında tercih edilir.',
      en: 'Lacquered panels offering high-gloss or matt surface options. They are preferred for interior furniture and decorative surface applications.',
      ar: 'ألواح مدهونة توفر خيارات سطح لامع أو مطفي. تُفضّل في الأثاث الداخلي وتطبيقات الأسطح الديكورية.',
    },
    applications: {
      tr: ['Mutfak dolabı kapağı', 'Gardırop', 'Banyo mobilyası', 'Dekoratif duvar paneli'],
      en: ['Kitchen cabinet fronts', 'Wardrobes', 'Bathroom furniture', 'Decorative wall panels'],
      ar: ['واجهات خزائن المطبخ', 'خزائن الملابس', 'أثاث الحمام', 'ألواح جدران ديكورية'],
    },
  },
  'kapi-panel': {
    short: {
      tr: 'İç mekân kapı paneli',
      en: 'Interior door panel',
      ar: 'لوح باب داخلي',
    },
    description: {
      tr: 'İç mekân kapı üretiminde kullanılan panel ve tamamlayıcı kapı malzemeleridir. Kapı kanadı ve kaplama uygulamaları için tedarik edilir.',
      en: 'Panels and complementary door materials used in interior door production. Supplied for door leaf and cladding applications.',
      ar: 'ألواح ومواد أبواب مكمّلة تُستخدم في إنتاج الأبواب الداخلية. تُورّد لتطبيقات ضلف الأبواب والتكسية.',
    },
    applications: {
      tr: ['İç mekân kapıları', 'Kapı kanadı üretimi', 'Dolap kapağı', 'Mimari ahşap işler'],
      en: ['Interior doors', 'Door leaf production', 'Cabinet fronts', 'Architectural woodwork'],
      ar: ['الأبواب الداخلية', 'إنتاج ضلف الأبواب', 'واجهات الخزائن', 'الأعمال الخشبية المعمارية'],
    },
  },
  suntalam: {
    short: {
      tr: 'Kaplamalı yonga levha',
      en: 'Coated chipboard',
      ar: 'لوح حبيبي مكسو',
    },
    description: {
      tr: 'Yonga levha üzerine dekor kaplama uygulanmış panellerdir. Ekonomik ve geniş kullanım alanıyla mobilya üretiminde tercih edilir.',
      en: 'Panels with a decorative coating applied over chipboard. Preferred in furniture production for their economical and versatile use.',
      ar: 'ألواح عليها تكسية ديكورية فوق اللوح الحبيبي. تُفضّل في إنتاج الأثاث لاقتصاديتها وتعدد استخداماتها.',
    },
    applications: {
      tr: ['Mobilya gövdesi', 'Gardırop ve raf', 'Mutfak dolabı', 'İç mekân paneli'],
      en: ['Furniture carcasses', 'Wardrobes and shelving', 'Kitchen cabinets', 'Interior panels'],
      ar: ['هياكل الأثاث', 'خزائن الملابس والأرفف', 'خزائن المطبخ', 'ألواح داخلية'],
    },
  },
  sunta: {
    short: {
      tr: 'Yonga levha',
      en: 'Chipboard',
      ar: 'لوح حبيبي',
    },
    description: {
      tr: 'Mobilya üretiminin temel yonga levhasıdır. Farklı kalınlık ve ölçülerde, kaplama veya ham olarak tedarik edilir.',
      en: 'The base chipboard for furniture production. Supplied raw or coated in various thicknesses and dimensions.',
      ar: 'اللوح الحبيبي الأساسي لإنتاج الأثاث. يُورّد خامًا أو مكسوًا بسماكات وأبعاد مختلفة.',
    },
    applications: {
      tr: ['Mobilya gövdesi', 'Raf ve bölme', 'Kapı ve panel altlığı', 'Ambalaj'],
      en: [
        'Furniture carcasses',
        'Shelving and partitions',
        'Door and panel substrate',
        'Packaging',
      ],
      ar: ['هياكل الأثاث', 'الأرفف والفواصل', 'قاعدة الأبواب والألواح', 'التغليف'],
    },
  },
  mdf: {
    short: {
      tr: 'Ham MDF levha',
      en: 'Raw MDF board',
      ar: 'لوح MDF خام',
    },
    description: {
      tr: 'Orta yoğunluklu lif levhadır. Homojen yapısı sayesinde işleme, kaplama ve yüzey uygulamalarında yüksek kalite sunar.',
      en: 'Medium-density fibreboard. Its homogeneous structure provides high quality in machining, coating and surface applications.',
      ar: 'لوح ليفي متوسط الكثافة. بفضل بنيته المتجانسة يوفر جودة عالية في التشغيل والتكسية وتطبيقات الأسطح.',
    },
    applications: {
      tr: ['CNC işleme', 'Lake ve kaplama altlığı', 'Mobilya üretimi', 'Profil ve pervaz'],
      en: [
        'CNC machining',
        'Lacquer and veneer substrate',
        'Furniture production',
        'Profiles and trim',
      ],
      ar: ['التشغيل بالـ CNC', 'قاعدة الدهان والتكسية', 'إنتاج الأثاث', 'البروفايلات والإطارات'],
    },
  },
  'duvar-profili': {
    short: {
      tr: 'Dekoratif duvar profili',
      en: 'Decorative wall profile',
      ar: 'بروفايل جدار ديكوري',
    },
    description: {
      tr: 'İç mekân duvar uygulamalarında kullanılan dekoratif profil ve panel sistemleridir. Yüzeylere hareket ve doku kazandırır.',
      en: 'Decorative profile and panel systems used in interior wall applications. They add rhythm and texture to surfaces.',
      ar: 'أنظمة بروفايلات وألواح ديكورية تُستخدم في تطبيقات الجدران الداخلية. تضيف إيقاعًا وملمسًا للأسطح.',
    },
    applications: {
      tr: [
        'TV ünitesi duvarı',
        'Dekoratif duvar paneli',
        'Koridor ve giriş',
        'Mağaza ve ofis iç mekânı',
      ],
      en: [
        'TV wall units',
        'Decorative wall panelling',
        'Hallways and entrances',
        'Retail and office interiors',
      ],
      ar: [
        'جدران وحدات التلفاز',
        'تكسية جدران ديكورية',
        'الممرات والمداخل',
        'الديكورات الداخلية للمتاجر والمكاتب',
      ],
    },
  },
  'pvc-kenar-bant': {
    short: {
      tr: 'PVC kenar bandı',
      en: 'PVC edge banding',
      ar: 'شريط حواف PVC',
    },
    description: {
      tr: 'Panel kenarlarının tamamlayıcısı olan PVC kenar bantlarıdır. Geniş renk ve desen seçenekleriyle panel yüzeyiyle uyum sağlar.',
      en: 'PVC edge banding that complements panel edges. With a wide range of colours and patterns, it matches the panel surface.',
      ar: 'أشرطة حواف PVC تكمّل حواف الألواح. بتشكيلة واسعة من الألوان والأنماط تتناسق مع سطح اللوح.',
    },
    applications: {
      tr: ['MDF ve suntalam kenarı', 'Mutfak dolabı', 'Gardırop ve mobilya', 'Kapı kenarı'],
      en: ['MDF and chipboard edges', 'Kitchen cabinets', 'Wardrobes and furniture', 'Door edges'],
      ar: ['حواف MDF والألواح الحبيبية', 'خزائن المطبخ', 'خزائن الملابس والأثاث', 'حواف الأبواب'],
    },
  },
  'kaplamali-mdf': {
    short: {
      tr: 'Kaplamalı MDF panel',
      en: 'Veneered MDF panel',
      ar: 'لوح MDF مكسو',
    },
    description: {
      tr: 'Doğal ahşap kaplama uygulanmış MDF panellerdir. Ahşap görünümünü homojen bir taşıyıcı yüzeyle birleştirir.',
      en: 'MDF panels with a natural wood veneer. They combine the appearance of wood with a homogeneous carrier surface.',
      ar: 'ألواح MDF مكسوة بقشرة خشب طبيعية. تجمع بين مظهر الخشب وسطح حامل متجانس.',
    },
    applications: {
      tr: ['Mobilya ve dolap', 'Kapı kaplaması', 'Duvar paneli', 'Mimari iç mekân'],
      en: ['Furniture and cabinets', 'Door cladding', 'Wall panelling', 'Architectural interiors'],
      ar: ['الأثاث والخزائن', 'تكسية الأبواب', 'تكسية الجدران', 'الديكورات الداخلية المعمارية'],
    },
  },
  'masif-panel': {
    short: {
      tr: 'Masif ahşap panel',
      en: 'Solid wood panel',
      ar: 'لوح خشب صلب',
    },
    description: {
      tr: 'Masif ahşap panellerdir. Doğal doku ve işlenebilirlikleriyle mobilya, kapı ve iç mekân ahşap işlerinde kullanılır.',
      en: 'Solid wood panels. With their natural texture and workability, they are used in furniture, doors and interior woodwork.',
      ar: 'ألواح من الخشب الصلب. بفضل ملمسها الطبيعي وقابليتها للتشغيل تُستخدم في الأثاث والأبواب والأعمال الخشبية الداخلية.',
    },
    applications: {
      tr: ['Mobilya', 'Kapı ve merdiven', 'Tezgâh ve raf', 'İç mekân ahşap işleri'],
      en: ['Furniture', 'Doors and stairs', 'Worktops and shelving', 'Interior woodwork'],
      ar: ['الأثاث', 'الأبواب والسلالم', 'أسطح العمل والأرفف', 'الأعمال الخشبية الداخلية'],
    },
  },
  pervaz: {
    short: {
      tr: 'Kapı ve dolap pervazı',
      en: 'Door and cabinet trim',
      ar: 'إطار الأبواب والخزائن',
    },
    description: {
      tr: 'Kapı ve dolap çevresinde kullanılan pervaz ve tamamlayıcı profil malzemeleridir. Kenar geçişlerini tamamlar.',
      en: 'Trim and complementary profile materials used around doors and cabinets. They finish edge transitions.',
      ar: 'مواد إطار وبروفايلات مكمّلة تُستخدم حول الأبواب والخزائن. تُنهي انتقالات الحواف.',
    },
    applications: {
      tr: ['Kapı çevresi', 'Dolap kenarı', 'Geçiş profili', 'İç mekân bitişleri'],
      en: ['Door surrounds', 'Cabinet edges', 'Transition profiles', 'Interior finishes'],
      ar: ['محيط الأبواب', 'حواف الخزائن', 'بروفايلات الانتقال', 'تشطيبات داخلية'],
    },
  },
  tutkal: {
    short: {
      tr: 'Mobilya yapıştırıcısı',
      en: 'Furniture adhesive',
      ar: 'لاصق الأثاث',
    },
    description: {
      tr: 'Mobilya üretiminde kullanılan yapıştırıcı ve tutkal ürünleridir. Panel birleştirme ve kenar bantlama uygulamalarına yöneliktir.',
      en: 'Adhesive and glue products used in furniture production. Intended for panel joining and edge banding applications.',
      ar: 'منتجات لاصقة وغراء تُستخدم في إنتاج الأثاث. مخصصة لتطبيقات وصل الألواح ولصق الحواف.',
    },
    applications: {
      tr: ['Panel birleştirme', 'Kenar bantlama', 'Mobilya montajı', 'Atölye üretimi'],
      en: ['Panel joining', 'Edge banding', 'Furniture assembly', 'Workshop production'],
      ar: ['وصل الألواح', 'لصق الحواف', 'تجميع الأثاث', 'الإنتاج في الورشة'],
    },
  },
  osb: {
    short: {
      tr: 'Yönlendirilmiş yonga levha',
      en: 'Oriented strand board',
      ar: 'لوح ألياف موجهة',
    },
    description: {
      tr: 'Yönlendirilmiş yonga levha (OSB) ürünleridir. Yapısal ve dekoratif uygulamalarda taşıyıcı veya kaplama levhası olarak kullanılır.',
      en: 'Oriented strand board (OSB) products. Used as a structural or cladding board in structural and decorative applications.',
      ar: 'منتجات ألواح الألياف الموجهة (OSB). تُستخدم كلوح إنشائي أو تكسية في التطبيقات الإنشائية والديكورية.',
    },
    applications: {
      tr: ['Yapısal kaplama', 'Ambalaj ve sandık', 'Dekoratif panel', 'Kendi işini yapan projeler'],
      en: ['Structural sheathing', 'Packaging and crates', 'Decorative panels', 'DIY projects'],
      ar: ['التكسية الإنشائية', 'التغليف والصناديق', 'ألواح ديكورية', 'مشاريع الأعمال اليدوية'],
    },
  },
};

function templateFor(categorySlug: string): CategoryContent {
  return CATEGORY_CONTENT[categorySlug] ?? GENERIC;
}

/**
 * Ürün adı + kategoriyi kullanarak açıklama üretir. Yalnızca gerçek alanlar
 * kullanılır; kalınlık yalnızca kayıtlıysa eklenir.
 */
function composeDescription(product: Product, template: CategoryContent, locale: Locale): string {
  const lead: Record<Locale, string> = {
    tr: `${product.name}, ${product.category} koleksiyonunda yer alan bir üründür.`,
    en: `${product.name} is part of the ${product.category} collection.`,
    ar: `${product.name} ضمن مجموعة ${product.category}.`,
  };
  const thicknesses = product.thicknesses?.filter(Boolean) ?? [];
  const thickness: Record<Locale, string> =
    thicknesses.length > 0
      ? {
          tr: ` Mevcut kalınlık seçenekleri: ${thicknesses.join(', ')}.`,
          en: ` Available thickness options: ${thicknesses.join(', ')}.`,
          ar: ` خيارات السماكة المتاحة: ${thicknesses.join(', ')}.`,
        }
      : { tr: '', en: '', ar: '' };

  return `${lead[locale]} ${template.description[locale]}${thickness[locale]}`.trim();
}

export interface ProductContentFallback {
  shortDescription?: string;
  description?: string;
  applications?: string[];
}

/**
 * Boş içerik alanlarını kategori şablonuyla doldurur.
 * Admin'den girilmiş metinlere dokunmaz (şablon yalnızca boş alanlarda çalışır).
 */
export function buildProductContent(product: Product, locale?: Locale): ProductContentFallback {
  const loc: Locale = locale ?? 'tr';
  const template = templateFor(product.categorySlug);

  const shortDescription = product.shortDescription?.trim() || template.short[loc];
  const description = product.description?.trim() || composeDescription(product, template, loc);
  const applications =
    product.applications && product.applications.length > 0
      ? product.applications
      : template.applications[loc];

  return {
    shortDescription: shortDescription || undefined,
    description: description || undefined,
    applications: applications.length > 0 ? applications : undefined,
  };
}
