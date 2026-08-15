# JRA Design System — Master

Global source of truth for the JRA sector gateway. Page-specific deviations, if
any are ever needed, go in `design-system/pages/<page>.md` and override this
file. If no page file exists, these rules apply in full.

**Implemented in:** `web/styles/tokens.css`, `web/styles/base.css`,
`web/styles/components.css`.

---

## 0. On the generated recommendation

This system was checked against the `ui-ux-pro-max` design engine. Its
**pattern** recommendation was adopted and its **palette and typography
recommendations were rejected**. Recording why, so the question isn't reopened:

| Engine output | Decision | Reason |
|---|---|---|
| Pattern: *Marketplace / Directory* — "the search bar is the CTA" | **Adopted** | JRA is a directory product twice over (restaurants + suppliers). This is what justified replacing Direction B's decorative pill searchbox with Direction C's working console. |
| Palette: `#DC2626` red, `#F87171`, `#FEF2F2` — "appetizing red + warm gold" | **Rejected** | The engine pattern-matched on the word "restaurant" and proposed a consumer-food palette. JRA's identity is an audited two-colour system. A third hue is not available to us. |
| Type: Playfair Display SC / Karla | **Rejected** | Direction B's selected voice is Poppins italic + DM Sans. Changing it would discard the direction that was chosen. |

**Rule: the brand constraint outranks any generated recommendation.**

---

## 1. Colour

The identity is strictly two colours, sampled from `logo.png`:

- **Blue `#0053A0`** — the ellipse mark, and nothing else in the original artwork
- **Grey `#6C6D70`** — all type, Arabic and Latin

Everything else is a tonal derivation of those two.

### Standing rule: no third hue

The only exceptions are the two status colours, and they are constrained:

| Token | Value | Permitted use |
|---|---|---|
| `--status-alert` | `#8A5A12` | Legislative alerts only |
| `--status-good` | `#12645A` | Opportunities only |

These exist because "a rule changed" and "an opportunity opened" must be
distinguishable at a glance. **They are never used decoratively.** If you find
yourself reaching for one to make a panel look less blue, the answer is no.

### Ramps

```
blue    950 #041F3A   900 #062E55   800 #003A73   600 #0053A0 (brand)
        500 #0A66BC   300 #7FB3E3   100 #D6E5F3    50 #EDF3F9
grey    900 #232427   800 #333437   700 #4A4B4E   600 #6C6D70 (brand)
        400 #A0A1A4   300 #C8C9CB   200 #DFE0E2   100 #EFEFF0   50 #F7F7F8
```

There is deliberately no `--blue-700`, `--blue-400`, `--blue-200` or
`--grey-500`. Those steps were never needed; don't add one without a use.

### Two contrast findings that constrain the system

Both were measured, and both are load-bearing:

1. **Brand grey reaches only 5.2:1 behind white text.** It is therefore
   **excluded as a tile fill** — it passes at full opacity but fails AA the
   moment the panel copy is set translucent. It stays as body text on light
   surfaces.
2. **On tinted surfaces brand grey lands at exactly 4.50:1** — the AA floor
   with zero margin. Any label on a tinted panel uses `--grey-700` instead.

### The six tile fills

Four blues, two greys, alternated so no two adjacent tiles in the 3-column grid
share a tone:

| Token | Value | |
|---|---|---|
| `--c1` | `#0053A0` | brand blue |
| `--c2` | `#4A4B4E` | deep grey |
| `--c3` | `#062E55` | navy blue |
| `--c4` | `#0A66BC` | lifted blue |
| `--c5` | `#333437` | darkest grey |
| `--c6` | `#003A73` | deep blue |

Tile body copy is **full white, never translucent** — the fills were chosen so
white type clears AA, and dropping opacity is precisely what broke that.

---

## 2. Typography

### Latin

| Role | Face | Treatment |
|---|---|---|
| Display | Poppins | italic 700, `-0.02em` |
| Body | DM Sans | 400 / 500 / 700 |

