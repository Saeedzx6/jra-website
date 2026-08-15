# JRA Sector Gateway — front end

Bilingual (English / Arabic) front end for the Jordan Restaurant Association,
built to the WRD's 19 modules. **Front end only — there is no backend.** All
data is static and bundled at build time; forms validate and give feedback but
submit nowhere.

## Run

```bash
npm install
npm run dev
```

Then open <http://localhost:3000/en> or <http://localhost:3000/ar>.

```bash
npm run build   # prerenders 1,559 pages (both locales)
npm start
```

## Regenerate the directory data

`data/*.json` is generated from the nopCommerce xlsx exports in the parent
folder. Python 3, stdlib only:

```bash
python scripts/extract-data.py
```

Produces `data/restaurants.json` (718), `data/suppliers.json` (39) and
`data/vocab.json`.

Note the split: the mockups' "757 establishments" figure conflated both
directories. The supplier rows were being filtered out entirely — the extractor
now walks the `Suppliers` branch of the category tree in `categories.xlsx` to
separate trades from cuisines and from the recruitment job-role categories that
share that sheet.

## Layout

```
app/[locale]/          One route per WRD module; layout sets <html lang dir>
components/
  chrome/              Header (SiyahaJobs pattern), footer, logo
  search/              SearchConsole — the hero's working search
  home/                Tiles, stats, rail, news, membership deck, newsletter
  directory/           EntryCard, DirectoryBrowser (faceted), EntryDetail
  classification/      SelfAssessment (weighted scoring)
  layout/              PageHero + breadcrumbs, shared card/notice/prose
lib/
  directory.ts         Typed data access, filtering, suggestions
  content.ts           Editorial content, {en, ar} per string
  modules.ts           Content for the remaining WRD modules
messages/              UI strings (next-intl)
styles/                tokens -> base -> components
i18n/                  Routing, navigation, request config
scripts/extract-data.py
```

Design rules live in `../design-system/MASTER.md`. **Read it before changing
colour or type** — the two-colour brand constraint and the Arabic typography
overrides are load-bearing, not preferences.

## Two things that will bite you

**Logical properties only.** No `left`, `right`, `margin-left`,
`text-align: left`. The Arabic RTL flip is free because every directional
property is logical; one physical property breaks it silently in one locale.

**Never hardcode `letter-spacing`, `font-style: italic`, or
`text-transform: uppercase`.** Use the tokens. Arabic is cursive — positive
tracking severs the joins between letters and renders words as disconnected
glyphs. Italic is not an Arabic emphasis form. Both are handled by
per-direction tokens in `styles/tokens.css`.

## Known gaps

- Hover/focus states have not been visually verified — the in-app browser pane
  does not composite frames. **Check the tile hover in a real browser.**
- Photography is hotlinked from `jra.jo`; must be self-hosted for production.
- `public/brand/logo-white.png` is a derived reversed lockup, not official.
- Classification weights are illustrative, not the association's published
  scoring.
- Editorial copy in `lib/modules.ts` is representative, not approved.
- `/login` is a non-functional prototype and says so on the page.
