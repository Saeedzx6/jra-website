import type { Localized } from "./content";

/**
 * People and publications, taken from the association's own live site
 * (jra.jo/board-members, /jra-team, /annual-reports) for its redesign.
 *
 * Two deliberate omissions:
 *
 *  - **Email addresses.** The live team page obfuscates every address behind
 *    Cloudflare's email protection. That exists to stop harvesting, so
 *    decoding and republishing them here would defeat the association's own
 *    measure. Enquiries route through /contact instead.
 *  - **Arabic names.** These are real people; transliterating their names
 *    risks getting them wrong, and a proper noun does not need translating.
 *    Names render as-is inside <bdi>; only job titles are localised.
 *
 * Photographs are hotlinked from jra.jo, consistent with the rest of the
 * imagery. Self-hosting remains production work.
 */

const UPLOADS = "https://jra.jo/Content/Images/uploaded/";

/** Filenames on the live server contain spaces, so they must be encoded. */
function photo(file: string): string {
  return UPLOADS + encodeURIComponent(file);
}

export interface Person {
  name: string;
  role: Localized;
  photo: string;
}

/** Elected board. Source: jra.jo/board-members */
export const board: Person[] = [
  {
    name: "Issam Fakhriddin",
    role: { en: "President", ar: "الرئيس" },
    photo: photo("IssamFakhriddin.png"),
  },
  {
    name: "Ali Armoush",
    role: { en: "Board Member", ar: "عضو مجلس الإدارة" },
    photo: photo("AliArmoush.png"),
  },
  {
    name: "Haitham Zaid Al-Qusous",
    role: { en: "Board Member", ar: "عضو مجلس الإدارة" },
    photo: photo("HaithamZaidAl-Qusous.png"),
  },
  {
    name: "Hassan Abdullah Abu Al-Filat",
    role: { en: "Board Member", ar: "عضو مجلس الإدارة" },
    photo: photo("HassanAbdullahAbuAl-Filat.png"),
  },
  {
    name: "Waddah Daoudi",
    role: { en: "Board Member", ar: "عضو مجلس الإدارة" },
    photo: photo("WaddahDaoudi.png"),
  },
  {
    name: "Bassam Nayef Ka'oush",
    role: { en: "Board Member", ar: "عضو مجلس الإدارة" },
    photo: photo("BassamNayefKa'oush.png"),
  },
];

/** Executive staff. Source: jra.jo/jra-team */
export const team: Person[] = [
  {
    name: "Eliana Janineh",
    role: { en: "General Manager", ar: "المدير العام" },
    photo: photo("Eliana.png"),
  },
  {
    name: "Eng. Mohamad Al-Manha",
    role: { en: "Technical Manager", ar: "المدير الفني" },
    photo: photo("Eng. Mohammad.png"),
  },
  {
    name: "Niveen Qaqish",
    role: { en: "HR and Training Manager", ar: "مدير الموارد البشرية والتدريب" },
    photo: photo("Niveen.png"),
  },
  {
    name: "Muna Maabrah",
    role: {
      en: "Licensing Officer — Accounting",
      ar: "موظف الترخيص والمحاسبة",
    },
    photo: photo("Mona.png"),
  },
  {
    name: "Aya Al-Momani",
    role: {
      en: "PR and Social Media Officer",
      ar: "موظف العلاقات العامة ووسائل التواصل",
    },
    photo: photo("Aya.png"),
  },
  {
    name: "Saifaldeen Al-Rahahleh",
    role: {
      en: "Business Partnerships and Program Coordinator",
      ar: "منسق الشراكات وبرامج الأعمال",
    },
    photo: photo("Saifaldeen.png"),
  },
  {
    name: "Ghaida Farraj",
    role: { en: "Administrative Assistant", ar: "مساعد إداري" },
    photo: photo("Ghaida.png"),
  },
  {
    name: "Mahmoud Jaber",
    role: { en: "Office Assistant", ar: "مساعد مكتبي" },
    photo: photo("Mahmoud.png"),
  },
];

export interface AnnualReport {
  year: number;
  /** Bytes, measured from the live server — surfaced so nobody on mobile data
      taps a 14 MB download without warning. */
  sizeMb: number;
  url: string;
}

/** Source: jra.jo/annual-reports */
export const annualReports: AnnualReport[] = [
  { year: 2024, sizeMb: 8.5, url: `${UPLOADS}Annualreport2024.pdf` },
  { year: 2023, sizeMb: 4.3, url: `${UPLOADS}Annualreport2023.pdf` },
  { year: 2022, sizeMb: 14.4, url: `${UPLOADS}Annualreport2022.pdf` },
  { year: 2021, sizeMb: 2.1, url: `${UPLOADS}Annualreport2021.pdf` },
];
