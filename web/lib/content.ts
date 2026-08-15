import type { Locale } from "@/i18n/routing";

/**
 * Editorial content for the sector gateway.
 *
 * Restructured from the mockups' monolingual `JRA_CONTENT` into a per-string
 * {en, ar} shape. HANDOFF flagged this: filling a dictionary was never going
 * to be enough, because the mockups rendered body copy straight out of a
 * monolingual object that no `data-i18n` key ever touched.
 *
 * Interface chrome (buttons, labels, form errors) lives in messages/*.json and
 * is reached through next-intl. This file holds editorial prose only.
 */

export interface Localized {
  en: string;
  ar: string;
}

/** Resolve a localized string, falling back to English if Arabic is missing. */
export function pick(value: Localized, locale: Locale): string {
  return value[locale] || value.en;
}

export interface Destination {
  key: string;
  eyebrow: Localized;
  title: Localized;
  body: Localized;
  cta: Localized;
  /** Tile fill token (--c1 … --c6). See design-system/MASTER.md. */
  color: string;
  href: string;
  image: string;
}

export interface Stat {
  value: number;
  suffix: string;
  decimals?: number;
  label: Localized;
}

export interface Article {
  slug: string;
  date: string;
  kicker: Localized;
  title: Localized;
  body: Localized;
  image: string;
}

export interface Notice {
  tag: Localized;
  title: Localized;
  body: Localized;
}

export interface MembershipSlide {
  eyebrow: Localized;
  title: Localized;
  body: Localized;
  cta: Localized;
  image: string;
}

const IMG = "https://jra.jo/content/images/thumbs/";

export const brand = {
  phone: "+962 6 462 1558",
  email: "info@jra.jo",
  address: {
    en: "2nd Circle, Jabal Amman, Jordan",
    ar: "الدوار الثاني، جبل عمّان، الأردن",
  },
};

export const navItems: Array<{ key: string; href: string }> = [
  { key: "about", href: "/about" },
  { key: "membership", href: "/membership" },
  { key: "restaurants", href: "/restaurants" },
  { key: "suppliers", href: "/suppliers" },
  { key: "businessCenter", href: "/marketplace" },
  { key: "training", href: "/training" },
  { key: "mediaCenter", href: "/news" },
];

export const quickActions: Array<{
  label: Localized;
  note: Localized;
  href: string;
}> = [
  {
    label: { en: "Find a Restaurant", ar: "ابحث عن مطعم" },
    note: { en: "718 members listed", ar: "718 عضواً مدرجاً" },
    href: "/restaurants",
  },
  {
    label: { en: "Find a Supplier", ar: "ابحث عن مورّد" },
    note: { en: "Verified associate members", ar: "أعضاء منتسبون موثّقون" },
    href: "/suppliers",
  },
  {
    label: { en: "Join JRA", ar: "انضم إلى الجمعية" },
    note: { en: "Active & associate membership", ar: "عضوية عاملة ومنتسبة" },
    href: "/membership",
  },
  {
    label: { en: "Classification", ar: "التصنيف" },
    note: { en: "Standards & self-assessment", ar: "المعايير والتقييم الذاتي" },
    href: "/classification",
  },
  {
    label: { en: "Training", ar: "التدريب" },
    note: { en: "Courses & certification", ar: "دورات وشهادات" },
    href: "/training",
  },
];

/**
 * The six sector destinations — the home page centrepiece.
 *
 * Titles are plain noun labels naming what each destination is. They were
 * previously six evocative fragments in a row ("every table, mapped.",
 * "less waste, lower bills.", "businesses change hands here.") — parallel in
 * length, rhythm and punctuation, which read as generated rather than written
 * and told the reader nothing the eyebrow had not already said.
 */
