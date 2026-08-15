# JRA.jo Redesign — Handoff

Everything you need to pick this up without reading the conversation it came from.

---

## What this is

`jra.jo` (Jordan Restaurant Association) currently runs on stock **nopCommerce**, where
restaurants are modelled as *products*, cuisines as *manufacturers*, and amenities as
*product tags*. It works but reads as an e-commerce template.

This folder holds **three static home-page mockups in different visual directions**, built
from the same real content so they can be compared fairly. It is a look-and-feel decision,
not the build. No backend, no framework, no build step.

The wider requirement is a bilingual sector gateway of ~22 modules, specified in
`../JRA_Website_Graduation_Project_Full_Detailed_WRD_AR_EN (1).docx`. Only the home page
exists here.

## Run it

```bash
cd JRA/mockups
python -m http.server 8765
```

Then open <http://127.0.0.1:8765/>. That is the chooser page; it links to all three.
The files also open directly over `file://` — `shared/data.js` is a plain `const`
declaration rather than JSON precisely so `fetch` is never needed.

## The three directions

| | Direction | Character | Type |
|---|---|---|---|
| A | `a-editorial/` | Paper, whitespace, big photography. JRA as curator. | Playfair Display + Inter |
| B | `b-kingdom/` | Full-bleed hero, italic display type, six-tile colour grid. | Poppins Italic + DM Sans |
| C | `c-gateway/` | Navy, dense, utility-first. Hero is a working search console. | IBM Plex Sans + Mono |

All three carry an identical section skeleton — header → hero → primary actions → sector
destinations → member restaurants → JRA in numbers → news → membership → newsletter →
footer — so the only variable between them is design.

**Direction B has been selected** as the direction to take forward.

## File map

```
index.html              Chooser page: three cards, swatches, "what this direction commits you to"
HANDOFF.md              This file

a-editorial/index.html  Direction A markup + its render script
a-editorial/theme.css   Direction A tokens and component skin
b-kingdom/…             Direction B  (the selected direction)
c-gateway/…             Direction C

shared/base.css         Reset and layout primitives. No visual opinions. Logical properties only.
shared/brand.css        Brand tokens sampled from the logo + the derived tonal ramp.
shared/content.js       All editorial copy: nav, hero, destinations, stats, news, membership…
shared/data.js          GENERATED — restaurants, cuisines, cities, features. Do not hand-edit.
shared/behavior.js      Search, counters, carousel rails, slide decks, scroll reveal, i18n, nav.

assets/logo.png         Official lockup, blue + grey on white
assets/logo-white.png   DERIVED knockout for dark surfaces — see Risks
assets/SmallLogo.gif    Favicon

tools/extract.py        Regenerates shared/data.js from the xlsx exports in the parent folder
```

Each direction's `index.html` ends with a small inline script that renders the repeating
collections from `JRA_CONTENT` and `JRA_DATA` using that direction's own markup. Content is
single-sourced; markup is per-direction. That is deliberate — it lets the directions differ
structurally without the copy drifting apart.

## Brand rules

The logo was decoded pixel by pixel. It is a **strict two-colour identity**:

| Colour | Hex | Where it appears in the logo |
|---|---|---|
| Blue | `#0053A0` | the ellipse mark, and nothing else |
| Grey | `#6C6D70` | all type — Arabic and Latin both |

`shared/brand.css` holds those two values plus a tonal ramp derived only from them
(`--blue-950` … `--blue-50`, `--grey-900` … `--grey-50`).

**Standing rule: no third hue.** Every surface, rule and accent in all three directions is a
step on that ramp. The single exception is Direction C's `--status-alert` (muted amber) and
`--status-good` (muted green), which exist only to distinguish a legislative alert from an
opportunity at a glance. They are status indicators and must never be used decoratively.

There are no literal off-ramp hex values left in any `theme.css`; this was audited. Keep it
that way — add colours to `brand.css`, not to a theme.

Two contrast findings worth preserving:

- The brand grey `#6C6D70` reaches only **5.2:1** against white text, so it is not usable as
  a fill behind white type once that type is translucent. It was dropped from Direction B's
  tile fills for this reason.
- On tinted surfaces the brand grey lands at exactly 4.50:1 — the AA floor with no margin.
  Direction A's stat labels use `--grey-700` instead.

## Data pipeline

`tools/extract.py` (stdlib only — `zipfile` + `xml.etree`, no pandas) reads the nopCommerce
exports in the parent folder and writes `shared/data.js`:

```bash
python mockups/tools/extract.py      # run from JRA/
```

Sources: `resutaurants.xlsx` (757 restaurants), `manufacturers.xlsx` (21 cuisines),
`categories.xlsx`, `restaurant_tags.xlsx` (214 tags).

**Two traps that will bite anyone who re-parses these files:**

1. **Blank cells are omitted from the export.** Rows must be resolved by each cell's `r=`
   column reference, not by position — otherwise values silently shift one or two columns
   left and you get an address in the cuisine field.
2. **Picture1 is the venue *logo*, not a photograph.** Picture2 and Picture3 are the real
   photography. A photo-led layout that uses Picture1 will render a wall of logos. The
   extractor requires at least two images per record and maps
   `logo = images[0]`, `image = images[1]`.

Image paths in the export are server-side (`G:\Inetpub\...\thumbs\<file>`), but the basename
maps directly to a live URL: `https://jra.jo/content/images/thumbs/<basename>`.

`FullDescription` also contains mojibake — the original encoding was lost and only U+FFFD
survived, so `fix_mojibake()` repairs the handful of patterns it stands for and drops the rest.

## Decisions made, and why

- **Static HTML/CSS/JS, no build step.** Chosen so the mockups run by copying to a folder.
- **English first, Arabic pre-wired.** Every user-facing string carries `data-i18n`;
  `behavior.js` holds `{ en: {…}, ar: {} }`. The عربي toggle already flips `<html dir>` to
  RTL — only the dictionary is empty. This lets RTL be smoke-tested before any translation.
- **Logical properties everywhere** (`margin-inline`, `inset-inline-start`, `text-align: start`).
  No bare `left`/`right`. This is the part that is expensive to retrofit, so it was done up
  front. Directional icons carry `.mirror`, flipped by `[dir="rtl"]`.
- **Real data over lorem ipsum**, because photography and content density are most of what
  separates the three directions.
- **Direction B's header follows `siyahajobs.jo`** — a sister site in the same sector — at
  the level of *structure and behaviour, not typography*. B keeps its own typefaces so the
  three directions stay distinguishable.

## Risks and known gaps

- **Photos and video are hotlinked** from `jra.jo` and Pexels. Fine for a mockup; they must
  be self-hosted and resized before production.
- **The reversed logo is derived, not official.** `assets/logo-white.png` was generated by
  forcing every visible pixel of the supplied artwork to white, because the official lockup
  is blue-and-grey on white and disappears on dark footers. **Ask the association for a
  sanctioned reversed lockup before production.**
- **The Arabic dictionary is empty.** The plumbing works; the translations do not exist.
- **Nothing was verified by screenshot.** The Browser pane did not display during the
  session that produced this, so the page never composited frames — `document.hasFocus()`
  returned false and style recalculation was frozen. All verification was DOM-measurement
  based: no console errors, no broken images, no horizontal scroll at 375/768/1280, contrast
  ratios computed with alpha compositing, RTL mirroring confirmed. **Hover and focus states
  were never seen rendering.** Someone should open these in a real browser and look.
- **Direction C's search console is a mockup.** The selects are populated from real
  vocabularies but do not filter anything.

## Next steps

1. Open all three in a real browser and confirm the visual judgement — especially Direction
   B's tile hover, which has never been seen rendering.
2. Finish the Direction B work: remove the utility bar, rebuild the header on the
   SiyahaJobs pattern, video hero, and fixed-size tiles.
