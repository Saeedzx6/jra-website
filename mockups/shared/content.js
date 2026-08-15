/* Editorial content shared by all three mockups, so the only variable between
   them is design. Strings are keyed for the future Arabic pass. */

const JRA_CONTENT = {
  brand: {
    name: "Jordan Restaurant Association",
    short: "JRA",
    tagline: "The voice of Jordan's restaurant sector",
    phone: "+962 6 462 1558",
    email: "info@jra.jo",
    address: "2nd Circle, Jabal Amman, Jordan",
  },

  nav: [
    { label: "About JRA", href: "#" },
    { label: "Membership", href: "#" },
    { label: "Restaurants", href: "#" },
    { label: "Suppliers", href: "#" },
    { label: "Business Center", href: "#" },
    { label: "Training", href: "#" },
    { label: "Media Center", href: "#" },
  ],

  hero: {
    eyebrow: "Established 1976",
    title: "Every table in Jordan, one association.",
    titleAlt: "Kingdom of flavour",
    lede:
      "The Jordan Restaurant Association represents the restaurants, cafés and " +
      "suppliers that feed a country and welcome the world. Find them, join them, " +
      "or work with them.",
    searchPlaceholder: "Search restaurants, cuisines, or areas…",
    searchLabel: "Search the JRA directory",
  },

  actions: [
    { label: "Find a Restaurant", note: "757 members listed", href: "#" },
    { label: "Find a Supplier", note: "Verified associate members", href: "#" },
    { label: "Join JRA", note: "Active & associate membership", href: "#" },
    { label: "Classification", note: "Standards & self-assessment", href: "#" },
    { label: "Training", note: "Courses & certification", href: "#" },
  ],

  /* The six sector destinations. `color` is a theme token name, resolved per design. */
  destinations: [
    {
      key: "directory",
      eyebrow: "Restaurant Directory",
      title: "every table, mapped.",
      body:
        "757 member restaurants across 17 governorates — searchable by cuisine, " +
        "city, area and the things that actually matter when you book.",
      cta: "Browse the directory",
      color: "c1",
      image: "https://jra.jo/content/images/thumbs/0009164_shams-el-balad.jpeg",
    },
    {
      key: "suppliers",
      eyebrow: "Suppliers Directory",
      title: "everything behind the pass.",
      body:
        "Equipment, packaging, produce, dairy, hygiene and services — associate " +
        "members vetted by the association and ready to quote.",
      cta: "Find a supplier",
      color: "c2",
      image: "https://jra.jo/content/images/thumbs/0012234_peking.jpeg",
    },
    {
      key: "classification",
      eyebrow: "Classification Hub",
      title: "the standard, in writing.",
      body:
        "Official classification criteria, inspection checklists and a self-assessment " +
        "tool that scores your establishment before the inspector arrives.",
      cta: "Start a self-assessment",
      color: "c3",
      image: "https://jra.jo/content/images/thumbs/0008112_romero-restaurant.jpeg",
    },
    {
      key: "sustainability",
      eyebrow: "Sustainability Hub",
      title: "less waste, lower bills.",
      body:
        "Energy, water and food-waste toolkits, circular-economy guidance and the " +
        "Green Key certification pathway for Jordanian restaurants.",
      cta: "Explore the toolkits",
      color: "c4",
      image: "https://jra.jo/content/images/thumbs/0018495_vintage-restaurant.jpeg",
    },
    {
      key: "legal",
      eyebrow: "Legal & Regulatory",
      title: "know the rules first.",
      body:
        "Every law, regulation and ministerial instruction affecting restaurants — " +
        "with plain-language summaries and alerts when something changes.",
      cta: "Read the legislation",
      color: "c5",
      image: "https://jra.jo/content/images/thumbs/0012206_reem-al-bawadi.jpeg",
    },
    {
      key: "marketplace",
      eyebrow: "Marketplace",
      title: "businesses change hands here.",
      body:
        "Restaurants for sale, equipment for sale or rent, investment openings and " +
        "partnership calls — posted by members, for members.",
      cta: "See what's listed",
      color: "c6",
      image: "https://jra.jo/content/images/thumbs/0002568_ararat-restaurant.jpeg",
    },
  ],

  stats: [
    { value: 757, suffix: "", label: "Member establishments" },
    { value: 42000, suffix: "+", label: "People employed" },
    { value: 17, suffix: "", label: "Governorates covered" },
    { value: 1.4, suffix: "B JOD", label: "Annual sector value", decimals: 1 },
  ],

  news: [
    {
      date: "20 April 2026",
      kicker: "Advocacy",
      title:
        "Joint dialogue session with the Ministry of Tourism and the Ministry of Industry & Trade",
      body:
        "Representatives of more than 35 tourist restaurants met at the Amman Chamber " +
        "of Industry to align on health supervision practice and service quality across the sector.",
      image: "https://jra.jo/content/images/thumbs/0018495_vintage-restaurant.jpeg",
    },
    {
      date: "2 April 2026",
      kicker: "Partnership",
      title: "JRA signs cooperation agreement with ariesai on AI solutions for members",
      body:
        "The agreement brings forecasting and operations tooling to member restaurants at preferential rates.",
      image: "https://jra.jo/content/images/thumbs/0012234_peking.jpeg",
    },
    {
      date: "18 March 2026",
      kicker: "Training",
      title: "Spring intake opens for food-safety and service certification courses",
      body:
        "Sixteen courses across Amman, Irbid and Aqaba, with subsidised places for member staff.",
      image: "https://jra.jo/content/images/thumbs/0008112_romero-restaurant.jpeg",
    },
  ],

  /* Direction C gives these their own column; A and B fold them into the
     destination tiles instead. Kept here so the copy has a single source. */
  alerts: [
    {
      tag: "Effective 1 May",
      title: "Amended food-safety instructions for tourist restaurants",
      body: "Ministry of Tourism & Antiquities — updated cold-chain logging requirements.",
    },
    {
      tag: "Consultation open",
      title: "Draft amendment to restaurant licensing fees",
      body: "Members have until 30 April to submit comments through the association.",
    },
    {
      tag: "Reminder",
      title: "Annual classification renewals close this quarter",
      body: "Establishments classified in 2023 must re-submit before 30 June.",
    },
  ],

  opportunities: [
    {
      tag: "Funding",
      title: "Energy-efficiency grants for kitchens",
      body: "Up to 40% of equipment cost covered for eligible member establishments.",
    },
    {
      tag: "Exhibition",
      title: "Jordan pavilion at Gulfood 2027",
      body: "Expressions of interest open for members exporting food products.",
    },
    {
      tag: "Programme",
      title: "Green Key certification cohort",
      body: "Twelve subsidised places for restaurants starting the certification path.",
    },
  ],

  membership: [
    {
      eyebrow: "Why join",
      title: "One network. One voice.",
      body:
        "Joining the association is one of the smartest investments you can make in " +
        "your restaurant. Advocacy with government, expert guidance, exclusive supplier " +
        "rates and a network that helps you stay compliant and grow.",
      cta: "Why join JRA",
      image: "https://jra.jo/content/images/thumbs/0009164_shams-el-balad.jpeg",
    },
    {
      eyebrow: "Member benefits",
      title: "Represented where it counts.",
      body:
        "The association sits at the table with the Ministry of Tourism, the Ministry " +
        "of Industry & Trade and Greater Amman Municipality — carrying the sector's " +
        "position on tax, licensing, inspection and labour.",
      cta: "See the benefits",
      image: "https://jra.jo/content/images/thumbs/0012206_reem-al-bawadi.jpeg",
    },
    {
      eyebrow: "How to apply",
      title: "Active or associate, in one form.",
      body:
        "Restaurants apply for active membership; suppliers and service providers " +
        "apply as associate members. Submit your documents online and track the " +
        "application to approval.",
      cta: "Start an application",
      image: "https://jra.jo/content/images/thumbs/0018495_vintage-restaurant.jpeg",
    },
  ],

  newsletter: {
    title: "Stay ahead of the sector",
    body:
      "Legislation changes, funding calls, training intakes and the monthly magazine — " +
      "sent only about what you pick.",
    interests: ["Legislation", "Training", "Opportunities", "Sustainability"],
    cta: "Subscribe",
  },

  footer: [
    {
      heading: "About JRA",
      links: ["Who we are", "Board of Directors", "Annual reports", "Governance", "Contact us"],
    },
    {
      heading: "Directories",
      links: ["Restaurants", "Suppliers", "Cuisines", "By governorate", "Advertise"],
    },
    {
      heading: "Members",
      links: ["Membership types", "Apply", "Member login", "Classification", "Marketplace"],
    },
    {
      heading: "Resources",
      links: ["Legislation", "Sustainability", "Knowledge center", "Training", "Opportunities"],
    },
    {
      heading: "Media",
      links: ["News", "Events", "Monthly magazine", "Gallery", "Press enquiries"],
    },
  ],
};