export const destinations: Destination[] = [
  {
    key: "directory",
    eyebrow: { en: "Restaurant Directory", ar: "دليل المطاعم" },
    title: {
      en: "Search by cuisine, area or facility",
      ar: "ابحث حسب المطبخ أو المنطقة أو المرافق",
    },
    body: {
      en: "Every member restaurant and café in the Kingdom, with the details that matter when you are choosing where to book.",
      ar: "كل مطعم ومقهى عضو في المملكة، مع التفاصيل التي تهمّك عند اختيار مكان الحجز.",
    },
    cta: { en: "Browse the directory", ar: "تصفّح الدليل" },
    color: "c1",
    href: "/restaurants",
    image: `${IMG}0009164_shams-el-balad.jpeg`,
  },
  {
    key: "suppliers",
    eyebrow: { en: "Suppliers Directory", ar: "دليل الموردين" },
    title: {
      en: "Equipment, produce and services",
      ar: "معدات ومنتجات وخدمات",
    },
    body: {
      en: "Equipment, packaging, produce, dairy, hygiene and services — associate members vetted by the association and ready to quote.",
      ar: "معدات وتغليف وخضار وألبان ومواد نظافة وخدمات — أعضاء منتسبون تم التحقق منهم من قبل الجمعية وجاهزون لتقديم عروض الأسعار.",
    },
    cta: { en: "Find a supplier", ar: "ابحث عن مورّد" },
    color: "c2",
    href: "/suppliers",
    image: `${IMG}0012234_peking.jpeg`,
  },
  {
    key: "classification",
    eyebrow: { en: "Classification Hub", ar: "مركز التصنيف" },
    title: { en: "Standards and self-assessment", ar: "المعايير والتقييم الذاتي" },
    body: {
      en: "Official classification criteria, inspection checklists and a self-assessment tool that scores your establishment before the inspector arrives.",
      ar: "معايير التصنيف الرسمية وقوائم التفتيش وأداة تقييم ذاتي تمنح منشأتك درجة قبل وصول المفتّش.",
    },
    cta: { en: "Start a self-assessment", ar: "ابدأ التقييم الذاتي" },
    color: "c3",
    href: "/classification",
    image: `${IMG}0008112_romero-restaurant.jpeg`,
  },
  {
    key: "sustainability",
    eyebrow: { en: "Sustainability Hub", ar: "مركز الاستدامة" },
    title: {
      en: "Energy, water and waste toolkits",
      ar: "أدوات الطاقة والمياه والهدر",
    },
    body: {
      en: "Energy, water and food-waste toolkits, circular-economy guidance and the Green Key certification pathway for Jordanian restaurants.",
      ar: "أدوات للطاقة والمياه وهدر الطعام، وإرشادات الاقتصاد الدائري، ومسار شهادة المفتاح الأخضر للمطاعم الأردنية.",
    },
    cta: { en: "Explore the toolkits", ar: "استكشف الأدوات" },
    color: "c4",
    href: "/sustainability",
    image: `${IMG}0018495_vintage-restaurant.jpeg`,
  },
  {
    key: "legal",
    eyebrow: { en: "Legal & Regulatory", ar: "التشريعات والأنظمة" },
    title: {
      en: "Laws, regulations and alerts",
      ar: "القوانين والأنظمة والتنبيهات",
    },
    body: {
      en: "Every law, regulation and ministerial instruction affecting restaurants — with plain-language summaries and alerts when something changes.",
      ar: "كل قانون ونظام وتعليمات وزارية تخصّ المطاعم — مع ملخصات بلغة مبسّطة وتنبيهات عند أي تعديل.",
    },
    cta: { en: "Read the legislation", ar: "اطّلع على التشريعات" },
    color: "c5",
    href: "/legal",
    image: `${IMG}0012206_reem-al-bawadi.jpeg`,
  },
  {
    key: "marketplace",
    eyebrow: { en: "Marketplace", ar: "السوق" },
    title: {
      en: "Businesses and equipment for sale",
      ar: "منشآت ومعدات للبيع",
    },
    body: {
      en: "Restaurants for sale, equipment for sale or rent, investment openings and partnership calls — posted by members, for members.",
      ar: "مطاعم للبيع، ومعدات للبيع أو الإيجار، وفرص استثمارية ودعوات شراكة — ينشرها الأعضاء للأعضاء.",
    },
    cta: { en: "See what's listed", ar: "شاهد المعروض" },
    color: "c6",
    href: "/marketplace",
    image: `${IMG}0002568_ararat-restaurant.jpeg`,
  },
];