Italic 700 Poppins is Direction B's signature and the most distinctive thing
about it.

### Arabic — and why it is not just "the same, mirrored"

Arabic uses **Cairo** for both display and body. Three Latin styling decisions
actively damage Arabic text and are tokenised per-direction rather than
hardcoded:

| Property | Latin | Arabic | Why |
|---|---|---|---|
| `font-style` | `italic` | `normal` | Arabic has no italic tradition. A slanted Arabic word reads as a **rendering fault**, not emphasis. The Arabic build carries the same weight through Cairo 700 upright. |
| `letter-spacing` | `.22em` eyebrows, `-0.02em` display | `0` everywhere | **This is the destructive one.** Arabic is cursive — letters join. Positive tracking pulls the joins apart and renders words as disconnected glyphs. Zeroed, not reduced. |
| `text-transform` | `uppercase` | `none` | Arabic is unicameral, so the declaration is a no-op on Arabic glyphs — but it still uppercases Latin mixed into the same run ("JRA"), which reads as accidental. |

Arabic body copy also runs at `line-height: 1.8` against Latin's `1.6`: Arabic
has a smaller x-height but taller ascenders and descenders, so it needs more
leading at the same nominal size.

**Never hardcode `letter-spacing`, `font-style: italic`, or
`text-transform: uppercase`.** Use the tokens: `--display-style`,
`--display-tracking`, `--eyebrow-tracking`, `--eyebrow-transform`,
`--label-tracking`, `--btn-tracking`, `--nav-tracking`.

### Numerals — one formatter, Latin digits

Arabic content uses **Latin digits (718), not Arabic-Indic (٧١٨)**, and every
number goes through **next-intl's formatter** — `useFormatter().number()` or an
ICU placeholder in a message.

This is not a stylistic preference, it is a consistency requirement. The two
available formatters disagree: `toLocaleString("ar-JO")` selects the `arab`
numbering system and renders ٧١٨, while next-intl renders 718. The home page
briefly showed both at once — a hand-written ١٩٧٦ beside an ICU-formatted 718,
and stat counters in Arabic-Indic beside a hero in Latin.

Rules:
- Never call `toLocaleString` for display. Use `useFormatter()` /
  `getFormatter()`.
- Never hand-write Arabic-Indic digits in `messages/ar.json`, `lib/content.ts`
  or `lib/modules.ts`.
- If the association later asks for Arabic-Indic, change it in **one** place by
  configuring the formatter's numbering system — not by editing content.

---

## 3. Shape and elevation

| Token | Value | Applied to |
|---|---|---|
| `--r-pill` | `999px` | buttons, inputs, tags, scope switch |
| `--r-lg` | `20px` | cards, tiles, panels |
| `--r-md` | `16px` | quick-action pills, suggestion panel |
| `--r-sm` | `10px` | small surfaces |

Direction B is the fully-rounded direction. Do not introduce square corners —
that is Direction A's language, and mixing them reads as inconsistency rather
than contrast.

| Token | Use |
|---|---|
| `--shadow-card` | cards at rest |
| `--shadow-raised` | quick-action pills |
| `--shadow-float` | the search console |
| `--shadow-pop` | suggestion dropdown |
| `--shadow-stuck` | header once scrolled |

---

## 4. Motion

| Token | Value |
|---|---|
| `--dur-fast` | `0.18s` |
| `--dur-mid` | `0.3s` |
| `--dur-slow` | `0.45s` |
| `--ease-out` | `cubic-bezier(.2,.7,.2,1)` |
| `--ease-media` | `cubic-bezier(.2,.6,.2,1)` |

Rules:
- Micro-interactions stay in the **150–300ms** band.
- Animate `transform` and `opacity` only. The tile reveal animates
  `max-block-size`, which is the one deliberate exception — it is contained
  inside a fixed-height tile so it cannot reflow the grid.
