# The front-end port

How the JRA sector-gateway front end (previously a standalone Next.js app in
`JRA/web`) became the public face of this platform, and what you need to know to
work on it.

Read this before changing anything under `src/app/[locale]` that is not
`admin/` or `portal/`.

---

## 1. What happened, in one paragraph

There were two complete applications. This one had the database, auth, admin
panel and member portal but a placeholder public site. The other had a finished,
audited public design ("Direction B", see `design-system/MASTER.md` in the
front-end repo) but no backend — it read bundled JSON generated from
spreadsheets. The design was moved into this app wholesale: its pages,
components, CSS Modules and message catalogue replaced the public surfaces
here, and the JSON it reads is now generated from Prisma instead of from
spreadsheets. The admin panel and member portal were not touched, other than
inheriting the new palette.

Both projects aliased `@/*` — the front end to its root, this app to `src/` — so
its imports resolved unchanged once the files were placed under `src/`.

---

## 2. The design layer

Three files, in increasing specificity:

| File | Holds |
|---|---|
| `src/app/globals.css` | Tailwind import, design tokens, the `@theme inline` block, RTL corrections |
| `src/styles/direction-b.css` | Direction B token aliases, layout primitives, component classes |
| `src/**/*.module.css` | Per-component styles, copied over verbatim |

### 2.1 Tokens

`globals.css` holds the palette. The token **names** are the platform's
originals (`--color-accent`, `--color-ink`, …) and the **values** are the
Direction B ramp. That was deliberate: the `@theme inline` block feeds those
names to Tailwind, so retuning the values re-skinned every existing utility —
about 3,900 lines of admin and portal markup — without editing a component.

The identity is strictly two colours and their tonal derivations:

```
blue  #0053A0   the ellipse mark
grey  #6C6D70   all type, Arabic and Latin
```

**Do not add a third hue.** The only exceptions are the status colours, and
they are constrained to status:

| Token | Value | Permitted use |
|---|---|---|
| `--color-success` / `--color-olive` | `#12645A` | Opportunities, met criteria |
| `--color-warning` / `--color-brass` | `#8A5A12` | Legal alerts, pending states |
| `--color-danger` | `#B42318` | Rejected / expired / destructive only |

`--color-danger` is a third hue that `MASTER.md` does not name. It is kept
because the schema carries eight status enums whose negative half (`REJECTED`,
`NOT_MET`, `EXPIRED`, plus destructive admin actions) cannot be distinguished
from "legal alert" if both render brass.

Every foreground/background pair in both themes was measured against WCAG AA
before being committed. If you change a colour, re-measure it.

### 2.2 The compatibility layer

`src/styles/direction-b.css` exists because the ported CSS Modules reference
Direction B's vocabulary — `--accent`, `--ink`, `--navy`, `--r-pill`,
`--dur-mid` — hundreds of times. Rather than rewrite 21 stylesheets, those names
are declared once as aliases. Two rules govern which side an alias takes:

- Tokens that must follow the theme (surfaces, body type, rules, accent) alias
  the `--color-*` token, so dark mode keeps working.
- Tokens that are fixed brand artwork (the navy hero ground, the six tile
  fills) are literal values, because they carry their own white copy and must
  not invert.

**Add colours in `globals.css` and alias them here.** Never the other way round.

### 2.3 Typography and the Arabic corrections

Poppins (display, italic 700), DM Sans (body), Cairo (all Arabic), wired in
`src/lib/fonts.ts`. The token names there are the platform's originals for the
same reason as the colours — 98 `font-display` call sites keep working.

The RTL rules in `globals.css` are **not stylistic preferences**. Each repairs a
way the Latin styling damages Arabic:

1. **No italic.** Arabic has no italic tradition; a slanted Arabic word reads as
   a rendering fault, not emphasis.
2. **Zero letter-spacing.** Arabic is cursive — letters join. Positive tracking
   pulls the joins apart and renders the word as disconnected glyphs. Tracking
   is zeroed, not reduced.
3. **No uppercase.** Arabic is unicameral, so the declaration is a no-op on
   Arabic glyphs but still uppercases Latin words mixed into the same run.

These are applied to the Tailwind *utilities* (`.tracking-wide`, `.uppercase`)
rather than to the ~60 call sites, so markup added later cannot miss them.

---

## 3. The data bridge

**This is the part most likely to surprise you.**

