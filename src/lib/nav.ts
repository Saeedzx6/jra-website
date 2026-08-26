export type NavItem = {
  labelKey: string;
  href: string;
};

// Seven items, matching the design system's header. Two are umbrella labels
// rather than routes of their own: "Business Center" is the marketplace and
// "Media Center" is news — grouping them keeps the bar to one line at the
// widths the tracked uppercase labels actually occupy.
//
// Home is deliberately not listed. The logo is the route home, and an eighth
// item pushed the bar to two rows.
export const primaryNav: NavItem[] = [
  { labelKey: "nav.about", href: "/about" },
  { labelKey: "nav.membership", href: "/membership" },
  { labelKey: "nav.restaurants", href: "/restaurants" },
  { labelKey: "nav.suppliers", href: "/suppliers" },
  { labelKey: "nav.businessCenter", href: "/marketplace" },
  { labelKey: "nav.training", href: "/training" },
  { labelKey: "nav.mediaCenter", href: "/news" },
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