export const stats: Stat[] = [
  {
    value: 718,
    suffix: "",
    label: { en: "Member restaurants", ar: "مطعماً عضواً" },
  },
  {
    value: 42000,
    suffix: "+",
    label: { en: "People employed", ar: "فرصة عمل" },
  },
  {
    /**
     * 12, not 17. The directory evidences members in twelve governorates; the
     * old figure counted the *vocabulary* of Jordanian governorates, which the
     * data never supported. It looked supportable only because the extractor
     * defaulted every unrecognised address to Amman.
     */
    value: 12,
    suffix: "",
    label: { en: "Governorates covered", ar: "محافظة مغطاة" },
  },
  {
    value: 1.4,
    suffix: "B JOD",
    decimals: 1,
    label: { en: "Annual sector value", ar: "القيمة السنوية للقطاع" },
  },
];

export const news: Article[] = [
  {
    slug: "ministry-dialogue-session",
    date: "2026-04-20",
    kicker: { en: "Advocacy", ar: "مناصرة" },
    title: {
      en: "Joint dialogue session with the Ministry of Tourism and the Ministry of Industry & Trade",
      ar: "جلسة حوارية مشتركة مع وزارة السياحة ووزارة الصناعة والتجارة",
    },
    body: {
      en: "Representatives of more than 35 tourist restaurants met at the Amman Chamber of Industry to align on health supervision practice and service quality across the sector.",
      ar: "التقى ممثلو أكثر من 35 مطعماً سياحياً في غرفة صناعة عمّان للتوافق على ممارسات الرقابة الصحية وجودة الخدمة في القطاع.",
    },
    image: `${IMG}0018495_vintage-restaurant.jpeg`,
  },
  {
    slug: "ariesai-cooperation-agreement",
    date: "2026-04-02",
    kicker: { en: "Partnership", ar: "شراكة" },
    title: {
      en: "JRA signs cooperation agreement with ariesai on AI solutions for members",
      ar: "الجمعية توقّع اتفاقية تعاون مع ariesai لحلول الذكاء الاصطناعي للأعضاء",
    },
    body: {
      en: "The agreement brings forecasting and operations tooling to member restaurants at preferential rates.",
      ar: "تتيح الاتفاقية أدوات التنبؤ وإدارة العمليات للمطاعم الأعضاء بأسعار تفضيلية.",
    },
    image: `${IMG}0012234_peking.jpeg`,
  },
  {
    slug: "spring-certification-intake",
    date: "2026-03-18",
    kicker: { en: "Training", ar: "تدريب" },
    title: {
      en: "Spring intake opens for food-safety and service certification courses",
      ar: "فتح باب التسجيل الربيعي لدورات سلامة الغذاء وشهادات الخدمة",
    },
    body: {
      en: "Sixteen courses across Amman, Irbid and Aqaba, with subsidised places for member staff.",
      ar: "ست عشرة دورة في عمّان وإربد والعقبة، مع مقاعد مدعومة لموظفي الأعضاء.",
    },
    image: `${IMG}0008112_romero-restaurant.jpeg`,
  },
];

