import type { Localized } from "./content";

/**
 * Content for the WRD's remaining modules.
 *
 * Everything here is placeholder editorial written to the WRD's stated purpose
 * for each module — it is representative, not association-approved copy. The
 * structure (what sections exist, what each collects, how they relate) follows
 * the WRD; the words will be replaced by the content editors through the CMS.
 */

export interface ModuleIntro {
  key: string;
  title: Localized;
  lede: Localized;
}

export interface Item {
  title: Localized;
  body: Localized;
  meta?: Localized;
}

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

export const about = {
  intro: {
    title: { en: "About JRA", ar: "عن الجمعية" },
    lede: {
      en: "The Jordan Restaurant Association is the official body representing tourist restaurants, cafés and their suppliers across the Kingdom.",
      ar: "جمعية المطاعم السياحية الأردنية هي الجهة الرسمية الممثلة للمطاعم والمقاهي السياحية ومورديها في المملكة.",
    },
  },
  sections: [
    {
      title: { en: "Who we are", ar: "من نحن" },
      body: {
        en: "Established in 1976, the association brings together the establishments that make up Jordan's hospitality sector. It represents their interests before government, sets and upholds classification standards, and builds the training and supplier networks the sector depends on.",
        ar: "تأسست الجمعية عام 1976 لتجمع المنشآت التي يتكوّن منها قطاع الضيافة الأردني. تمثّل مصالحها أمام الجهات الحكومية، وتضع معايير التصنيف وتحافظ عليها، وتبني شبكات التدريب والتوريد التي يعتمد عليها القطاع.",
      },
    },
    {
      title: { en: "Mission", ar: "الرسالة" },
      body: {
        en: "To strengthen the competitiveness and sustainability of Jordan's restaurant sector, and to ensure its voice is heard wherever decisions affecting it are made.",
        ar: "تعزيز تنافسية واستدامة قطاع المطاعم في الأردن، وضمان إيصال صوته أينما تُتخذ القرارات التي تخصّه.",
      },
    },
    {
      title: { en: "Vision", ar: "الرؤية" },
      body: {
        en: "A restaurant sector recognised regionally for quality, professionalism and responsible practice.",
        ar: "قطاع مطاعم يُشهد له إقليمياً بالجودة والمهنية والممارسة المسؤولة.",
      },
    },
    {
      title: { en: "Governance", ar: "الحوكمة" },
      body: {
        en: "The association is governed by an elected board drawn from the membership, supported by an executive team and standing committees for classification, training, legislation and sustainability.",
        ar: "يدير الجمعية مجلس إدارة منتخب من الأعضاء، يسانده فريق تنفيذي ولجان دائمة للتصنيف والتدريب والتشريعات والاستدامة.",
      },
    },
  ] satisfies Array<{ title: Localized; body: Localized }>,
};

// ---------------------------------------------------------------------------
// Membership
// ---------------------------------------------------------------------------

export const membershipTypes: Array<Item & { cta: Localized }> = [
  {
    title: { en: "Active membership", ar: "العضوية العاملة" },
    meta: { en: "Restaurants & cafés", ar: "المطاعم والمقاهي" },
    body: {
      en: "For licensed tourist restaurants and cafés operating in Jordan. Carries full voting rights, classification eligibility and access to every member service.",
      ar: "للمطاعم والمقاهي السياحية المرخّصة العاملة في الأردن. تمنح حق التصويت الكامل وأهلية التصنيف والوصول إلى جميع خدمات الأعضاء.",
    },
    cta: { en: "Apply as a restaurant", ar: "تقدّم كمطعم" },
  },
  {
    title: { en: "Associate membership", ar: "العضوية المنتسبة" },
    meta: { en: "Suppliers & services", ar: "الموردون والخدمات" },
    body: {
      en: "For companies supplying goods or services to the sector — equipment, packaging, produce, hygiene, furnishings and professional services.",
      ar: "للشركات التي تزوّد القطاع بالسلع أو الخدمات — معدات وتغليف وخضار ومواد نظافة ومفروشات وخدمات مهنية.",
    },
    cta: { en: "Apply as a supplier", ar: "تقدّم كمورّد" },
  },
];

