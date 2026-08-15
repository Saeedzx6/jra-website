# JRA Platform — Architectural Blueprint & Overhaul Roadmap

**Subject:** `jra-website` (Jordan Restaurant Association) — `github.com/Saeedzx6/jra-website`
**Analysed:** 2026-08-15, against the working tree at `C:\Users\dvd\Desktop\project`
**Author role:** Principal architecture + UX direction

---

## 0. Executive summary

This is not a greenfield brief. There is a real, substantial, and in several places genuinely well-built platform here: Next.js 15 App Router, React 19, Prisma 6 against Neon Postgres, `next-intl` with full EN/AR RTL, Cloudinary-backed storage with a private-asset path, and a 15-section admin back-office over ~40 Prisma models. The design tokens were sampled from the actual JRA logo. The motion system respects `prefers-reduced-motion`. The Arabic typography is a genuinely matched multiscript pair rather than a Latin face with an Arabic fallback bolted on.

So the honest framing of this overhaul is **not "rebuild"**. It is: *the content platform is largely done; the association platform is missing.*

Three findings drive the entire roadmap:

1. **There is no membership lifecycle.** `MembershipApplication` is a one-way intake form — apply, approve, and then nothing. There is no membership record, no term, no dues, no invoice, no renewal, no lapse. For a trade association, this is the core domain object, and it does not exist. Verified: zero occurrences of `invoice|payment|dues|renewal` in `src/`.

2. **There is no notification layer at all.** No email provider in `package.json`. `submitMembershipApplication` writes a database row and returns. The applicant is never confirmed; no member of staff is ever alerted. `NewsletterSubscriber` and `LegalAlertSubscription` accumulate rows that nothing ever sends to. The "automated regulatory alert system" in the brief currently has a subscriber table and no sender.

3. **The entire site is uncached.** `export const dynamic = "force-dynamic"` sits on the *root locale layout* (`src/app/[locale]/layout.tsx:29`), so every page — including the About page and static legal documents — is a cold serverless render plus a Neon round-trip on every single request. Combined with **zero `generateMetadata` anywhere in the app**, no `sitemap.ts`, no `robots.ts` and no JSON-LD, the public directory of 701 restaurants is both slower and less discoverable than it should be. This directly contradicts the "sub-second page loads" and "SEO" goals in the brief.

Everything below is organised around closing those three gaps without discarding what already works.

---

# 1. Ecosystem & Domain Analysis

## 1.1 JRA's service pillars, mapped to what the code actually does

| Pillar | JRA's real-world mandate | In the codebase today | Verdict |
|---|---|---|---|
| **Member management** | Admit, register, renew and represent restaurant + supplier members | `MembershipApplication` (intake only), `User`, `BusinessManager`, `ChangeRequest` moderation | **Partial — intake without lifecycle** |
| **Legal & regulatory** | Publish laws/regulations, alert members to change, advise on compliance | `LegalDocument` + `LegalDocumentVersion` with supersession chain, `LegalAlertSubscription`, public `/legal` hub, admin CRUD | **Strong content, no alerting** |
| **Classification & food safety** | Score establishments against JRA's own published criteria, award star grades | `ClassificationStandard` → `Section` → `Criterion` → `StarBand`, `AssessmentSession`, `AssessmentAnswer`, scoring engine, member self-assessment, admin review | **The strongest part of the platform** |
| **Hospitality training** | Run courses for chefs, service, barista, management | `Course` → `CourseSession` → `CourseRegistration`, public `/training`, admin roster + CSV export | **Solid, but no delivery/certification** |
| **Government liaison** | Represent the sector to ministries; act as a data source | Nothing purpose-built. Data exists but no reporting or export surface | **Absent** |
| **Culinary tourism** | Drive visitors to Jordanian restaurants and food culture | 701-restaurant directory, cuisine/governorate/star facets, sustainability (Green Key) | **Present but under-powered** |

## 1.2 The structural gap: intake without a lifecycle

An association's central object is a **membership** — a business, holding a class of membership, for a term, having paid dues, in good standing or not. The schema models the *application* for one and stops:

```
MembershipApplication  →  status: PENDING | APPROVED | REJECTED | MORE_INFO
                          reviewedBy, reviewedAt, notes
                          (end of the road)
```