export const alerts: Notice[] = [
  {
    tag: { en: "Effective 1 May", ar: "نافذ في 1 أيار" },
    title: {
      en: "Amended food-safety instructions for tourist restaurants",
      ar: "تعليمات معدّلة لسلامة الغذاء في المطاعم السياحية",
    },
    body: {
      en: "Ministry of Tourism & Antiquities — updated cold-chain logging requirements.",
      ar: "وزارة السياحة والآثار — تحديث متطلبات توثيق سلسلة التبريد.",
    },
  },
  {
    tag: { en: "Consultation open", ar: "المشاورة مفتوحة" },
    title: {
      en: "Draft amendment to restaurant licensing fees",
      ar: "مسودة تعديل رسوم ترخيص المطاعم",
    },
    body: {
      en: "Members have until 30 April to submit comments through the association.",
      ar: "أمام الأعضاء حتى 30 نيسان لتقديم ملاحظاتهم عبر الجمعية.",
    },
  },
  {
    tag: { en: "Reminder", ar: "تذكير" },
    title: {
      en: "Annual classification renewals close this quarter",
      ar: "تجديدات التصنيف السنوية تُغلق هذا الربع",
    },
    body: {
      en: "Establishments classified in 2023 must re-submit before 30 June.",
      ar: "على المنشآت المصنّفة عام 2023 إعادة التقديم قبل 30 حزيران.",
    },
  },
];

export const opportunities: Notice[] = [
  {
    tag: { en: "Funding", ar: "تمويل" },
    title: {
      en: "Energy-efficiency grants for kitchens",
      ar: "منح كفاءة الطاقة للمطابخ",
    },
    body: {
      en: "Up to 40% of equipment cost covered for eligible member establishments.",
      ar: "تغطية تصل إلى 40% من كلفة المعدات للمنشآت الأعضاء المؤهلة.",
    },
  },
  {
    tag: { en: "Exhibition", ar: "معرض" },
    title: {
      en: "Jordan pavilion at Gulfood 2027",
      ar: "الجناح الأردني في جلفود 2027",
    },
    body: {
      en: "Expressions of interest open for members exporting food products.",
      ar: "باب إبداء الاهتمام مفتوح للأعضاء المصدّرين للمنتجات الغذائية.",
    },
  },
  {
    tag: { en: "Programme", ar: "برنامج" },
    title: {
      en: "Green Key certification cohort",
      ar: "فوج شهادة المفتاح الأخضر",
    },
    body: {
      en: "Twelve subsidised places for restaurants starting the certification path.",
      ar: "اثنا عشر مقعداً مدعوماً للمطاعم التي تبدأ مسار الشهادة.",
    },
  },
];

export const membership: MembershipSlide[] = [
  {
    eyebrow: { en: "Why join", ar: "لماذا تنضم" },
    title: { en: "One network. One voice.", ar: "شبكة واحدة. صوت واحد." },
    body: {
      en: "Joining the association is one of the smartest investments you can make in your restaurant. Advocacy with government, expert guidance, exclusive supplier rates and a network that helps you stay compliant and grow.",
      ar: "الانضمام إلى الجمعية من أذكى الاستثمارات في مطعمك: مناصرة لدى الجهات الحكومية، وإرشاد متخصص، وأسعار حصرية من الموردين، وشبكة تساعدك على الالتزام والنمو.",
    },
    cta: { en: "Why join JRA", ar: "لماذا الجمعية" },
    image: `${IMG}0009164_shams-el-balad.jpeg`,
  },
  {
    eyebrow: { en: "Member benefits", ar: "مزايا العضوية" },
    title: {
      en: "Represented where it counts.",
      ar: "ممثَّلون حيث يهمّ الأمر.",
    },
    body: {
      en: "The association sits at the table with the Ministry of Tourism, the Ministry of Industry & Trade and Greater Amman Municipality — carrying the sector's position on tax, licensing, inspection and labour.",
      ar: "تجلس الجمعية إلى الطاولة مع وزارة السياحة ووزارة الصناعة والتجارة وأمانة عمّان الكبرى — حاملةً موقف القطاع في الضرائب والترخيص والتفتيش والعمالة.",
    },
    cta: { en: "See the benefits", ar: "اطّلع على المزايا" },
    image: `${IMG}0012206_reem-al-bawadi.jpeg`,
  },
  {
    eyebrow: { en: "How to apply", ar: "كيفية التقديم" },
    title: {
      en: "Active or associate, in one form.",
      ar: "عاملة أو منتسبة، بنموذج واحد.",
    },
    body: {
      en: "Restaurants apply for active membership; suppliers and service providers apply as associate members. Submit your documents online and track the application to approval.",
      ar: "تتقدم المطاعم لعضوية عاملة، ويتقدم الموردون ومزودو الخدمات لعضوية منتسبة. قدّم مستنداتك إلكترونياً وتابع الطلب حتى الموافقة.",
    },
    cta: { en: "Start an application", ar: "ابدأ الطلب" },
    image: `${IMG}0018495_vintage-restaurant.jpeg`,
  },
];