export const membershipBenefits: Item[] = [
  {
    title: { en: "Representation", ar: "التمثيل" },
    body: {
      en: "The sector's position carried to the Ministry of Tourism, the Ministry of Industry & Trade and Greater Amman Municipality.",
      ar: "إيصال موقف القطاع إلى وزارة السياحة ووزارة الصناعة والتجارة وأمانة عمّان الكبرى.",
    },
  },
  {
    title: { en: "Classification", ar: "التصنيف" },
    body: {
      en: "Access to the official criteria, the self-assessment tool and support through the inspection process.",
      ar: "الوصول إلى المعايير الرسمية وأداة التقييم الذاتي والدعم خلال عملية التفتيش.",
    },
  },
  {
    title: { en: "Supplier rates", ar: "أسعار الموردين" },
    body: {
      en: "Preferential terms negotiated with associate members on equipment, produce and services.",
      ar: "شروط تفضيلية متفاوض عليها مع الأعضاء المنتسبين على المعدات والمنتجات والخدمات.",
    },
  },
  {
    title: { en: "Training", ar: "التدريب" },
    body: {
      en: "Subsidised places on food-safety, service and management courses for member staff.",
      ar: "مقاعد مدعومة في دورات سلامة الغذاء والخدمة والإدارة لموظفي الأعضاء.",
    },
  },
];

// ---------------------------------------------------------------------------
// Classification — the self-assessment criteria
// ---------------------------------------------------------------------------

export interface CriterionGroup {
  key: string;
  title: Localized;
  criteria: Array<{ id: string; label: Localized; weight: number }>;
}

/**
 * Weighted checklist behind the self-assessment. Weights are illustrative and
 * must be replaced with the association's published scoring before this is
 * presented as an official readiness result.
 */