- `@media (prefers-reduced-motion: reduce)` disables all of it. Every component
  that animates carries its own reduced-motion block.
- `@media (hover: none)` leaves the tile panels permanently open — a hover-only
  reveal is unreachable on touch.

---

## 4a. The header

The header **overlays** the first section rather than sitting above it, so it
must be `position: fixed` — `sticky` occupies layout space and would push the
hero down, leaving a cream band exactly where the blend should be.

| State | Trigger | Appearance |
|---|---|---|
| At rest | `scrollY <= 64` | No background, white type, white logo, white focus ring |
| Scrolled | `scrollY > 64` | Cream `rgb(247 247 248 / .92)` + `blur(12px)` + shadow, ink type, dark logo, brand-blue focus ring |

This works uniformly because **every page's first section is dark** — the home
hero (photo + navy scrim) and every inner page's `PageHero` (solid `--navy`).
A page that ever starts on a light surface would need its own treatment.

Three things flip with the background and must not be hardcoded:

- `--nav-accent` — hover and current-page marking. Brand blue is close to
  invisible against the dark hero, so it resolves to white while transparent.
- `--nav-hover-bg` — the wash under the language toggle and menu button.
- The focus ring — brand blue is too dark to find over photography; it goes
  white while transparent.

The two logo lockups are both rendered, stacked in one grid cell, and
cross-faded. That avoids a layout shift and a second network request at the
moment the user scrolls.

**`--header-h` must stay ≥ the real header height.** Anything that has to clear
the header (page heroes, `scroll-padding-block-start` for in-page anchors)
measures against it, and being short puts content underneath. Measured 78px;
the token is 5rem/80px so it is never short.

---

## 4b. The hero video

The home hero runs stock footage (`lib/hero-media.ts`, rendered by
`components/home/HeroVideo.tsx`).

| | |
|---|---|
| Source | Pexels — restaurant interior, warm lighting |
| Credit | Sururi Ballıdağ / Pexels (free licence, attribution not required) |
| Files | 1920×1080 ~7.8 MB above 900px; 1280×720 ~4.0 MB below |
| Poster | Pexels still, 193 KB |
| Length | 10.5s loop |

Five rules, each load-bearing:

1. **`muted` + `playsInline`** — without both, iOS refuses to autoplay and
   shows a tap-to-play control in the middle of the hero.
2. **`poster`** — carries the first paint so the LCP does not wait on video
   bytes. It is a still from the same clip, so the handover is invisible.
3. **`preload="metadata"`**, not `auto` — the clip is decoration and must not
   compete with the search console for bandwidth.
4. **`aria-hidden`, no captions, `tabIndex={-1}`** — it carries no information
   and no audio. Everything the hero means is in the text above it.
5. **`prefers-reduced-motion` is handled in JS, not CSS.** This is the one that
   catches people: a media query can disable transitions and animations, but an
   autoplaying looped video keeps playing regardless. The preference is read
   with `useSyncExternalStore` and the `<video>` is simply never rendered — the
   poster is shown as a still instead, so those users also never pay for the
   download.

The two `<source>` elements are ordered widest-first with a `media` attribute,
so phones fetch roughly half the bytes. Source selection happens once at load;
resizing does not re-pick.

**Still hotlinked**, like the photography — self-hosting all media remains
production work.

---

## 5. Layout

- Container: `--maxw: 1280px`, via `.wrap`.
- Section rhythm: `clamp(3.5rem, 7vw, 7rem)`.
- Breakpoints in use: `480 / 600 / 640 / 700 / 720 / 760 / 860 / 900 / 940 / 1040 / 1100 / 1120 / 1300`.
- Fixed tile height `26rem` — **not** `min-block-size`. The mockup's auto-growing
  panel shoved row-mates down on hover; the panel is now absolutely positioned
  so the reveal happens inside the tile's own box.

### Logical properties are mandatory