export const newsletterInterests: Localized[] = [
  { en: "Legislation", ar: "التشريعات" },
  { en: "Training", ar: "التدريب" },
  { en: "Opportunities", ar: "الفرص" },
  { en: "Sustainability", ar: "الاستدامة" },
];

export const footerColumns: Array<{
  key: string;
  links: Array<{ label: Localized; href: string }>;
}> = [
  {
    key: "about",
    links: [
      { label: { en: "Who we are", ar: "من نحن" }, href: "/about" },
      {
        label: { en: "Board of Directors", ar: "مجلس الإدارة" },
        href: "/about#board",
      },
      { label: { en: "JRA Team", ar: "فريق الجمعية" }, href: "/about#team" },
      {
        label: { en: "Annual reports", ar: "التقارير السنوية" },
        href: "/about/reports",
      },
      { label: { en: "Governance", ar: "الحوكمة" }, href: "/about#governance" },
      { label: { en: "Contact us", ar: "اتصل بنا" }, href: "/contact" },
    ],
  },
  {
    key: "directories",
    links: [
      { label: { en: "Restaurants", ar: "المطاعم" }, href: "/restaurants" },
      { label: { en: "Suppliers", ar: "الموردون" }, href: "/suppliers" },
      { label: { en: "Cuisines", ar: "المطابخ" }, href: "/restaurants" },
      {
        label: { en: "By governorate", ar: "حسب المحافظة" },
        href: "/restaurants",
      },
      { label: { en: "Advertise", ar: "أعلن معنا" }, href: "/contact" },
    ],
  },
  {
    key: "members",
    links: [
      {
        label: { en: "Membership types", ar: "أنواع العضوية" },
        href: "/membership",
      },
      { label: { en: "Apply", ar: "تقديم طلب" }, href: "/membership#apply" },
      { label: { en: "Member login", ar: "دخول الأعضاء" }, href: "/login" },
      {
        label: { en: "Classification", ar: "التصنيف" },
        href: "/classification",
      },
      { label: { en: "Marketplace", ar: "السوق" }, href: "/marketplace" },
    ],
  },
  {
    key: "resources",
    links: [
      { label: { en: "Legislation", ar: "التشريعات" }, href: "/legal" },
      { label: { en: "Sustainability", ar: "الاستدامة" }, href: "/sustainability" },
      {
        label: { en: "Knowledge center", ar: "مركز المعرفة" },
        href: "/knowledge",
      },
      { label: { en: "Training", ar: "التدريب" }, href: "/training" },
      { label: { en: "Opportunities", ar: "الفرص" }, href: "/opportunities" },
    ],
  },
  {
    key: "media",
    links: [
      { label: { en: "News", ar: "الأخبار" }, href: "/news" },
      { label: { en: "Events", ar: "الفعاليات" }, href: "/news" },
      { label: { en: "Monthly magazine", ar: "المجلة الشهرية" }, href: "/magazine" },
      { label: { en: "Gallery", ar: "معرض الصور" }, href: "/news" },
      { label: { en: "Press enquiries", ar: "استفسارات إعلامية" }, href: "/contact" },
    ],
  },
];

/**
 * Retained as the still fallback for any surface that wants a JRA-owned hero
 * photograph. The home hero itself now runs stock video — see lib/hero-media.ts.
 */
export const heroImage = `${IMG}0012206_reem-al-bawadi.jpeg`;