3. Get the official reversed logo from JRA.
4. Self-host and resize the imagery.
5. Fill the `ar` dictionary in `shared/behavior.js` and test RTL with real Arabic.
6. Decide the production stack, then build the remaining WRD modules against whichever
   direction is signed off.

---

## Superseded by `../web/` (Next.js build)

The look-and-feel decision is closed. Direction **B** was carried forward and
rebuilt as a full bilingual front end in `../web/` (Next.js 16, App Router,
TypeScript, plain CSS + CSS Modules — no Tailwind, so the audited logical-property
CSS survives intact).

**Changed from the mockup, deliberately:**

- **Hero searchbox → working search console.** B's decorative pill was replaced
  by Direction C's multi-field console, restyled into B's rounded surface
  language. A directory product's primary task is finding a listing, so search
  is the hero's payload, not an ornament. It carries a scope switch between the
  two directories.
- **Utility bar removed**, header rebuilt on the SiyahaJobs pattern (next-step 2).
- **Tiles are fixed-height.** The mockup's `min-block-size` + auto-growing panel
  shoved row-mates down on hover; the panel is now absolutely positioned so the
  reveal happens inside the tile's own box.
- **`--terracotta` / `--sand` dangling references gone** — three eyebrows in
  b-kingdom/index.html referenced tokens deleted in the brand audit.
- **Hero scrim strengthened.** The single linear gradient's weakest stop (34% at
  45% height) sat exactly where the headline and lede sit; over a bright photo
  that composites to **2.13:1**. A layered radial + linear scrim takes the worst
  case to **7.18:1** while keeping the edges photographic.

**Resolved gaps:**

- **Arabic is real, not just wired.** `content.js` was restructured to `{en, ar}`
  per string — filling a dictionary was never going to be enough, because body
  copy rendered from a monolingual object no `data-i18n` key touched.
- Three Arabic typography bugs the mockups would have shipped: italic display
  (not an Arabic emphasis form), `.22em` tracking (severs cursive joins), and
  `text-transform: uppercase` (no-op on Arabic, mangles embedded Latin). All now
  per-direction tokens.
- **Suppliers exist.** `tools/extract.py` discarded them via `NOT_CUISINES`;
  the new extractor walks the category tree and emits 39 suppliers / 11 trades.
  The "757 establishments" figure conflated both directories — it is 718 + 39.
- Touch targets, contrast on non-photographic surfaces, and 375px overflow all
  verified and fixed.

**Still open:** hover/focus states have *still* never been seen rendering — the
browser pane does not composite frames, and style recalc is frozen hard enough
that even an inline style change is invisible to `getComputedStyle`. The tile
reveal was verified statically only. Also unchanged: hotlinked photography, the
derived reversed logo.

### Header blend (added after the rebuild)

The header now blends into the hero: transparent with white type at rest, and
cream + blurred + shadowed once scrolled past 64px. It changed from `sticky` to
`fixed` to do it — sticky occupies layout space and pushed the hero down,
leaving a cream band where the blend belonged.

This works on every page because every page's first section is dark: the home
hero, and the navy `PageHero` on inner pages.

Two bugs fell out of the work:

- **The "Member login" label was wrapping to two lines**, inflating the header
  from 73px to **97px** on every page. `.btn` now sets `white-space: nowrap`.
- The search console's scope buttons were **40px**, under the 44px floor.

### Video hero (added)

The home hero is now stock video, closing HANDOFF next-step 2. Source: Pexels,
restaurant interior, Sururi Ballıdağ, free licence. Two `<source>` files —
1920x1080 (~7.8 MB) above 900px, 1280x720 (~4.0 MB) below — plus a 193 KB
poster still from the same clip.

The `prefers-reduced-motion` handling is the part worth knowing about: CSS
cannot stop a video autoplaying, so the preference is read in JS and the
`<video>` is never rendered for those users — they get the poster as a still
image and never download the clip.

Still hotlinked, like the photography.