Every directional property must be logical: `inset-inline-start`,
`margin-inline`, `padding-block`, `border-inline-start`, `inline-size`,
`block-size`, `text-align: start`.

**No `left`, `right`, `margin-left`, `padding-right`, or `text-align: left`
anywhere.** This is what makes the Arabic RTL flip free, and it is expensive to
retrofit. Arrows and chevrons are the only things that physically mirror, via
`[dir="rtl"] .mirror { transform: scaleX(-1) }`.

---

## 6. Accessibility floor

Non-negotiable, checked before any page ships:

- Body text ≥ **4.5:1**; large text ≥ **3:1**.
- Touch targets ≥ **44×44px**. `.tap` enforces it; buttons carry
  `min-block-size: 44px`.
- Visible focus: `3px solid var(--focus)` at `3px` offset. **Never remove it.**
- Colour is never the only signal — status notices carry a coloured rule *and*
  a text tag; magazine access level is stated in words, not a lock glyph.
- Icon-only controls carry `aria-label`.
- Animated counters are `aria-hidden`; the final value is exposed separately so
  screen readers don't announce a stream of intermediate numbers.
- Form errors sit **beside their field**, linked by `aria-describedby`, with
  `role="alert"`. Validation fires on blur, not per keystroke. Focus moves to
  the first invalid field on a failed submit.
- Status messages use `role="status"` / `aria-live="polite"` and never steal
  focus.
- The mobile nav traps nothing but restores focus to its toggle on close, and
  closes on `Escape`.

---

## 7. Known gaps

Carried forward from `mockups/HANDOFF.md`, still open:

1. **The reversed logo is derived, not official.** `logo-white.png` was
   generated by forcing every visible pixel white. Ask the association for a
   sanctioned reversed lockup before production.
2. **Photography is hotlinked** from `jra.jo` and Pexels. Must be self-hosted
   and resized. `next.config.ts` allow-lists those hosts explicitly as an
   interim measure.
3. **Hover and focus states have still never been seen rendering.** The
   in-app browser pane does not composite frames — `document.hasFocus()` is
   `false` and style recalculation is frozen, so even an inline style change
   does not appear in `getComputedStyle`. The tile reveal was verified
   *statically* (the rule exists at the right specificity) but not visually.
   **Open the site in a real browser and check the tile hover before sign-off.**
4. **Classification weights are illustrative.** Replace with the association's
   published scoring before the readiness score is presented as meaningful.
5. **Editorial copy in `lib/modules.ts` is representative, not approved.**

---

## 8. Data notes that affect design

- The directory splits **718 restaurants / 39 suppliers**. The mockups' "757
  establishments" figure conflated the two.
- **219 of 718 restaurants have no usable photograph.** Cards degrade to a
  monogram plate — never a broken frame or an empty grey box — and the default
  directory sort puts photographed entries first so the grid is not pocked with
  them.
- `Picture1` in the source export is the venue **logo**, not a photograph;
  `Picture2`/`Picture3` are the real photography.
- **Governorate is often unknown, and the UI must say so by omission.** The
  original extractor defaulted every unrecognised address to Amman, which
  invented a governorate for 42% of restaurants and 95% of suppliers —
  including 99 entries with no address at all. It now resolves a governorate
  only from evidence (a named governorate, or a named Amman district) and
  returns empty otherwise: **447 Amman, 214 unspecified**, 12 governorates
  represented in total. Consequences for design:
  - Never render a placeholder city. Omit the line.
  - Facet counts are real, so empty governorates show `(0)` and are disabled.
  - The home-page stat reads **12 governorates**, not 17. Seventeen was the
    size of the vocabulary, not a fact about the membership.
- **Opening hours do not exist in the source data at all.** The profile page
  renders one shared documented sample and labels it unconfirmed on screen.
  Never generate per-venue hours: plausible unique schedules are
  indistinguishable from real ones, and someone eventually travels to a closed
  restaurant because of it.
