/**
 * Footer sitemap, five columns.
 *
 * Labels are carried here in both languages rather than in messages/ because
 * they are navigation structure, not interface copy — the column a link sits
 * in is as much the content as its wording, and splitting the two across files
 * made adding a link a two-file edit that was routinely done half-way.
 */
export type FooterLink = { en: string; ar: string; href: string };

export const footerColumns: Array<{ key: string; links: FooterLink[] }> = [
  {
    key: "about",
    links: [
      { en: "Who we are", ar: "من نحن", href: "/about" },
      { en: "Board of Directors", ar: "مجلس الإدارة", href: "/about#board" },
      { en: "JRA Team", ar: "فريق الجمعية", href: "/about#team" },
      { en: "Governance", ar: "الحوكمة", href: "/about#governance" },
      { en: "Contact us", ar: "اتصل بنا", href: "/contact" },
    ],
  },
  {
    key: "directories",
    links: [
      { en: "Restaurants", ar: "المطاعم", href: "/restaurants" },
      { en: "Suppliers", ar: "الموردون", href: "/suppliers" },
      { en: "Cuisines", ar: "المطابخ", href: "/restaurants" },
      { en: "By governorate", ar: "حسب المحافظة", href: "/restaurants" },
      { en: "Advertise", ar: "أعلن معنا", href: "/contact" },
    ],
  },
  {
    key: "members",
    links: [
      { en: "Membership types", ar: "أنواع العضوية", href: "/membership" },
      { en: "Apply", ar: "تقديم طلب", href: "/membership" },
      { en: "Member login", ar: "دخول الأعضاء", href: "/login" },
      { en: "Classification", ar: "التصنيف", href: "/classification" },
      { en: "Marketplace", ar: "السوق", href: "/marketplace" },
    ],
  },
  {
    key: "resources",
    links: [
      { en: "Legislation", ar: "التشريعات", href: "/legal" },
      { en: "Sustainability", ar: "الاستدامة", href: "/sustainability" },
      { en: "Knowledge center", ar: "مركز المعرفة", href: "/knowledge" },
      { en: "Training", ar: "التدريب", href: "/training" },
      { en: "Opportunities", ar: "الفرص", href: "/opportunities" },
    ],
  },
  {
    key: "media",
    links: [
      { en: "News", ar: "الأخبار", href: "/news" },
      { en: "Monthly magazine", ar: "المجلة الشهرية", href: "/magazine" },
      { en: "Projects", ar: "المشاريع", href: "/projects" },
      { en: "Jobs", ar: "الوظائف", href: "/jobs" },
      { en: "Press enquiries", ar: "استفسارات إعلامية", href: "/contact" },
    ],
  },
];

export const brand = {
  phone: "+962 6 462 1558",
  email: "info@jra.jo",
  address: {
    en: "2nd Circle, Jabal Amman, Jordan",
    ar: "الدوار الثاني، جبل عمّان، الأردن",
  },
};