There is no edge from an approved application to an actual member record. `BusinessManager` links a `User` to a `Restaurant` or `Supplier`, but it carries no membership class, no term, no standing, and no dues. Consequences that follow directly from this:

- JRA cannot answer "how many members are in good standing right now?" — the admin dashboard counts *pending applications*, not members.
- Renewal is impossible to automate, because nothing knows when a term ends.
- Dues cannot be billed, because there is no invoice or period.
- Benefits cannot be gated on standing, because standing is not modelled.
- The revenue-collection analytics the brief asks for have no source data.

**This is the single highest-value thing to build, and every persona in Section 2 depends on it.**

## 1.3 Verified functional gaps

Each row below was confirmed against the working tree, not inferred.

| # | Gap | Evidence | Impact |
|---|---|---|---|
| 1 | No membership lifecycle | No `Membership`/`Invoice`/`Payment` model; zero `dues\|renewal\|invoice` matches in `src/` | Blocks billing, renewal, standing, revenue analytics |
| 2 | No email/notification layer | No mail dependency in `package.json`; `membership.ts:93` creates a row and returns | Silent applications; subscriber tables with no sender |
| 3 | `Event` model is dead | `Event` + `EventTranslation` in schema; **zero** references in `src/` — no route, no admin screen, no query | "Real-time event & festival feeds" has a table and no UI |
| 4 | No map; coordinates never populated | `Restaurant.latitude/longitude` exist, are read nowhere in `src/`, and are never written by any seed script | Blocks the map-based discovery engine outright |
| 5 | Weak search | `searchRestaurants` matches `name` + `nameAr` with `contains` only (`src/lib/restaurants.ts:57-64`) | Cannot find by dish, area, amenity or description; unindexable `ILIKE '%q%'`; no Arabic normalisation |
| 6 | Everything uncached | `dynamic = "force-dynamic"` on the **root** locale layout (`layout.tsx:29`) | Every request is a cold render + DB hit, including static pages |
| 7 | No SEO surface | **0** files use `generateMetadata`; no `sitemap.ts`, `robots.ts`, `opengraph-image`, or JSON-LD | 701 restaurant pages share one English title; no rich results; no `hreflang` |
| 8 | Auth not enforced at the edge | `middleware.ts` runs `next-intl` only; protection lives in `admin/layout.tsx:43` and `portal/layout.tsx:6` | Fail-open by default — a new route outside those layouts is public unless remembered |
| 9 | Coarse RBAC | 4 roles, one `requireRole()` helper; `EDITOR` gets all 15 admin sections **and** applicant documents (`api/documents/route.ts:16`) | A content editor can read members' trade licences and ownership papers |
| 10 | Rate limiter is per-instance | In-process `Map` (`rate-limit.ts:13`), honestly documented as such | Effective limit multiplies by serverless instance count |
| 11 | No tests | No test runner in `devDependencies`; quality gate is `typecheck` + `build` | Scoring engine and moderation flows have no regression net |
| 12 | No observability | No error tracker or analytics | Production failures are invisible; tourism metrics unmeasurable |
| 13 | Missing error/empty surfaces | No `error.tsx`, `not-found.tsx`, `loading.tsx` anywhere | Failures fall back to Next's default page — unbranded, untranslated |
| 14 | Suppliers half-built | List page only, no `[slug]` detail route; schema comment says the table ships empty | The B2B supplier side of the brief is effectively unstarted |
| 15 | Dead CTA in production | `jobs/page.tsx:18` — `href="#"` | Visible broken link on a public page |

## 1.4 Transformation opportunities, by stakeholder

**Restaurant owners** — Today the portal offers a self-assessment and a "suggest an edit" box. The opportunity is to make the portal the place where the licence renews itself: a compliance dashboard showing term, dues, classification standing and expiring documents, with renewal as a three-tap flow instead of a visit to the JRA office. *Measurable:* renewal completion rate, time-to-renew, share of renewals self-served.

**Suppliers** — Currently a directory with no records and no detail page. The opportunity is a genuine B2B channel: verified supplier profiles, category-scoped RFQ routing to members, and aggregated demand so a group of restaurants can buy at volume. *Measurable:* RFQs raised, quote response time, associate-member conversion.

**Government bodies** — No surface exists at all. JRA sits on sector data — 701 establishments, classification scores, sustainability inputs, training throughput — that ministries currently have to request by email. A read-only, permissioned statistics endpoint turns JRA from a petitioner into the sector's system of record. *Measurable:* reports served, data requests self-served, consultation cycle time.

