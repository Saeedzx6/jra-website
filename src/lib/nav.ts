export type NavItem = {
  labelKey: string;
  href: string;
};

export const primaryNav: NavItem[] = [
  // Home is listed explicitly so the sliding indicator has something to rest
  // on at "/" — without it the homepage shows no active state at all.
  { labelKey: "nav.home", href: "/" },
  { labelKey: "nav.restaurants", href: "/restaurants" },
  { labelKey: "nav.suppliers", href: "/suppliers" },
  { labelKey: "nav.classification", href: "/classification" },
  { labelKey: "nav.about", href: "/about" },
  { labelKey: "nav.news", href: "/news" },
  { labelKey: "nav.contact", href: "/contact" },
];

export const footerSitemap: NavItem[] = [
  { labelKey: "nav.home", href: "/" },
  { labelKey: "nav.restaurants", href: "/restaurants" },
  { labelKey: "nav.suppliers", href: "/suppliers" },
  { labelKey: "nav.about", href: "/about" },
  { labelKey: "nav.membership", href: "/membership" },
  { labelKey: "nav.classification", href: "/classification" },
  { labelKey: "nav.sustainability", href: "/sustainability" },
  { labelKey: "nav.legal", href: "/legal" },
  { labelKey: "nav.marketplace", href: "/marketplace" },
  { labelKey: "nav.training", href: "/training" },
  { labelKey: "nav.jobs", href: "/jobs" },
  { labelKey: "nav.projects", href: "/projects" },
  { labelKey: "nav.opportunities", href: "/opportunities" },
  { labelKey: "nav.knowledge", href: "/knowledge" },
  { labelKey: "nav.magazine", href: "/magazine" },
  { labelKey: "nav.news", href: "/news" },
  { labelKey: "nav.contact", href: "/contact" },
];