The directory filters client-side over the whole dataset. Typing in the search
console re-filters instantly with no round trip, and the governorate / cuisine /
feature chips are pure client state. That interaction is the design. Moving it
to server-driven `searchParams` would put a request between every keystroke.

So the data is bundled, not queried:

```
Postgres ──> scripts/generate-directory-data.ts ──> src/data/*.json ──> src/lib/directory.ts ──> pages
```

`src/lib/directory.ts` and every component reading it are **unchanged from the
original front end**. Only the origin of the JSON changed: it used to come from
`extract-data.py` reading the nopCommerce spreadsheets, and now comes from
Prisma. The shape is identical, which is what made that possible.

### 3.1 Regenerating

```bash
npm run data:directory
```

It also runs automatically as part of `npm run build`.

**Consequence: edits made in the admin panel do not reach the public directory
until this runs again.** That is the cost of keeping client-side filtering. If
you need near-live updates, add a revalidation hook that triggers regeneration —
do not rewrite the directory to query per request, or you will lose the
interaction the design is built around.

### 3.2 Shape contract

`src/lib/directory.test.ts` asserts the generated shape: required fields,
unique slugs, that addresses contain no pipe delimiters, that the blurb is never
just the address, that vocab totals match, and that every curated `featured`
slug resolves. If you change the generator, those tests are what tell you
whether the front end will still render.

### 3.3 Two data quirks the generator handles

- **`shortDescription` is the address.** The legacy import writes the
  spreadsheet's `ShortDescription` column into *both* `shortDescription` and
  `addressText`, because in that export the column holds the street address, not
  prose. Blurbs therefore come from `fullDescriptionHtml`. Reading
  `shortDescription` produces cards whose body copy is their own address.
- **Pipes, not commas.** The address column delimits parts with `|`; the
  generator renders them comma-separated.

---

## 4. Seeds added for the port

Run in this order after `prisma migrate deploy`. All need `dotenv` (see §6.2).

| Script | What it does |
|---|---|
| `prisma/seed/01-lookups.ts` | Governorates, cuisines, amenity tags, supplier categories |
| `prisma/seed/02-restaurants.ts` | 701 restaurant rows |
| `prisma/seed/14-suppliers.ts` | **New.** 56 supplier rows + category links |
| `prisma/seed/15-images-from-legacy-urls.ts` | **New.** Image URLs for both |
| `prisma/seed/05-classification.ts` | Classification standards |
| `prisma/seed/06-admin-user.ts` | Local admin + demo member |

### 4.1 `14-suppliers.ts`

`02-restaurants.ts` deliberately skips the supplier rows, and the blueprint
records the supplier table as shipping empty pending the B2B module (M6,
Phase 3). But the ported design has a supplier directory *and* a `[slug]`
detail route, so the records were needed. This seeds directory records only —
when M6 lands it extends these rows rather than replacing them.

Three categories (`Amusement Parks and Recreation`, `Training`, `Patrons`) sit
outside the Suppliers root in `categories.xlsx` and legitimately have no match.

### 4.2 `15-images-from-legacy-urls.ts`

`03-images.ts` maps image files out of the `JRA` / `JRA-moreassets` reference
folders, which are hundreds of megabytes and not in the repo — without them
every listing renders imageless. The front end's dataset already carried live
`jra.jo` URLs for the same pictures, and `next.config.ts` whitelists that host,
so those URLs are seeded directly. 532 restaurants and all 39 suppliers.

Point `LEGACY_DIRECTORY_JSON_DIR` at the folder holding the original
`restaurants.json` / `suppliers.json` if it is not the sibling checkout.

---

## 5. What is connected, and what is not

### Connected

| Surface | Wired to |
|---|---|
| Login | `loginAction` → NextAuth credentials. Routes ADMIN/EDITOR to `/admin`, members to `/portal` |
| Contact form | `submitContactInquiry` → `ContactInquiry` rows in the admin inbox |
| Newsletter form | `subscribeToNewsletter` → `NewsletterSubscriber`, **including interests** |
| Restaurant + supplier directories | The generated snapshot |
| Admin panel, member portal | Untouched; inherited the palette |

The contact form has no subject field — the design asks for three things, not
four — so it submits a constant `"Website enquiry"` to satisfy the server
schema.

### Not connected

Five routes still carry the platform's original Tailwind design, because the
ported front end has no counterpart for them:

- `classification/[type]`
- `legal/[slug]`
- `magazine/[id]`
- `marketplace/[id]`
- `newsletter`