**Tourists and consumers** — A paginated grid, three facets, and a name-only text search. The opportunity is JRA's actual unique asset: it is the **only** body in Jordan that can certify a restaurant's star classification and Green Key status. Nobody else can offer verified filters. Lead with the seal. *Measurable:* directory sessions, outbound clicks to members, saved trails.

---

# 2. Functional Specification

Every module is tagged **`EXISTS`** (shipped), **`EXTEND`** (build on what's there), or **`NEW`** (net-new).

## 2.1 Restaurant Members — B2B Portal

### M1. Membership lifecycle & renewal `NEW` ⭐ *foundation*

The missing core. New models:

```prisma
model Membership {
  id             String            @id @default(cuid())
  restaurantId   String?
  supplierId     String?
  class          MembershipClass   // ACTIVE_RESTAURANT | ASSOCIATE_SUPPLIER | HONORARY
  memberNumber   String            @unique      // human-quotable, e.g. JRA-2026-00412
  termStart      DateTime
  termEnd        DateTime
  standing       MemberStanding    @default(GOOD)  // GOOD | GRACE | LAPSED | SUSPENDED
  applicationId  String?           @unique          // the edge that is missing today
  invoices       Invoice[]
  @@index([standing, termEnd])
}
```

Flows: approval of a `MembershipApplication` *provisions* a `Membership` (closing the dead-end); a nightly job walks `termEnd` to move `GOOD → GRACE → LAPSED`; renewal is a pre-filled confirm-and-pay step, not a re-application.

### M2. Dues billing & payments `NEW`

`Invoice` (number, period, line items, VAT, status, due date) + `Payment` (method, reference, receipt). Jordan-appropriate rails: bank transfer with reference matching and manual reconciliation as the baseline, card via a local PSP as phase 2. Dues schedule keyed on membership class and classification stars, since a five-star establishment does not pay what a café pays.

### M3. Compliance tracking `EXTEND`

`AssessmentSession` already scores against real JRA criteria. Extend to a standing compliance record: document expiry (trade licence, health certificate, insurance) with a `ComplianceDocument` model carrying `expiresAt`, and a portal dashboard that reads red/amber/green off it. The self-assessment becomes one input among several, not the whole picture.

### M4. Regulatory alert system `EXTEND`

`LegalAlertSubscription` exists with topics; nothing sends. Build the sender: when a `LegalDocumentVersion` is published, fan out to subscribers matched on topic, in the recipient's `localePref`, with a digest option. Requires M-shared: the notification layer (§4.5).

### M5. Self-service licensing & renewal workflows `EXTEND`

The multi-step form pattern already exists in `membership-form.tsx` and `classification/checklist.tsx`. Generalise into one resumable wizard: server-persisted drafts (the brief's "intuitive multi-step form workflows" is undermined if a dropped connection loses the work), per-step validation, and a document locker so the same trade licence is not re-uploaded every year.

### M6. B2B supplier marketplace & bulk purchasing `EXTEND` → `NEW`

`Supplier`, `SupplierCategory` and the tree exist but ship empty, with no detail page. Build out: verified supplier profiles with a `[slug]` route; **RFQ routing** (member posts a requirement, it fans out to suppliers in matching categories, quotes return into a comparison view); and **group buying** — an `AggregatedOrder` where members opt in to a shared volume against a tiered price, closing at a deadline. This is the module that most justifies membership dues, so it should ship before the consumer polish.

### M7. Member benefits & document vault `NEW`

Gate `MagazineArticle.MEMBERS_ONLY` (the enum exists and nothing enforces it), HR manuals, and templates on `Membership.standing` — making standing legible and dues worth paying.

## 2.2 Consumers & Tourists — Public

### C1. Map-based culinary discovery `NEW` — *depends on a geocoding backfill*

Blocked until `latitude`/`longitude` are populated; they are currently null for all 701 rows. Sequence: geocode from `addressText` + `Area` + `Governorate`, admin-correctable via a pin-drop in the existing restaurant editor, then ship the map. Split-view (map + synchronised result list) on desktop, list-first with a map toggle on mobile. Cluster by governorate at low zoom. Render with **MapLibre GL** + a vector tile provider rather than Google Maps — no per-load billing surprise, and full control of the map's palette so it matches the design system in both themes.

### C2. Verified dietary & cuisine filters `EXTEND`

This is JRA's defensible advantage: filters nobody else can certify. `AmenityTag` already separates `SERVICE` from `AMENITY`; add a `VerifiedAttribute` concept with provenance — *who* verified halal, gluten-free capability, wheelchair access, and *when* — surfaced as "Verified by JRA · Mar 2026". Never let a self-declared attribute render with the same visual weight as a verified one.

### C3. Real-time event & festival feed `EXTEND` *(schema already exists, unused)*

Bring the dead `Event`/`EventTranslation` models to life: public listing and detail, calendar and map views, `.ics` export, admin CRUD reusing the news editor, and JSON-LD `Event` markup for Google's event rich results.

### C4. Reservation & inquiry routing `NEW`

Deliberately *not* a booking engine — JRA is not OpenTable, and members' existing systems must not be displaced. Instead: a routing layer. An inquiry form on each restaurant page that routes to the member's preferred channel (WhatsApp deep link, phone, email, or their own booking URL — `whatsapp`, `phone` and `website` already exist on `Restaurant`), logged so JRA can show members the referral volume the platform generates. That log is the argument for renewal.

### C5. Localised tourism guides `NEW`

Editorial trails — "Amman street food in a day", "Petra to Wadi Rum: where to eat" — as a curated collection joining restaurants, events and articles. Reuses the `Resource` + translation pattern already in the schema. This is the culinary-tourism pillar's actual product.

### C6. Restaurant profile overhaul `EXTEND`

`restaurants/[slug]/page.tsx` is the platform's most valuable public asset and its most valuable SEO surface. Add: `generateMetadata` with per-restaurant title/description/OG image, JSON-LD `Restaurant` markup, gallery lightbox, the classification seal as hero furniture, and `hreflang` alternates.

## 2.3 JRA Executive Admin — Back-Office

### A1. Real-time analytics engine `EXTEND`

Today: six `count()` calls rendered as flat tiles (`admin/page.tsx`). Build three real boards — **membership health** (active/grace/lapsed, renewal rate, churn, cohort retention), **tourism metrics** (directory sessions, searches with no results, outbound referrals per member, top cuisines and governorates), **revenue** (dues invoiced vs collected, ageing, forecast against `termEnd`). Renderer: Recharts, tabular figures, accessible palette, and a data-table fallback for every chart.

### A2. Automated dues billing & invoicing `NEW`

The admin face of M2: generate an invoice run for a term, dispatch, reconcile payments, chase arrears on a schedule, and export for accounting. Full audit trail via the existing `AuditLog`.

### A3. Role-based access control `EXTEND` — *security-relevant*

Today `EDITOR` and `ADMIN` are near-identical, and `EDITOR` can read applicants' trade licences and ownership papers (`api/documents/[...publicId]/route.ts:16`). Move to permission-based checks (`membership:review`, `documents:read_private`, `content:publish`, `finance:manage`) with roles as named bundles, enforced in **middleware** as well as in layouts so the posture is fail-closed. Add a `FINANCE` role for A2 and a read-only `GOVERNMENT_OBSERVER` for A5.

### A4. Dynamic CMS `EXTEND`

`SiteSetting` is a single-row table with three image URLs. Generalise into editable page sections with draft/publish and preview, so marketing changes stop requiring a deploy. Keep the existing `sanitize-html` discipline.

### A5. Government & sector reporting `NEW`

Scheduled sector reports (establishment counts by governorate and classification, employment, training throughput, sustainability aggregates) as PDF/XLSX — `xlsx` is already a dependency. Plus a permissioned read-only observer role. This is the government-liaison pillar, and it is currently absent entirely.

### A6. Moderation queue consolidation `EXTEND`

`ChangeRequest` is already a clean, entity-agnostic moderation engine. Give it one unified inbox across membership applications, change requests, marketplace listings and assessments, with assignment, SLA timers and bulk actions.

---

# 3. UI/UX Design System

## 3.1 Start here: what already exists and should not be rebuilt

Before proposing anything, the honest read on `src/app/globals.css` and `src/lib/fonts.ts`:

- Tokens are **sampled from the real JRA logo** (`#0050A0`), not invented. Keep.
- Dark mode is complete, with a separate shadow strategy for it and a correct comment explaining *why* dark mode cannot lean on shadow for elevation. Keep.
- Motion primitives are hand-rolled CSS with a **complete `prefers-reduced-motion` block**. Keep — and note this is why **Framer Motion is not needed** and should not be added.
- The RTL nav indicator uses physical `left` with a documented rationale about `offsetLeft`. That is the kind of detail that only exists when someone has actually debugged RTL. Keep.
- Fonts are a genuinely matched multiscript pair (IBM Plex Sans + IBM Plex Sans Arabic), with Fraunces and Manrope for display.

**A note on the generated recommendation.** The `ui-ux-pro-max` design-system pass returned *Luxury navy + gold* (`#1E3A8A` / `#A16207`) with Noto Naskh + Noto Sans Arabic. The palette is a useful independent confirmation — it lands almost exactly on the existing `--color-accent` `#0050A0` plus `--color-brass` `#B8901F`, which were derived from the real logo and therefore win. The font recommendation should be **declined**: Noto is the reflexive default for Arabic, and swapping a deliberately matched pair for it would be a regression. Where a tool's default and a considered existing choice collide, the considered choice wins.

## 3.2 Direction: *Arabic-first institutional warmth*

**The thesis.** JRA is two institutions at once — a **regulator** that grants star classifications no one else can grant, and a **host** for Jordanian food culture. Most association sites resolve that tension by going bureaucratic. The interesting move is to let the regulatory artifact *be* the beautiful thing.

**The risk I am taking, and why.** Design the Arabic composition as canonical and let English adapt to it — not the reverse. Every bilingual Jordanian platform is built English-first with Arabic bolted on, and it shows in the line-height, the cramped headline tracking, and the way numerals fight the text. The codebase already leans this way (`fonts.ts` notes the site is "Arabic-primary in real use"), and the audience is Jordanian restaurateurs. Committing to it means: Arabic sets the type scale and line-height, headline breakpoints are tested in Arabic first, and the RTL layout is the reference implementation the LTR one is checked against. It costs discipline in review. It buys a platform that feels made for its users rather than translated for them.

**Signature element: the Classification Seal.** There is already a `seal.tsx` component. Promote it to the system's central object — JRA's star grade is its unique authority, so make it the thing the platform is remembered by. It appears as an embossed mark on member cards, as the empty and loading state, in the favicon, and — the one moment of real motion — it *strikes* when a self-assessment crosses a star band in `portal/classification`. One orchestrated moment, earned by the domain. Everything else stays quiet.

## 3.3 Tokens — extend, don't replace

The real gap in `globals.css` is that **there is no semantic status layer, and no danger token at all** — while the schema carries `DRAFT/PUBLISHED/ARCHIVED`, `PENDING/APPROVED/REJECTED/MORE_INFO`, `MET/PARTIAL/NOT_MET/NOT_APPLICABLE`, and `EXPIRED`. Today `--color-olive` and `--color-brass` do double duty as brand accents *and* status colours, which is why status never reads consistently.

```css
:root {
  /* Semantic status — new layer, distinct from brand accents */
  --color-success: #1e8a5f;  --color-success-soft: #dceee3;
  --color-warning: #b8901f;  --color-warning-soft: #f3e8cc;
  --color-danger:  #b42318;  --color-danger-soft:  #fee4e2;  /* absent today */
  --color-info:    #0050a0;  --color-info-soft:    #e8f1fb;
  --color-neutral: #585d64;  --color-neutral-soft: #f2f3f5;

  /* Membership standing — reads directly off Membership.standing */
  --standing-good: var(--color-success);
  --standing-grace: var(--color-warning);
  --standing-lapsed: var(--color-danger);

  /* Glassmorphism, used only on the sticky header over hero media */
  --glass-bg: rgba(255,255,255,0.72);
  --glass-border: rgba(255,255,255,0.5);
  --glass-blur: 16px;
}
:root[data-theme="dark"] {
  --color-danger: #f97066;  --color-danger-soft: #3b1412;
  --glass-bg: rgba(16,30,43,0.72);
  --glass-border: rgba(255,255,255,0.08);
}
```

Status must never be carried by colour alone — every status pairs a token with an icon and a text label (WCAG 1.4.1).

**On glassmorphism:** the brief asks for it, and it earns its place in exactly one location — the sticky header crossing hero media. Applied to cards it costs contrast, which conflicts with the AA target. Use `backdrop-filter` with a solid `@supports not` fallback.

## 3.4 Typography

Keep the families. Fix the scale — there is no shared type scale today, only per-component Tailwind classes.

| Role | Latin | Arabic | Scale (clamp) |
|---|---|---|---|
| Display / hero | Fraunces 600 | IBM Plex Sans Arabic 700 | `clamp(2.5rem, 5vw, 4.5rem)` |
| Section head | Manrope 700 | IBM Plex Sans Arabic 700 | `clamp(1.75rem, 3vw, 2.5rem)` |
| Body | IBM Plex Sans 400 | IBM Plex Sans Arabic 400 | `1rem` / lh `1.6` (Latin), **`1.85`** (Arabic) |
| Data / figures | IBM Plex Sans 500 `tabular` | same | `0.9375rem` |

Arabic-specific rules, which follow from §3.2: line-height is **not** shared with Latin — Arabic ascenders and descenders need roughly 15% more; `letter-spacing` is always `0` in RTL (the existing CSS already does this correctly — keep it); never apply `text-transform: uppercase` in Arabic; and use `font-variant-numeric: tabular-nums` for all money, scores and dates so figures stop shifting in tables.

## 3.5 UX strategy

**Mobile-first.** The likely primary device for a Jordanian restaurateur is a phone. The member portal in particular must be fully operable at 375px — today it is a desktop-shaped grid. Bottom-anchored primary actions on member flows; ≥44×44px targets; `min-h-dvh` over `100vh`.

**Sub-second loads.** This is an architecture problem before it is a design problem — see §4.2. Design's contribution: reserve space for every async region (CLS < 0.1), skeletons over spinners past 300ms, and `next/image` with explicit dimensions everywhere.

**Zero-friction navigation.** The public nav and the 15-item admin sidebar are different problems. Public: search is the primary action on a directory — promote it into the header on every page. Admin: group 15 flat items into Content / Members / Compliance / Commerce / Settings, with the moderation inbox (A6) pinned.

**Accessibility — WCAG 2.1 AA, non-negotiable.** Current state is mixed: reduced-motion is genuinely well handled, but there are no skip links, no `error.tsx`/`not-found.tsx`, and status colour usage that would fail 1.4.1. Concretely: skip-to-content link; visible focus rings everywhere (the range-slider `:focus-visible` is a good existing model); 4.5:1 body contrast verified **independently in both themes**; `aria-live` on form errors; focus moved to the first invalid field on submit; every icon-only button labelled; and full keyboard operation of the map (C1) with a list view as the accessible equivalent.

**Multi-step forms.** Server-persisted drafts, one idea per step, a visible step indicator, free backward navigation, validation on blur rather than keystroke, and a confirm-before-dismiss when there are unsaved changes.

---

# 4. Technical Architecture & Roadmap

## 4.1 Stack: keep, add, decline

**Keep** — Next.js 15 App Router, React 19, TypeScript, Tailwind v4 (CSS-first `@theme` is already used correctly), Prisma 6 + Postgres/Neon, `next-intl`, NextAuth 5, Cloudinary, Vercel, `zod` + `react-hook-form`, Server Actions, `lucide-react`.

**Add**

| Need | Choice | Why |
|---|---|---|
| Transactional email | **Resend** + **React Email** | Unblocks §1.3 #2; templates in React, bilingual per `localePref` |
| Background jobs | **Inngest** | Renewal sweeps, invoice runs, alert fan-out. Survives serverless; no queue to operate |
| Maps | **MapLibre GL** + vector tiles | No per-load billing; full theme control for dark mode |
| Charts | **Recharts** | A1 dashboards; composable, accessible with a table fallback |
| Errors | **Sentry** | Production failures are currently invisible |
| Product analytics | **PostHog** (self-host or EU) | Source data for tourism metrics |
| Rate limiting | **Upstash Redis** | Replaces the per-instance `Map` (#10) |
| Tests | **Vitest** + **Playwright** | Scoring engine, RBAC, and the RTL layouts |
| Payments | Local PSP + bank reconciliation | Card rails in Jordan are the constraint; design for transfer-first |

**Decline** — *Framer Motion* (the CSS motion system is already good and handles reduced-motion; adding it means two motion languages). *shadcn/ui wholesale* (it would fight the existing token system; port individual Radix primitives — Dialog, Popover, Tabs — for a11y only). *Laravel* (the brief lists it as an option; a second runtime for a team already shipping Next.js Server Actions is pure cost). *A separate search service* (Postgres FTS covers 701 rows comfortably — see §4.4).

## 4.2 Rendering & caching — the highest-leverage fix

Remove `force-dynamic` from the **root layout** and apply rendering per route. The comment defending it is reasonable in intent — live counts must not freeze at build time — but the fix is targeted revalidation, not disabling caching site-wide.

| Surface | Strategy |
|---|---|
| Marketing, About, Legal, Magazine | Static + `revalidate: 3600` |
| Restaurant detail (×701) | `generateStaticParams` + ISR, `revalidateTag('restaurant:{id}')` on admin edit |
| Directory listing | Dynamic (URL-driven), with cached facet queries |
| Homepage live counts | Static shell + a `<Suspense>` dynamic island for the counters |
| Portal / Admin | Dynamic, uncached — correct as-is |

Expected: most public routes move from cold-render + DB round-trip to CDN-served. This is what makes the brief's "sub-second" target real.

Alongside it, the SEO surface (#7): `generateMetadata` on every dynamic route, `sitemap.ts` covering both locales, `robots.ts`, JSON-LD (`Restaurant`, `Event`, `Organization`), `hreflang` alternates, and a per-locale root title — the Arabic site currently carries an English title and description.

## 4.3 Data model additions

Additive only; nothing below drops or renames a column, per the CONTRIBUTING warning about live membership data.

```prisma
// Lifecycle (§2.1 M1–M2)
Membership, MembershipClass, MemberStanding, Invoice, InvoiceLine, Payment, DuesSchedule

// Compliance (M3)
ComplianceDocument { type, fileUrl, issuedAt, expiresAt, verifiedById }

// Supplier B2B (M6)
SupplierProfile, RFQ, RFQInvite, Quote, AggregatedOrder, AggregatedOrderJoin

// Discovery (C1–C2)
Restaurant += geocodedAt, geocodeSource
VerifiedAttribute { restaurantId, key, verifiedById, verifiedAt, expiresAt }

// Notifications (§4.5)
NotificationTemplate, NotificationLog { channel, status, sentAt, error }

// Permissions (A3)
Permission, RolePermission
```

Indexing: `Membership(standing, termEnd)` for the renewal sweep; `Invoice(status, dueAt)` for arrears; a GIN trigram index for search (§4.4); and `Restaurant(latitude, longitude)` for map bounds queries.

## 4.4 Search & geo

Replace the `contains` filter with Postgres full-text search plus trigram fallback — no external search service needed at this scale:

- A generated `tsvector` over name, description, cuisine, area and amenity labels, with `arabic` and `english` configurations selected per locale.
- `pg_trgm` GIN index for fuzzy matching (`fast-levenshtein` is already a dependency and was clearly used for import reconciliation — the same instinct, now at query time).
- **Arabic normalisation matters**: strip diacritics, and fold أ/إ/آ → ا and ة → ه, or Arabic search will keep missing obvious matches.
- Rank by relevance, then boost by classification stars.

Geo backfill is a prerequisite for C1: geocode from `addressText` + area + governorate, store `geocodeSource` and `geocodedAt`, expose an admin pin-drop for correction, and treat low-confidence results as unmapped rather than wrong.

## 4.5 Notification layer

One service, all channels, every send logged:

```
NotificationService
  ├─ email (Resend + React Email, bilingual by recipient localePref)
  ├─ in-app (portal + admin bell)
  └─ WhatsApp (phase 3 — the highest-signal channel for this audience)
```

Triggers: application received/approved/rejected, invoice issued, dues due in 30/7/1 days, membership lapsing, legal document published matching a subscription topic, change request decided, course registration confirmed, RFQ quote received. Every one writes a `NotificationLog` row, so "did the member get told?" is answerable.

## 4.6 Auth, RBAC & security hardening

1. **Enforce in middleware** — compose the `next-intl` middleware with an auth check so `/admin/*` and `/portal/*` are fail-closed at the edge rather than per-layout.
2. **Permission-based checks** (A3), and narrow `documents:read_private` to `ADMIN` only — an `EDITOR` should not read trade licences.
3. **Distributed rate limiting** via Upstash, replacing the per-instance `Map`.
4. **Add `FINANCE` and `GOVERNMENT_OBSERVER`** roles for A2/A5.
5. Keep the Cloudinary `authenticated` + 5-minute signed URL pattern — it is well built, and the `jra/` prefix check against path probing is a nice touch.

## 4.7 Deployment, testing, observability

Deployment stays on Vercel with git-driven promotion — and per the project's own hard-won operational notes, **never** `vercel --prod` from the working directory, and production env vars are written with `vercel env add NAME production --sensitive --force` because dashboard edits to sensitive vars silently do not save.

Testing, in priority order: **Vitest** unit tests on `classification-scoring.ts` (it awards the stars — it needs a regression net most), dues proration, and Arabic search normalisation; **integration** tests on RBAC boundaries and the application → membership provisioning flow; **Playwright** E2E on the renewal journey, admin moderation, and — critically — **both locales**, since CONTRIBUTING already warns that "layouts break there in ways that are invisible in English". Add `test` to the CI gate alongside `typecheck` and `build`.

## 4.8 Phased roadmap

**Phase 0 — Foundations (2–3 weeks).** Notification layer + Resend. Remove root `force-dynamic`, add per-route caching. Full SEO surface. `error.tsx` / `not-found.tsx` / `loading.tsx`. Middleware auth. Vitest + CI gate. Sentry. Fix the `jobs` dead link.
*Exit:* every form submission notifies someone; public routes are CDN-served; production errors are visible.

**Phase 1 — The association platform (4–6 weeks).** `Membership` + provisioning from approved applications. Dues, invoicing, renewal sweep via Inngest. Compliance dashboard + document expiry. Legal alert fan-out. Permission-based RBAC + `FINANCE`.
*Exit:* JRA can answer "who is in good standing?" and collect dues without a spreadsheet.

**Phase 2 — Discovery & tourism (4–5 weeks).** Geocoding backfill → MapLibre discovery. Postgres FTS with Arabic normalisation. Verified attributes with provenance. Events brought to life. Inquiry routing + referral logging. Tourism trails. Restaurant profile overhaul.
*Exit:* a tourist can find a verified halal five-star restaurant in Aqaba on a map, and the member can see JRA sent them.

**Phase 3 — B2B & intelligence (5–6 weeks).** Supplier profiles + detail routes. RFQ routing. Group buying. Analytics dashboards. Government reporting + observer role. Unified moderation inbox. WhatsApp notifications.
*Exit:* membership pays for itself in supplier savings; JRA reports to ministries from the platform.

**Phase 4 — Design system consolidation (ongoing, starts in Phase 0).** Semantic status tokens; type scale; Arabic-first review discipline; the classification seal as signature; component library; full AA audit in both themes and both directions.

## 4.9 Workflow integration

- **`/frontend-design`** — invoke before any new surface (map UI, dashboards, portal) to keep visual decisions deliberate rather than templated.
- **`/ui-ux-pro-max`** — `--design-system` for new page types; `--domain ux` as a pre-delivery validation pass; `--domain chart` before building A1. Treat its output as a second opinion, not an override — as in §3.1, where its font recommendation should be declined.
- **`/dataviz`** — load before writing the first line of chart code for A1.
- **`/security-review`** — run on the RBAC refactor and the payment flow specifically.
- **`/code-review`** — on every PR touching the scoring engine or membership provisioning.
- **`/init`** — this repo has **no `CLAUDE.md`**. Generate one from CONTRIBUTING.md plus the operational credential notes so conventions survive across sessions.
- **MCP** — the Browser tools for verifying RTL layouts at 375px in both themes, which is exactly the class of bug CONTRIBUTING warns is invisible in English.

---

## Appendix: the ten things to fix first

1. `dynamic = "force-dynamic"` on the root layout — uncaches the entire site
2. No email layer — applications vanish silently into a table
3. No `Membership` model — the association has no members, only applicants
4. Zero `generateMetadata` / `sitemap` / JSON-LD — 701 pages invisible to search
5. Auth enforced in layouts, not middleware — fail-open posture
6. `EDITOR` can read applicants' private legal documents
7. `latitude`/`longitude` never populated — blocks the map before it starts
8. Search matches restaurant *names* only
9. No tests on the scoring engine that awards star classifications
10. `jobs/page.tsx` — `href="#"` live in production
