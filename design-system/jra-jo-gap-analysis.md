# jra.jo — gap analysis

Scanned from the live site (homepage HTML + `sitemap.xml`, 50 URLs) on 15 Aug 2026.

The live site runs stock **nopCommerce**. Its real menu is below, mapped against
what exists in `web/`. Note the WRD is a *redesign brief*, so some things we
built (Sustainability, Marketplace, Projects, Opportunities, Magazine) are
deliberate additions with no live counterpart — those are not gaps. The gaps
are live pages with no home in our build.

---

## The live menu, as it actually is

**About JRA** — `/who-we-are`, `/why-join-jra`, `/mission-vission`,
`/board-members`, `/jra-team`

**Membership Procedures** — Restaurants Classification standards (external →
mota.gov.jo), `/eco-tourism-classification-standards`, `/first-time-licensing`,
`/annual-renewing`, `/jra-submission-fees` (Membership fees)

**Business Center** — `/bylaws-and-regulations`, `/restaurant-rules-of-thumb`
(labelled "Investors window")

**HR and Training Center** — `/hr-manuals`, JRA Trainings, National
Occupational Standards (external → tvsdc.gov.jo)

**Media Center** — `/jrapublications`, `/ministry-of-tourism-antiquities-publications`,
`/annual-reports`, `/jra-newsletter`, `/News`, `/workforce-studies`

**Directories** — `/restaurants`, `/suppliers`, `/advertisements-3`

**Account** — `/register`, `/login`, `/wishlist`, `/cart`

**Other** — `/business-resources`, `/how-to-join`, `/t/Start-your-Own-Business`,
`/contactus`, external `calendar.jo`

---

## Missing from our build — worth adding

| Live page | Gap | Priority |
|---|---|---|
| `/board-members`, `/jra-team` | We have one `/about` with prose. No board or staff profiles, which the WRD also specifies (`people` table, photo/position/bio). | **High** — governance credibility |
| `/first-time-licensing`, `/annual-renewing`, `/jra-submission-fees` | The entire **Membership Procedures** branch. We have `/membership` (types + benefits) but nothing on licensing, renewal or fees — the transactional core of membership. | **High** |
| `/annual-reports` | PDF archive by year. WRD specifies an `annual_reports` table with year + language. | **High** |
| `/register` | Member self-registration. We only have `/login`. | **High** |
| `/advertisements-3` | The live classified-ads listing. Our `/marketplace` is a WRD reinvention, not a port — the existing ad inventory has no route. | Medium |
| `/hr-manuals` | HR manuals/templates for members. Partially covered by `/knowledge`. | Medium |
| `/bylaws-and-regulations` | Covered in spirit by `/legal`, but the association's own bylaws are distinct from national legislation. | Medium |
| `/workforce-studies` | Sector workforce research. `/knowledge` has a placeholder study only. | Medium |
| `/eco-tourism-classification-standards` | A second classification track alongside the standard one. Our `/classification` assumes a single scheme. | Medium |
| `/restaurant-rules-of-thumb` ("Investors window") | Guidance for prospective investors. | Low |
| `/how-to-join`, `/why-join-jra` | Conversion pages. We fold both into `/membership`. | Low — arguably better as-is |
| `/business-resources`, `/t/Start-your-Own-Business` | Resource hubs. | Low |

## Structural differences worth a decision

1. **Training is external on the live site.** Both "Training" and "Find a Job"
   point at **siyahajobs.jo**. Our `/training` is an internal page with invented
   courses. Either wire it to SiyahaJobs like `/jobs`, or confirm the
   association intends to run training on the new site.
2. **Cuisines and trades have their own URLs** on the live site
   (`/italian-2`, `/equipment`, `/packaging`…) — 40 of the 50 sitemap entries.
   We express these as filter query params instead. Ours is better UX, but those
   URLs currently rank; they need redirects into
   `/restaurants?category=…` or the SEO is lost.
3. **`/wishlist` and `/cart` are nopCommerce artefacts** — a restaurant
   directory has no cart. These should not be carried across, and they are
   evidence for replatforming rather than restyling.
4. **External authorities are linked, not duplicated**: classification standards
   → mota.gov.jo, occupational standards → tvsdc.gov.jo. Worth preserving that
   restraint rather than re-publishing government content.

---

## Security finding — needs the association's attention

The live homepage carries **hidden injected link spam**. Three anchors are
pushed off-screen with `position: absolute; left: -2551px` and point at
third-party domains:

```html
<style>.sms { position: absolute; left: -2551px; }</style>
<a href="https://sabbaghgroup.com/recieve-sms-online.html"
   title="receive sms online" class="sms">receive sms online</a>
```

Also present pointing at `ffe.es`, `wmgnet.com`, and a self-referencing
`jra.jo/recieve-sms-online.html`. Classes `.sms`, `.sms2`, `.sms3` sit in a
block commented `<!--Custom Development-->`.

Deliberately hidden outbound links are a black-hat SEO pattern. They are either
a site compromise or paid link placement by a previous vendor; either way they
carry a Google manual-action risk and should be investigated. **This is an
observation about the live site, not something in our build.**