They work; they just look like the old design. Decide what they should be
rather than leaving them indefinitely.

Editorial content on the ported pages (`src/lib/content.ts`,
`src/lib/modules.ts`) is still **hard-coded prose**, not database-driven. News,
magazine and training pages render that copy rather than `NewsArticle`,
`MagazineIssue` or `Course` rows. Wiring those up is the natural next step.

Arabic names for cuisines and amenity tags are `null` in the database — the
source spreadsheet is English-only — so Arabic pages show English category
labels. The original front end had the same limitation.

---

## 6. Local setup

Beyond `CONTRIBUTING.md`, these are the things that actually bite.

### 6.1 Use `127.0.0.1`, not `localhost`

Docker binds port 5433 on both IPv4 and IPv6. On Windows `localhost` resolves
to `::1` first and Prisma can fail to connect. `.env` should read:

```
DATABASE_URL="postgresql://jra:jra_dev_password@127.0.0.1:5433/jra?schema=public"
DIRECT_URL="postgresql://jra:jra_dev_password@127.0.0.1:5433/jra?schema=public"
```

### 6.2 Seed scripts do not load `.env`

They run under `tsx`, which — unlike the Prisma CLI — does not read `.env`
automatically. Every seed needs `dotenv`:

```bash
npx dotenv -e .env -- tsx prisma/seed/01-lookups.ts
```

`npm run seed:suppliers`, `seed:legacy-images` and `data:directory` already wrap
this.

### 6.3 Stop the dev server before building

`prisma generate` renames `query_engine-windows.dll.node`, which fails with
`EPERM` while a dev server holds it open. The build then reports success
having never run `next build`.

### 6.4 A stale `.next` can serve a broken page forever

If the database was unreachable when a statically-revalidated route was first
rendered, the cached shell can keep serving its loading fallback with the real
markup stranded in a hidden div. `rm -rf .next` and restart.

---

## 7. Testing

```bash
npm test          # vitest — 82 unit tests, no server or database needed
npm run smoke     # 46 route checks against a running server
```

The unit suite runs in a bare node environment and must stay that way: fast,
runnable anywhere, no fixtures. It covers the snapshot shape contract, directory
filtering, Arabic search folding, suggestion ranking, and the message
catalogues.

`npm run smoke` needs a server (`npm run dev` first, or set `BASE_URL`). It
checks every public route in both locales, that protected routes bounce
anonymous visitors to login, and that detail routes render. It also fails a page
that returns 200 while still showing its loading fallback — a status code alone
will not catch that.

### Two bugs the tests found

Both were latent in the original front end and neither was visible by clicking
around:

1. **Arabic alef folding did nothing.** `fold()` called `normalize("NFKD")`,
   which decomposes `أ` into `ا` + combining hamza (U+0654) — making the
   `[آأإ]` replacement dead code, since those precomposed characters no longer
   existed. The diacritic range stopped at U+0652, so the combining hamza
   survived and `الاردن` never matched `الأردن`: exactly the miss the function's
   own comment says it prevents. The range now reaches U+0655.

2. **Four of six suggestion kinds were unreachable.** The suggestion index lists
   all 594 restaurants before the first cuisine, and a restaurant's haystack
   contains its own cuisine, city and tags — so a single capped pass filled
   every slot with restaurants. Typing "Italian" offered six Italian restaurants
   and never "Italian" the filter, which is the shortcut the console exists to
   provide. `suggest()` now allots up to half the panel to category matches.

---

## 8. Conventions

- **Logical properties only.** No `left`/`right`, `margin-left`,
  `text-align: left`, `padding-right`. Flipping `<html dir>` mirrors the layout;
  physical properties break Arabic. The only thing that physically mirrors is
  `.mirror`, for arrows and chevrons.
- **Import `Link` from `@/i18n/navigation`**, never `next/link`, so the locale
  prefix is carried.
- **Interactive controls use `--color-field-border`**, not `--color-rule`. The
  rule token is a decorative hairline at ~1.2:1; a control's boundary needs 3:1
  under WCAG 1.4.11. `globals.css` applies this to inputs globally.
- **Editorial prose lives in `src/lib/content.ts` and `src/lib/modules.ts`** as
  `{ en, ar }` pairs, read through `pick()`. Interface chrome lives in
  `messages/*.json` and is read through next-intl. Do not mix them.