export const classificationGroups: CriterionGroup[] = [
  {
    key: "hygiene",
    title: { en: "Food safety & hygiene", ar: "سلامة الغذاء والنظافة" },
    criteria: [
      {
        id: "h1",
        label: {
          en: "Valid health certificates for all food handlers",
          ar: "شهادات صحية سارية لجميع متداولي الغذاء",
        },
        weight: 5,
      },
      {
        id: "h2",
        label: {
          en: "Cold-chain temperatures logged daily",
          ar: "توثيق درجات حرارة سلسلة التبريد يومياً",
        },
        weight: 5,
      },
      {
        id: "h3",
        label: {
          en: "Separate preparation areas for raw and cooked food",
          ar: "مناطق تحضير منفصلة للطعام النيء والمطبوخ",
        },
        weight: 4,
      },
      {
        id: "h4",
        label: {
          en: "Documented cleaning schedule in place",
          ar: "جدول تنظيف موثّق ومطبّق",
        },
        weight: 3,
      },
    ],
  },
  {
    key: "facility",
    title: { en: "Facility & equipment", ar: "المنشأة والمعدات" },
    criteria: [
      {
        id: "f1",
        label: {
          en: "Kitchen ventilation and extraction serviced annually",
          ar: "صيانة سنوية لتهوية المطبخ وأنظمة الشفط",
        },
        weight: 4,
      },
      {
        id: "f2",
        label: {
          en: "Accessible entrance and accessible WC",
          ar: "مدخل ودورة مياه مهيّأة لذوي الإعاقة",
        },
        weight: 4,
      },
      {
        id: "f3",
        label: {
          en: "Fire suppression system inspected and certified",
          ar: "نظام إطفاء حريق مفحوص ومعتمد",
        },
        weight: 5,
      },
    ],
  },
  {
    key: "service",
    title: { en: "Service & staff", ar: "الخدمة والموظفون" },
    criteria: [
      {
        id: "s1",
        label: {
          en: "Bilingual menu with prices displayed",
          ar: "قائمة طعام ثنائية اللغة مع عرض الأسعار",
        },
        weight: 3,
      },
      {
        id: "s2",
        label: {
          en: "Staff trained in customer service within the last 24 months",
          ar: "تدريب الموظفين على خدمة العملاء خلال آخر 24 شهراً",
        },
        weight: 3,
      },
      {
        id: "s3",
        label: {
          en: "Written complaints procedure available to guests",
          ar: "إجراء شكاوى مكتوب متاح للضيوف",
        },
        weight: 2,
      },
    ],
  },
  {
    key: "sustainability",
    title: { en: "Sustainability", ar: "الاستدامة" },
    criteria: [
      {
        id: "e1",
        label: {
          en: "Food waste separated and measured",
          ar: "فصل هدر الطعام وقياسه",
        },
        weight: 3,
      },
      {
        id: "e2",
        label: {
          en: "Energy-efficient lighting throughout",
          ar: "إنارة موفّرة للطاقة في كامل المنشأة",
        },
        weight: 2,
      },
      {
        id: "e3",
        label: {
          en: "Single-use plastics reduced or eliminated",
          ar: "تقليل أو إلغاء البلاستيك أحادي الاستخدام",
        },
        weight: 2,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Sustainability
// ---------------------------------------------------------------------------

export const sustainabilityTopics: Item[] = [
  {
    title: { en: "Energy", ar: "الطاقة" },
    body: {
      en: "Kitchen equipment, refrigeration and lighting account for most of a restaurant's electricity bill. Audit guidance, efficiency benchmarks and the grant routes open to members.",
      ar: "تستهلك معدات المطبخ والتبريد والإنارة معظم فاتورة الكهرباء. إرشادات التدقيق ومعايير الكفاءة ومسارات المنح المتاحة للأعضاء.",
    },
  },
  {
    title: { en: "Water", ar: "المياه" },
    body: {
      en: "Jordan is among the most water-scarce countries in the world. Practical reduction measures for kitchens, washrooms and cleaning routines.",
      ar: "الأردن من أكثر دول العالم شحّاً بالمياه. إجراءات عملية لخفض الاستهلاك في المطابخ ودورات المياه وروتين التنظيف.",
    },
  },
  {
    title: { en: "Food waste", ar: "هدر الطعام" },
    body: {
      en: "Measuring before reducing: portion review, stock rotation, donation routes and separation for composting.",
      ar: "القياس قبل التقليل: مراجعة الحصص، وتدوير المخزون، ومسارات التبرع، والفصل للتسميد.",
    },
  },
  {
    title: { en: "Circular economy", ar: "الاقتصاد الدائري" },
    body: {
      en: "Packaging choices, supplier take-back schemes and reuse of kitchen by-products.",
      ar: "خيارات التغليف، وبرامج استرجاع الموردين، وإعادة استخدام مخرجات المطبخ.",
    },
  },
  {
    title: { en: "Green Key", ar: "المفتاح الأخضر" },
    body: {
      en: "The international eco-label for hospitality. Criteria, the application pathway and the subsidised cohort the association runs.",
      ar: "العلامة البيئية الدولية لقطاع الضيافة. المعايير ومسار التقديم والفوج المدعوم الذي تديره الجمعية.",
    },
  },
];

// ---------------------------------------------------------------------------
// Legal & regulatory
// ---------------------------------------------------------------------------

export const legislation: Array<Item & { year: string; type: Localized }> = [
  {
    title: {
      en: "Tourism Law No. 20 of 1988 and its amendments",
      ar: "قانون السياحة رقم 20 لسنة 1988 وتعديلاته",
    },
    type: { en: "Law", ar: "قانون" },
    year: "1988",
    body: {
      en: "The primary statute governing tourism establishments, including licensing authority and classification powers.",
      ar: "التشريع الأساسي الناظم للمنشآت السياحية، بما في ذلك صلاحيات الترخيص والتصنيف.",
    },
  },
  {
    title: {
      en: "Regulation for the licensing of tourist restaurants",
      ar: "نظام ترخيص المطاعم السياحية",
    },
    type: { en: "Regulation", ar: "نظام" },
    year: "2019",
    body: {
      en: "Conditions, documentation and fees for obtaining and renewing a tourist restaurant licence.",
      ar: "الشروط والوثائق والرسوم للحصول على رخصة مطعم سياحي وتجديدها.",
    },
  },
  {
    title: {
      en: "Food safety instructions for tourism establishments",
      ar: "تعليمات سلامة الغذاء للمنشآت السياحية",
    },
    type: { en: "Instructions", ar: "تعليمات" },
    year: "2026",
    body: {
      en: "Amended cold-chain logging and food-handler certification requirements, effective 1 May.",
      ar: "متطلبات معدّلة لتوثيق سلسلة التبريد وشهادات متداولي الغذاء، نافذة في 1 أيار.",
    },
  },
  {
    title: {
      en: "Classification criteria for tourist restaurants",
      ar: "معايير تصنيف المطاعم السياحية",
    },
    type: { en: "Criteria", ar: "معايير" },
    year: "2024",
    body: {
      en: "The scoring framework applied during classification inspection, by establishment category.",
      ar: "إطار التقييم المطبّق خلال تفتيش التصنيف، حسب فئة المنشأة.",
    },
  },
];

// ---------------------------------------------------------------------------
// Marketplace
// ---------------------------------------------------------------------------

export interface Listing {
  id: string;
  category: "business" | "equipment" | "investment";
  title: Localized;
  body: Localized;
  price: Localized;
  city: string;
  posted: string;
}

export const listings: Listing[] = [
  {
    id: "l1",
    category: "business",
    title: {
      en: "Established café for sale — Jabal Amman",
      ar: "مقهى قائم للبيع — جبل عمّان",
    },
    body: {
      en: "Fully fitted 120-cover café with outdoor terrace and a transferable tourist licence. Trading for nine years.",
      ar: "مقهى مجهّز بالكامل بسعة 120 مقعداً مع تراس خارجي ورخصة سياحية قابلة للنقل. يعمل منذ تسع سنوات.",
    },
    price: { en: "185,000 JOD", ar: "185,000 دينار" },
    city: "Amman",
    posted: "2026-04-14",
  },
  {
    id: "l2",
    category: "equipment",
    title: {
      en: "Combi oven — 10 grid, two years old",
      ar: "فرن كومبي — 10 صواني، عمره سنتان",
    },
    body: {
      en: "Serviced and under warranty. Available due to kitchen reconfiguration. Delivery within Amman included.",
      ar: "مصان وتحت الضمان. متاح بسبب إعادة تنظيم المطبخ. التوصيل داخل عمّان مشمول.",
    },
    price: { en: "6,400 JOD", ar: "6,400 دينار" },
    city: "Amman",
    posted: "2026-04-09",
  },
  {
    id: "l3",
    category: "investment",
    title: {
      en: "Investment partner sought — Aqaba seafront concept",
      ar: "مطلوب شريك استثماري — مشروع على واجهة العقبة البحرية",
    },
    body: {
      en: "Seeking a partner for a 200-cover seafood restaurant with signed lease and completed designs.",
      ar: "البحث عن شريك لمطعم مأكولات بحرية بسعة 200 مقعد مع عقد إيجار موقّع وتصاميم منجزة.",
    },
    price: { en: "Negotiable", ar: "قابل للتفاوض" },
    city: "Aqaba",
    posted: "2026-03-28",
  },
  {
    id: "l4",
    category: "equipment",
    title: {
      en: "Full restaurant fit-out — closing sale",
      ar: "تجهيزات مطعم كاملة — بيع تصفية",
    },
    body: {
      en: "Tables, chairs, refrigeration, prep counters and dishwash. Available as one lot or separately.",
      ar: "طاولات وكراسي وتبريد وطاولات تحضير وغسّالة صحون. متاحة كدفعة واحدة أو منفصلة.",
    },
    price: { en: "From 400 JOD", ar: "ابتداءً من 400 دينار" },
    city: "Irbid",
    posted: "2026-03-21",
  },
];

// ---------------------------------------------------------------------------
// Training
// ---------------------------------------------------------------------------

export interface Course {
  id: string;
  title: Localized;
  body: Localized;
  duration: Localized;
  city: string;
  starts: string;
}

export const courses: Course[] = [
  {
    id: "c1",
    title: { en: "Food safety level 2", ar: "سلامة الغذاء المستوى الثاني" },
    body: {
      en: "Certification required for food handlers under the amended instructions. Delivered in Arabic with English materials.",
      ar: "شهادة مطلوبة لمتداولي الغذاء بموجب التعليمات المعدّلة. تُقدَّم بالعربية مع مواد بالإنجليزية.",
    },
    duration: { en: "2 days", ar: "يومان" },
    city: "Amman",
    starts: "2026-05-12",
  },
  {
    id: "c2",
    title: { en: "Front-of-house service standards", ar: "معايير خدمة الصالة" },
    body: {
      en: "Service sequence, guest handling and complaint recovery for waiting staff and supervisors.",
      ar: "تسلسل الخدمة والتعامل مع الضيوف ومعالجة الشكاوى لطاقم الخدمة والمشرفين.",
    },
    duration: { en: "3 days", ar: "ثلاثة أيام" },
    city: "Amman",
    starts: "2026-05-19",
  },
  {
    id: "c3",
    title: { en: "Kitchen cost control", ar: "ضبط تكاليف المطبخ" },
    body: {
      en: "Recipe costing, yield testing, stock rotation and waste measurement for kitchen managers.",
      ar: "تسعير الوصفات واختبار المردود وتدوير المخزون وقياس الهدر لمدراء المطابخ.",
    },
    duration: { en: "2 days", ar: "يومان" },
    city: "Irbid",
    starts: "2026-06-02",
  },
  {
    id: "c4",
    title: { en: "Green Key preparation", ar: "التحضير للمفتاح الأخضر" },
    body: {
      en: "Working through the certification criteria with documentation support, for establishments in the subsidised cohort.",
      ar: "العمل على معايير الشهادة مع دعم التوثيق، للمنشآت ضمن الفوج المدعوم.",
    },
    duration: { en: "4 sessions", ar: "أربع جلسات" },
    city: "Aqaba",
    starts: "2026-06-16",
  },
];

// ---------------------------------------------------------------------------
// Projects, knowledge, magazine
// ---------------------------------------------------------------------------

export const projects: Array<Item & { status: Localized; year: string }> = [
  {
    title: {
      en: "Sector employment mapping",
      ar: "مسح التشغيل في القطاع",
    },
    status: { en: "Completed", ar: "منجز" },
    year: "2025",
    body: {
      en: "A census of roles, wages and skills gaps across member establishments, used to shape the training programme.",
      ar: "حصر للوظائف والأجور وفجوات المهارات في المنشآت الأعضاء، استُخدم لتشكيل برنامج التدريب.",
    },
  },
  {
    title: {
      en: "Food waste reduction pilot",
      ar: "مشروع تجريبي لخفض هدر الطعام",
    },
    status: { en: "Ongoing", ar: "جارٍ" },
    year: "2026",
    body: {
      en: "Twenty establishments measuring and reducing kitchen waste over twelve months, with published results.",
      ar: "عشرون منشأة تقيس وتخفّض هدر المطبخ على مدى اثني عشر شهراً، مع نشر النتائج.",
    },
  },
  {
    title: {
      en: "Digital classification platform",
      ar: "منصة التصنيف الرقمية",
    },
    status: { en: "Ongoing", ar: "جارٍ" },
    year: "2026",
    body: {
      en: "Moving self-assessment and inspection records online, replacing the paper submission process.",
      ar: "نقل التقييم الذاتي وسجلات التفتيش إلى الإنترنت، بديلاً عن التقديم الورقي.",
    },
  },
];

export const knowledge: Array<Item & { kind: Localized }> = [
  {
    title: { en: "Opening a restaurant in Jordan", ar: "افتتاح مطعم في الأردن" },
    kind: { en: "Guide", ar: "دليل" },
    body: {
      en: "Licensing sequence, required approvals, expected timelines and the common causes of delay.",
      ar: "تسلسل الترخيص والموافقات المطلوبة والجداول الزمنية المتوقعة والأسباب الشائعة للتأخير.",
    },
  },
  {
    title: { en: "Employment contract templates", ar: "نماذج عقود العمل" },
    kind: { en: "Template", ar: "نموذج" },
    body: {
      en: "Bilingual contract templates for kitchen, service and management roles, compliant with the Labour Law.",
      ar: "نماذج عقود ثنائية اللغة لوظائف المطبخ والخدمة والإدارة، متوافقة مع قانون العمل.",
    },
  },
  {
    title: { en: "Sector performance review 2025", ar: "مراجعة أداء القطاع 2025" },
    kind: { en: "Study", ar: "دراسة" },
    body: {
      en: "Turnover, employment and cost trends across the membership, with regional comparison.",
      ar: "اتجاهات الإيرادات والتشغيل والتكاليف لدى الأعضاء، مع مقارنة إقليمية.",
    },
  },
  {
    title: { en: "Frequently asked questions", ar: "الأسئلة الشائعة" },
    kind: { en: "FAQ", ar: "أسئلة شائعة" },
    body: {
      en: "Membership, classification, inspection and marketplace questions answered.",
      ar: "إجابات عن أسئلة العضوية والتصنيف والتفتيش والسوق.",
    },
  },
];

export const magazineIssues: Array<{
  issue: string;
  date: string;
  title: Localized;
  body: Localized;
  membersOnly: boolean;
}> = [
  {
    issue: "42",
    date: "2026-04-01",
    title: { en: "The cost of a plate", ar: "كلفة الطبق" },
    body: {
      en: "Input costs, menu engineering and what members are doing to protect margins.",
      ar: "تكاليف المدخلات وهندسة القوائم وما يفعله الأعضاء لحماية هوامش الربح.",
    },
    membersOnly: false,
  },
  {
    issue: "41",
    date: "2026-03-01",
    title: { en: "Hiring and keeping staff", ar: "التوظيف والاحتفاظ بالموظفين" },
    body: {
      en: "Turnover across the sector, and the retention practices that measurably work.",
      ar: "دوران الموظفين في القطاع، وممارسات الاحتفاظ التي تعمل فعلياً.",
    },
    membersOnly: true,
  },
  {
    issue: "40",
    date: "2026-02-01",
    title: { en: "Ramadan operations", ar: "تشغيل رمضان" },
    body: {
      en: "Staffing, stock and service planning for the sector's busiest month.",
      ar: "التخطيط للموظفين والمخزون والخدمة في أكثر شهور القطاع ازدحاماً.",
    },
    membersOnly: false,
  },
];
