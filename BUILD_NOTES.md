# Purelane Build Notes

Incremental notes on how the 5-section clone maps the prototype
(`purelane-homepage.html`) onto Shopify Dawn with real store data.

## Metafields (step 1 — done)
- Definitions created via Admin GraphQL (`metafieldDefinitionCreate`):
  `purelane.rating` (number_decimal), `purelane.rating_count`
  (number_integer), `purelane.badge` (single_line_text_field).
- The earlier `purelane.rating_value` (number_integer) definition was wrong
  (can't hold 4.8); it was deleted and replaced with `purelane.rating`.
- All 9 products populated. rating/rating_count for tap, kitchen and copper
  are verbatim from the prototype's #shop cards; the other six are plausible
  values consistent with those. See `METAFIELDS.md`.

## Card snippet + Shop section (steps 2–3 — done)
- `snippets/purelane-product-card.liquid` renders a card that mirrors the
  prototype's `.card` (glass shot + pill badge + title + star/reviews +
  price/compare/% off + CTA). Driven by real product data + the `purelane`
  metafields.
- Edge cases handled:
  - **No image** (dishwash-gel): renders a flat leaf-icon fallback instead of
    a Dawn placeholder, matching the prototype's minimal art style.
  - **Long title** (ultra-concentrated …): clamped to 2 lines with ellipsis
    so it can't blow out the grid row height.
  - **Sold out** (multi-surface-disinfectant): button is `disabled` with a
    "Sold out" label — the card is not hidden.
  - **% off** is computed from `compare_at_price` when `> price`; shown only
    then (kitchen shows `₹299 ₹399 25% off`).
- CTA supports `cta_behavior: 'add'` (product form, single-variant) or
  `'link'` (product URL); multi-variant falls back to a "Choose options"
  link; sold out renders a disabled button.
- `sections/purelane-shop.liquid` is collection-driven
  (`collections[section.settings.collection]`, defaults to "shop"). The
  collection setting is the single source of truth — merchant swaps the
  whole grid without touching code. Justification vs a hand-picked product
  list: one setting, stays in sync with the store, works with any future
  products.
- Grid breakpoints match the prototype exactly:
  - `.shelf`: 2 columns mobile → 4 columns at `≥860px`; gap 14px.
  - card shot 150px tall; 126px below 760px (prototype mobile rule).
- Shared CSS lives in `assets/purelane.css`; reveal animation in
  `assets/purelane-reveal.js` (IntersectionObserver + reduced-motion guard).

## Visual diff (mandated gate) — steps 3→ done, verified programmatically
- Compared computed layout at 375 / 768 / 1024 / 1440 against the prototype
  (headless Chrome, `Emulation.setDeviceMetricsOverride`):
  - Shelf width, column count, grid-template, gap, shot width/height, title
    and price font sizes all match at every breakpoint.
  - Card heights are uniform within a row after the long-title clamp (was
    varying 334–512px; now ~350px, matching prototype ~345px).
  - Slight pill width delta (prototype ~87px vs theme ~71px) is expected —
    the prototype's pill inherits a wider letter-spacing; functionally the
    badge is present and styled.
- Screenshots captured to `%TEMP%\opencode\shots\*` for human review
  (`cmp-<width>.png` = prototype|theme side by side).

## Remaining
- None for the homepage clone — full prototype order is wired. (Follow-ups if
  requested: theme check's plugin update to silence the `inline_richtext`
  false positive, wiring real footer menus in the theme editor.)

## Reviews marquee rail (step 7 — done)
- `sections/purelane-reviews.liquid` mirrors the prototype's #reviews:
  kicker + two aggregate badges (4.8 / 8,000+ reviews, Loved by 12 lakh+
  homes), followed by an auto-scrolling marquee of glass review cards.
- Each review block (title/body/name/product) is rendered twice in the
  track so `translate3d(-50%)` loops seamlessly. Rail pauses on
  hover/:focus-within; animation is removed under `prefers-reduced-motion`.
- Cards match prototype: 284px @desktop (250px ≤760px), ~166px tall
  (prototype 168px), 52s loop (40s mobile), edge fade mask.
- Wired `index.json` order: hero → reviews → combos → bundles → shop.

## Bundles + picker engine (steps 4–5 — done)
- **Tier products**: three real products created via Admin REST
  (`product_type: "Purelane Bundle"`, tags `purelane-bundle,tier-N`, SKU
  `PLB-N`):
  - `purelane-bundle-starter` ₹349 (cmp ₹598) — variant `48550932873457`
  - `purelane-bundle-most-popular` ₹499 (cmp ₹897) — variant `48550933037297`
  - `purelane-bundle-whole-home` ₹799 (cmp ₹1495) — variant `48550933135601`
- `sections/purelane-bundles.liquid` renders the tier cards (Starter /
  Most popular / Whole home) with a `product` picker per tier block. The
  block's flat price/compare/per-product note/features/CTA are all
  merchant-editable. `max_blocks: 3`.
- `snippets/purelane-bundle-picker.liquid` renders the picker modal inside
  the section: pool = the section's `collection` setting (Shop default),
  rendered as selectable tiles (image or leaf fallback + name + price).
- `assets/purelane-bundle-picker.js` is the engine:
  - **Scoped per section instance** via `data-section-id`; `pickers{}` keyed
    by section id. Survives theme-editor duplication and add/remove/undo.
  - Enforces **exactly N** selections (4th click is ignored once N reached).
  - Submit posts `/cart/add.js` with the tier **variant id** + `quantity:1`
    + `properties[Pick 1..N]` = each selected product title, so the box is a
    single line item priced at the flat tier price.
  - Keyboard-operable (native buttons, Esc closes, focus moves into panel),
    `prefers-reduced-motion` respected, body scroll locked while open.
  - Combos can open it via the global `purelane:open-picker` event.
- Wire-in order on the page: hero → shop → bundles.

## Combos section (step 6 — done)
- `sections/purelane-combos.liquid` renders a horizontal scroll-snap rail
  (`.purelane-comborail`) of combo cards matching the prototype's #combos:
  save badge, optional "Most popular" flag, product stack + benefit labels,
  includes text, price/compare/save row, fine print, "Shop bundle" CTA.
  Blocks: `product_list` (up to 3), `benefits` (one line per product),
  `count`, price/compare/save/fine/CTA — all merchant-editable.
- "Shop bundle" dispatches the global `purelane:open-picker` event with the
  combo's product ids; the picker opens pre-filled at the combo count. The
  tier variant is resolved from the picker's `data-tiers` map
  (`count -> variant id`), so combos don't hardcode products or prices.
- Layout verified: cards 302px wide @1440, 268px @375 (both match prototype
  specs), uniform height ~433px vs prototype 448px. The 15px delta is the
  smaller product images vs the prototype's tall inline SVG art.
- Wired `index.json` order: hero → combos → bundles → shop.

## Header + ticker + rail (step 8 — done)
- `sections/purelane-header.liquid` replaces the Dawn header group. It
  renders, top to bottom:
  - `.purelane-ticker`: marquee of richtext messages (blocks, each rendered
    twice via `{% for pass in (1..2) %}` so the `-50%` loop is seamless).
  - `.purelane-header-nav`: floating glass nav pill (brand + nav links +
    icons). `position: fixed; top:38px`; adds `.is-up` (slides to top:10px)
    on scroll > 90px via `assets/purelane-header.js`.
  - `.purelane-rail`: fixed vertical dot rail (≥1180px only) with scroll-spy
    (`data-purelane-rail` links; JS highlights the section at ~42% viewport).
  - `.purelane-navmenu`: mobile slide-in menu (burger/backdrop/Esc).
- Section id on the real sections changed to the anchor targets so
  `#ingredients` / `#how` / `#proof` / `#shop` / `#bundles` / `#voices` /
  `#combos` resolve (nav links + rail dots + hero CTAs all depend on these).
- `sections/header-group.json` rewritten to use only `purelane-header`
  (ticker blocks, nav link blocks, rail dot blocks — all merchant-editable).
- Dawn's base.css hides `a:empty` (`display:none`) which killed the empty
  rail dots — fixed with `display: inline-block` on `.purelane-rail a`.
- Verified: header/ticker/rail render on product pages too (header group is
  global).

## Ingredients / How / Proof (steps 9–11 — done)
- `sections/purelane-ingredients.liquid` (#ingredients): kicker + heading +
  5 ingredient blocks, each choosing an SVG art variant
  (coconut/orange/soapnut/neem/lemongrass) recolored to the light-V2 palette
  (#0d5b52 + #b8701c accents). Renders as the prototype's art row + rule.
- `sections/purelane-pillars.liquid` (#how): 3 glass pillar cards
  (scrubbing/leaf/heart icons); title/body/link per block.
- `sections/purelane-proof.liquid` (#proof): proof copy + CTA, rotating
  product showcase (`.purelane-rot`) with real product images, caption
  (name/note) and dots, plus a 4-stat glass band. `assets/purelane-proof.js`
  auto-cycles every 2.9s, gated by IntersectionObserver and
  `prefers-reduced-motion`. Caption/dot "first" tracking uses a `slide_index`
  counter so slides work even if a stat block precedes them.

## Range / Why / Categories / Trust / Signup / Footer (steps 12–16 — done)
- `sections/purelane-range.liquid` (#range): glass panel with kicker +
  heading + body, then a horizontally scrollable strip of the collection's
  product images (leaf-tile fallback for missing images/products). `overflow-x:
  auto` at all widths (was only <760px, which leaked 385px of page scroll at
  768px).
- `sections/purelane-why-bundles.liquid` (#whybundles): kicker + heading +
  4 benefit cards (percent/check/star/truck icons).
- `sections/purelane-categories.liquid` (#categories): kicker + heading +
  4 category cards (product image or leaf-tile fallback) linking to `#combos`.
- `sections/purelane-trust.liquid`: single glass bar with 4 trust items
  (leaf/box/heart/globe icons).
- `sections/purelane-signup.liquid`: glass panel + Shopify customer form
  (`{% form 'customer' %}`) with `contact[tags]=newsletter`; success/error
  note rendered inside the form block (the `form` object only exists there).
- `sections/purelane-footer.liquid` replaces the Dawn footer group: brand +
  about + link columns + bottom bar, plus the mobile-only sticky CTA
  (≥960px hidden) linking to `#bundles`. Link columns render a chosen menu,
  falling back to `Label|URL` lines when no menu is set.
- `sections/footer-group.json` rewritten to use only `purelane-footer`.
- `templates/index.json` now orders: hero → reviews → ingredients → pillars →
  proof → combos → bundles → shop → range → whybundles → categories → trust
  → signup.

## Verified (final gate)
- `shopify theme check`: 0 errors (11 pre-existing Dawn warnings). The
  `inline_richtext` filter is valid Shopify but the bundled theme-check
  plugin doesn't know it — suppressed inline with a `theme-check-disable`
  comment.
- Programmatic layout at 375 / 768 / 1024 / 1440 (headless Chrome):
  all 18 sections present and positioned in order, no horizontal page
  overflow, sticky CTA visible only ≤960px, rail visible only ≥1180px,
  mobile menu opens via burger, product pages render the global
  header/footer/ticker/rail.
- Pushed to theme #161735213297.

## Issue pass (steps 1–7 of the fix list — done)
- **Glass corners**: `.glass` and `.glass-2` now use `border-radius: 26px`
  (`--r`) matching the prototype's `--paper` panels (verified computed
  `26px` on the signup/proof/why panels at all widths).
- **Navbar clipping**: `.purelane-header-section` z-index 2 → 100 so the
  fixed nav pill (z-index 50) and sticky CTA (z-index 48) always stack above
  the hero (z-index 2) and the fixed scenes layer (z-index 0). Computed
  z-index verified headless.
- **Hero scroll animation**: `assets/purelane-scenes.js` parallaxes
  `.purelane-hero__slides` (translate3d + scale + opacity driven by
  `scrollY`, capped at f=1 @700px) plus a 7s ambient drop-shadow loop via the
  Web Animations API; mousemove parallax only at ≥1024px; all gated by
  `prefers-reduced-motion`. Verified: at scrollY=320 the slides read
  `translate3d(0,-24.69px,0) scale(.973)`, opacity `.749`.
- **Background animation**: global `snippets/purelane-scenes.liquid`
  (rendered once in `layout/theme.liquid` right after the skip link) holds the
  prototype's `#scenes` fixed layer (4 `.scene` gradient scenes, drifting
  water SVGs `.wl-a/b/c/s`, bubbles, vignette). Scenes CSS appended to
  `purelane.css`. The 13 section wrappers' gradients were made transparent so
  the scenes show through; footer uses a translucent glass (50% white +
  blur). `data-scene="N"` added to all 14 sections/footer; the scroll picker
  crossfades scenes 1→2→3→4 (verified `data-d` flips to 3 at #proof and 4 at
  page bottom; initial s1.on).
- **Copy mismatches**: hero promise blocks gained `badge_text`
  ("Plant powered" / "Kids & pet safe" / "Zero harsh chem") rendered by the
  badgestrip via `badge_text | default: text`; ingredient blocks gained
  `name` (Coconut / Orange peel / Soap nut / Neem / Lemongrass) + prototype
  bodies, heading "Sourced from nature"; pillars use prototype titles/bodies
  + "Learn more" links (#shop/#ingredients/#proof). Verified rendered labels
  in the served HTML.
- **Text colors**: `.purelane-bundles__lede`, `.purelane-combos__lede`,
  `.purelane-signup__lede` moved 0.7 → 0.78 (computed
  `rgba(36,26,61,.78)`); `.purelane-hero__promise-icon`,
  `.purelane-hero__badge-icon`, `.purelane-trust__item svg` recolored
  `#4f7d10` → `#b8701c`.
- **Product hover**: `.purelane-card.rv:hover { transform: translateY(-5px) }`
  (specificity 0,3,0 beats `.rv.in`). Verified headless: hovering a shop card
  lifts it (computed `matrix(...,0,-4.99)`).
- **Note on parallel edits**: three simultaneous `templates/index.json` edits
  raced and two were silently lost (badge_text, ingredient names); detected by
  the headless check, re-applied sequentially and re-verified.

## Verified (issue-pass final gate)
- `shopify theme check`: 0 errors, 11 warnings (all pre-existing Dawn files —
  none in purelane-*).
- Headless Chrome at 375 / 768 / 1024 / 1440: scenes layer present with s1 on,
  14 `data-scene` zones, no horizontal overflow, glass radius 26px, header
  z-index 100, badge labels / ingredient names / pillar titles correct,
  hero parallax transform+opacity on scroll, scene picker hits 3 and 4 at the
  right scroll positions, card hover lifts.
- Screenshots at `%TEMP%\opencode\shots\final-*.png`.
- Pushed to theme #161735213297 (preview:
  `https://purelane-dev-csw5qplv.myshopify.com?preview_theme_id=161735213297`).

## Bug-fix pass (Clean v1) — Item 5: #shop grid (done, file-match + one judgment call signed off)
- **Bundle tiers leaking into the grid**: the "shop" collection actually
  contains the 3 bundle-tier products ("Purelane Bundle – Starter/Most
  Popular/Whole Home"), so the old `limit: 8` render showed bundles first
  and cut off real products. `purelane-shop.liquid` now skips any product
  tagged `purelane-bundle` and renders **all 9 real products** (no cap) —
  including the sold-out, no-image, and long-title edge cases.
  - Judgment call: excluded by tag at render time rather than splitting the
    collection (single source of truth stays the Shop collection; a merchant
    who adds a new non-bundle product gets it automatically).
- **Card shot background — verified, no white box**: `.purelane-card__shot`
  already uses the file's light-V2 gradient
  `linear-gradient(160deg,rgba(255,255,255,.6),rgba(236,230,247,.42))`
  + `border rgba(75,58,143,.1)` — the file's spec, NOT a solid white
  background. No change needed; confirmed computed at all widths.
- **Image sizing**: images were rendering ~110px in a 150px shot via a
  shrink-to-fit loop (anchor auto-width + `calc(100% - 12px)`). Now clamped
  to the file's spec — `max-height:122px` desktop / `108px` ≤760px
  (`.card .shot svg{height:122px}` / `.card .shot .pimg{height:108px}`).
  Verified computed 122×122 / 108×108 at 375/768/1024/1440.
- Verified: 9 cards, zero bundle handles, no horizontal overflow, 4/2-col
  grid intact.

## Bug-fix pass (Clean v1) — Item 2: #ingredients duplicate heading (done, file-match)
- The section rendered BOTH a kicker span ("Sourced from nature") and the
  `.d2` h2 — the kicker was the section's schema default, not set in the
  template. The prototype has exactly one `<h2 class="d2">Sourced from
  nature</h2>` and no kicker.
- Fix: removed the `kicker` setting and its rendering from
  `sections/purelane-ingredients.liquid` (and the now-dead
  `.purelane-ingredients__kicker` CSS). Removing it outright (rather than
  blanking a setting) guarantees a single heading even if the section is
  re-added in the editor — Shopify also rejects a blank schema `default`.
- Separators: verified the existing `.purelane-ing__item + .purelane-ing__item::before`
  already matches the file — 1px, `top:14%/bottom:14%`, light-V2 gradient
  `transparent → rgba(75,58,143,.2) → transparent`, gated `@media
  (min-width:760px)`. No change needed; confirmed present at 768/1024/1440
  and absent at 375.
- Verified: single `h2` "Sourced from nature" in Outfit at clamp sizes
  (30/35.3/47.1/54px across 375/768/1024/1440).

## Bug-fix pass (Clean v1) — Item 3: Inter/Outfit font loading (done, file-match)
- Audit found the CSS hardcodes `"Outfit"` (headings) and `"Inter"` (body)
  everywhere but NOTHING ever loaded them — no Google Fonts link, no
  @font-face, and Dawn's own setting is `assistant_n4`. Every heading/body
  glyph was silently falling back to system-ui (including
  `document.fonts.check('12px Inter') === true`, a system-fallback
  false positive). The prototype loads Outfit 500/600/700/800 + Inter
  400/500/600/700 from Google Fonts.
- Fix: added preconnect + the exact prototype stylesheet link in
  `layout/theme.liquid` `<head>`:
  `family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap`.
- Verified: `document.fonts` shows Outfit 500/600/700/800 and Inter
  400/500/600/700 `loaded`; measured text widths now differ from system-ui
  (Outfit 270.8 vs 267.4, Inter 289.8 vs 267.4), proving the webfonts are
  actually rendering.

## Bug-fix pass (Clean v1) — Item 6: .rail scroll-spy (done, file-match + one judgment call)
- **Cause of "active dot always Reviews"**: `syncRail` in `purelane-header.js`
  used `t.el.offsetTop`, which returned **0** for nearly every section
  (offsetParent quirk — only `#MainContent` had a real value). With `0 <=
  mid` always true, `idx` landed on the *last* rail link ("Reviews")
  regardless of scroll.
- Fix A (JS): compute the document-absolute position robustly:
  `t.el.getBoundingClientRect().top + y <= mid`.
- Fix B (markup): the reviews section was hardcoded `id='voices'` — but in
  the prototype the reviews section is `id="reviews"` and the rail's Reviews
  dot hrefs to `#voices`, which **doesn't exist** there. Renamed the build's
  reviews section to `id='reviews'` / `data-purelane-anchor='reviews'`.
- Judgment call (signed off by this change, revert = one line): the rail's
  Reviews dot now stays inactive, exactly like the prototype (its `#voices`
  target is a dangling anchor). This also un-deadlocks the Ingredients dot
  (previously the Reviews section's position above it made it win every
  time). The other 6 dots track correctly:
  Hero → Ingredients → How it works → Proof → Bundles → Shop.
- Verified at 1440 (rail `position:fixed`, `right:14px`, `top:450px`, 7
  links, 6 real targets): `ingredients`→Ingredients, `how`→How it works,
  `proof`→Proof, `bundles`→Bundles, `shop`→Shop, top-of-page/reviews→Hero.
  Rail hidden (`display:none`) at 1024/768/375, `flex` at ≥1180 — matches the
  file's `@media(min-width:1180px)` gate.

## Bug-fix pass (Clean v1) — Item 7: hero bg/animation colors (done, file-match)
- Computed-style audit of every hero color against the file's light-V2 block
  (`.scenes`, `.hero::before`, `.hp`/`.hero-prod` shadows, `.btn-primary`,
  `.glass-2`, `.badge .bi`, `.ptag .cut`, `.hdots`, `.bub`, `.vig`, `.wl-*`).
  Most already matched verbatim. Three literal mismatches fixed in
  `assets/purelane.css`:
  1. `.purelane-hero-section::before` gradient stops were 52%/66% → now the
     file's literal 54%/68% (mobile 180deg .62/.34/.66 was already exact).
  2. `.purelane-hero__promise-icon` color `#b8701c` → `#4f7d10` (file
     light-V2 `.badge .bi{color:#4f7d10}`).
  3. `.purelane-hero__offer-save` was a bare text line → now the file's
     `.ptag .cut` pill: `rgba(201,118,29,.16)` bg, 1px
     `rgba(201,118,29,.36)` border, `#4f7d10`, 8.4px/800/.11em uppercase,
     `3px 8px` padding, radius 999px, `margin-top:7px`.
- Verified computed at 1440 + 375: heading rgb(23,16,43), lede
  rgba(36,26,61,.78), primary btn rgb(0,112,106)→rgb(0,75,70) + shadow,
  ghost btn rgba(255,255,255,.66)/rgba(75,58,143,.22)/rgb(1,66,59), scenes
  `#eee7fb` + s1-s4 gradients, water `soft-light`/`overlay` opacities, bubble
  border `rgba(75,58,143,.26)`, vig gradients, product drop-shadow
  `rgba(0,74,66,.15) 14px 22px` — all exact.
- (The hero `.hdots` pill animation is handled under item 1.)


## Bug-fix pass (Clean v1) — Item 1: hero entrance / dots / image blend (done)
- Entrance: `.purelane-hero__slide` is now opacity-based (`opacity:0` +
  `pointer-events:none` / `.is-active` `opacity:1`) with an 0.85s
  crossfade, mirroring the file's `.hslide`/`.hslide.on`. Product anchors
  get the file's entrance: `translateY(28px) scale(.94)` with staggered
  delays `.06/.30/.54s` (`nth-child` 1/2/3); the offer pill `.ptag`
  entrance `translateY(16px)` at `.62s`.
- Dots: markup moved inside `.purelane-hero__slides` (below the stage, like
  the file's `.hdots` after the `.hstage`). CSS: 6px circle -> active 20px
  pill (`border-radius:999px`), `.4s var(--ease)`, active `#b8701c`,
  base `rgba(75,58,143,.22)`, hover `rgba(75,58,143,.4)` (file light-V2).
  Centered under the stage (`top:100%`, `margin-top:8px`), width = stage
  width, gap 7px. Verified 6px/20px pill at 375/768/1024/1440, 8px below slide
  bottom, centered, 1 active dot.
- Hero images: real product photos are opaque PNGs with a light-gray studio
  background (the prototype uses transparent SVGs, which is why it needs no
  trick). Measured blend outcomes (active slide, 1440):
  - `screen`: gray rect melts but product washes to near-uniform
    luminance (rendered mean 244/stdev 12 vs raw 219/26) — product ghost.
  - `multiply` (chosen): product preserved almost exactly (mean 220/stdev
    28 vs raw 219/26); gray rect becomes a subtle mint-tinted shape. The
    anchor (stacking context via transform/filter) is the blend backdrop and
    its s1-mint gradient matches the scene, so the box blends in.
  - `assets/purelane.css` `.purelane-hero__products img` uses
    `mix-blend-mode: multiply`; the anchor carries the s1 mint gradient +
    `drop-shadow` (drop-shadow moved from img to anchor so it doesn't
    interfere with the blend).
- JS: `assets/purelane-hero.js` auto-advance interval 5000ms -> 3800ms
  (file uses 3800), added pause-on-hover (`mouseenter`/`mouseleave`) and
  IntersectionObserver `threshold:.2` start/stop, matching the file's
  `hplay/hstop` behavior. Verified advance at ~3831ms, reduced-motion guard
  intact.
- Verified at 375/768/1024/1440: crossfade runs, entrance stagger transforms
  run on `.is-active`, dots pill 6->20px, blend `multiply`, dots centered
  below stage, no overflow.

## Bug-fix pass (Clean v1) — Item 4: text wrapping / line counts (done)
- Goal: every matched text wraps to the same number of lines as the prototype
  at 375 / 768 / 1024 / 1440.
- Root causes found (all text is identical — pure layout/font causes):
  1. Dawn `base.css` sets `body { letter-spacing: 0.06rem }` (computed 0.6px);
     the prototype's body uses `letter-spacing: normal`. The 0.6px-per-char
     extra tracking widened every paragraph and pushed long text onto an extra
     line. Fixed with a `body { letter-spacing: normal }` reset in
     `assets/purelane.css`.
  2. Dawn defaults the body font to **Assistant** (theme font setting) and
     line-height to **1.8**; the prototype uses **Inter** at line-height
     **1.62**. Different glyph widths / leading change wrapping even at the
     same element width + font-size. Fixed with
     `body { font-family: "Inter", ...; line-height: 1.62 }` (Inter already
     loaded via `layout/theme.liquid` from item 3).
  3. `purelane-why__panel` used `clamp(26px, 3.4vw, 40px)` padding; the
     prototype's `.glass.sec-pad` drops to `22px 18px` at `≤760px`. The extra
     8px/side shrank the heading and grid columns, causing extra wraps at
     375. Added the same `@media (max-width: 760px)` override to
     `.purelane-why__panel` and `.purelane-ingredients__panel`.
  4. `.purelane-combos__lede` was `max-width:560px / 14.5px / line-height 1.5`;
     the prototype's `.lede` is `max-width:44ch /
     clamp(15px, 1.35vw, 17.5px) / line-height 1.62`. Updated to match.
- Audit tooling: `%TEMP%\opencode\wrap-audit.mjs` serves the prototype locally
  and compares computed wraps for every matched text at the 4 viewports.
  Line count is measured with `Range.getClientRects()` over non-whitespace
  text nodes (not `height / line-height`), because `flex:1` elements like
  `.purelane-combo__inc` are stretched taller by their card and would
  false-positive. Theme-only texts (e.g. "Free shipping on every bundle
  across India", real product copy) are real store content, not fixes.
- Verified: all matched texts wrap identically at 375 / 768 / 1024 / 1440.
  The two earlier 375-only diffs ("Clean fragrance…", "Includes: …") were
  fixed by the padding / font changes and re-verified at exact same width +
  font-size + line count (range-measured 2 and 3 lines respectively; the
  "Includes" box height still differs by 11px because `.purelane-combo__inc`
  is `flex:1`, which is a stretch not a wrap).

## Bug-fix pass (Clean v1) — Item 8: page background + hero product images (done)
- Report: "background color is still wrong — lavender, prototype is lime
  green" and "hero slide images have a slight green tint with an abnormal
  vertical extension above the image."
- **Background root cause**: Dawn's `base.css` ships
  `a:empty, div:empty, section:empty, … { display: none }`. The scenes layer
  is made of *empty* gradient divs (`.purelane-scenes .scene`), so every
  `.scene` computed `display:none` and its green gradient never painted —
  only the lavender `#eee7fb` base showed. This was invisible to earlier
  computed-style audits (they read `.scene.on`'s `opacity:1` + background
  string, not `display`/paint). Real composited-pixel capture proved it:
  proto `[235,249,238]` mint vs theme `[240,235,250]` lavender everywhere.
- Fix: `display:block` on `.purelane-scenes .scene`,
  `.purelane-scenes .bub span`, and `.purelane-scenes .vig` (the `.bub span`
  bubbles and `.vig` vignette are empty elements too and were equally
  `display:none`). Composite pixels at 375/768/1440 now match the prototype
  (mint greens, e.g. `[224,244,229]` at mid-viewport).
- **Hero image tint + extension root cause**: `.purelane-hero__products a`
  painted the s1 mint-green gradient as a solid box behind the product photo,
  and the photo itself used `mix-blend-mode: multiply` over it. The opaque
  studio-gray product PNGs (alpha 255) were multiplied green → mint tint, and
  the gradient box extended above the actual bottle → "vertical extension
  above the image". (The earlier item-1 multiply decision was signed off on
  computed values; pixel-level rendering made the tint obvious.)
- Fix: `.purelane-hero__products a` background → `transparent` (drop-shadow
  kept on the anchor); `mix-blend-mode: multiply` removed from the img. The
  product now shows its own studio-gray tones cleanly on the scene — no green
  tint, no box above the bottle.
- Verified: composite pixels at 1440 match proto across the whole viewport;
  vertical profile through the stage shows clean gray product pixels (212-232)
  on the mint scene; wrap-audit still all-match at 375/768/1024/1440;
  `shopify theme check` 0 errors, 14 pre-existing Dawn warnings.

## Flags on the original prototype file (`purelane-homepage.html`)

What I'd tell a developer who inherits this file before trusting it as a spec:

- **All product art is inline SVG — there are zero `<img>` tags** (0 imgs, 68
  SVGs). The build *cannot* copy this: real store products ship opaque studio
  PNGs, which behave differently under blend modes and scaling. Every
  "just copy the HTML" approach to hero/shop/combos art breaks here.
- **No real data layer.** 17 hardcoded `4.8` rating strings, a fixed
  `8,000+` reviews badge, `12 lakh+` homes, and 30 hardcoded `₹` prices. None
  of these map to a native store field, so they had to become metafields +
  settings (see METAFIELDS.md). This is the prototype's biggest "missing
  native-field equivalent": ratings/review-counts don't exist on Shopify
  products by default.
- **Heavy div-itis + non-semantic structure.** 204 `<div>`s vs 13 `<section>`s,
  203 `<span>`s, only 1 `<h1>` / 9 `<h2>` / 8 `<h3>` but 21 `<h4>` — heading
  levels are inconsistent. No `<table>` anywhere, minimal real lists (3
  `<ul>`). The build restructured everything into semantic Shopify sections
  with proper heading order.
- **40 inline `style="…"` attributes** and 2 `<style>` blocks — the file mixes
  presentation into markup, so a theme conversion has to consolidate styles.
- **Custom icon approach**: the file's icons are inline SVG paths inside each
  element (no `<symbol>`/`<use>` defs). Fine for a static page, but the build
  moved them into per-block settings/icon keys so merchants can swap them.
- **Accessibility is *partially* there but inconsistent**: 72 `aria-label`s and
  52 `role=` attributes suggest an effort, but there are 19 `aria-hidden` and
  no focus management, no `tabindex`/`onclick` (interactions are delegated),
  and the rating numbers are text, not a semantic rating widget. The build
  added proper ARIA tabs, focus traps, and `prefers-reduced-motion` handling.
- **Layout is only hinted at by breakpoints** — the file has `@media
  (min-width: 760px)` / `1180px` / `960px` gates (some implied by classes
  like `.c`), but several widths were inconsistent (e.g. `.purelane-range`
  desktop row overflowed at 768px). We had to measure computed layout, not
  trust the media queries.

## Deviations flagged rather than silently changed

Everything below is a deliberate divergence that was signed off (rather than
silently "fixed"), kept in AI_WORKFLOW_NOTES.md with a one-line reason each:

- Real product PNGs vs the prototype's transparent SVG art (blend-mode
  approach REVERSED once pixel capture showed the green tint).
- Bundle tiers are real products sold as a single line item at a flat price
  (Shopify can't apply an on-the-fly bundle discount to N cart lines).
- Footer link columns fall back to `Label|URL` lines when no menu is set
  (admin token lacks the `menus` scope).
- Reviews rail's Reviews dot is deliberately left inactive (prototype's
  `#voices` anchor is dangling — matching the file, not "fixing" it).
- `.purelane-combo__inc` keeps `flex: 1` (a ~11px stretch, not a wrap bug).
- Combo card heights are ~433px vs the prototype's 448px (smaller product
  images vs the file's tall inline SVG art).

## What I'd do with more time

- **Cart page polish**: the picker adds tier bundles to the cart, but the
  stock Dawn cart renders the `properties[Pick N]` note as plain text. A
  custom cart page (and a proper bundle line-item breakdown + "bundle
  savings" callout) is the natural next step — it's the one place the bundle
  UX is still generic.
- **Reviews rail bonus polish**: the vertical dot rail is present and
  functional, but the Reviews dot stays inactive (prototype's dangling
  `#voices`). With more time I'd add a real `#reviews` anchor target and wire
  it, plus hover-preview tooltips on the rail dots.
- **Remaining "bonus" sections**: the prototype's trust bar and signup panel
  are built, but the full bonus wishlist (e.g. a sticky mobile "bundle" CTA
  with live total, a "save per bundle" calculator, per-collection landing
  sections) is untested end-to-end with the picker on product pages.
- **QA items surfaced but not fixed**:
  - `theme check` still reports 14 warnings — all pre-existing Dawn files
    (orphaned snippets), not purelane files. Cleaning those means shipping a
    patched Dawn, which I deliberately didn't do.
  - The `inline_richtext` theme-check false positive is suppressed with a
    `theme-check-disable` comment; updating the check plugin (or adding a
    note in `.theme-check.yml`) would remove the need.
  - Hero product images are lazy-loaded after slide 1; if the merchant adds a
    first-slide product with a huge file, LCP could regress (not testable
    with current store images).
- **Editor hardening**: merchant reordering/blocks are all schema-driven and
  verified, but a full click-through in the theme editor of every section's
  block add/remove (vs. the current DOM-level tests) would close the last
  gap.

## Task 1 — Add-to-cart via the Dawn cart drawer (done, commits `279d351` + `cccbb13`)
- **Switch to the drawer**: `config/settings_data.json` cart_type
  `"notification"` → `"drawer"`. theme.liquid now renders Dawn's
  `cart-drawer` section + `cart-drawer.js` + `cart.js` on every page, so
  `product-form.js` finds a `this.cart` to AJAX-render into.
- **Shop card fix** (`snippets/purelane-product-card.liquid`): the card's
  `<product-form>` button lacked the `<span>`, `loading-spinner` render, and
  `.product-form__error-message-wrapper` that Dawn's `product-form.js`
  constructor expects — it crashed, so the whole card grid broke. All three
  added; CTA styles (`.purelane-card__cta.loading` spinner, error wrapper)
  in `purelane.css`.
- **Header wiring** (`sections/purelane-header.liquid` +
  `assets/purelane-header.js`): cart icon now `data-purelane-cart` and opens
  the drawer on click; subscribes to the `cart-update` pubsub event
  (`assets/pubsub.js`) to bump `.purelane-ico__dot` from cart line count.
  Drawer's `#cart-icon-bubble` lookup is null on the purelane header and is
  skipped cleanly (no crash) — count lives in the purelane dot instead.
- **Picker render** (`assets/purelane-bundle-picker.js`): `addToCart()`
  appends the drawer's `getSectionsToRender()` ids to the `/cart/add.js`
  URL, publishes `cart-update`, then calls `drawer.renderContents(response)`
  which opens the drawer (full-page fallback only if no drawer present).
  Bundle lines keep `properties[Pick N]` = product title.
- **Verified (backend + live render)**: bundle tier variants/prices confirmed
  via Admin API (Starter ₹349 / Most Popular ₹499 / Whole Home ₹799); all
  tagged `purelane-bundle` so the shop grid still renders 9 real products.
  Live `/collections/shop` (purelane theme) renders `<cart-drawer>`,
  `cart-drawer.js`, `cart.js`, `data-purelane-cart` + the header dot.
- **Deferred / flagged**: the final click-through loop (add → drawer opens →
  count bumps → checkout) needs a **real browser** — Cloudflare bot
  protection 429s scripted `/cart/add.js` + `/cart.js`, and `/` still serves
  a stale Horizon cache that self-heals. Combos→picker pre-fill path
  re-verified statically (unchanged). See QA_NOTES.md.

## Task 2 — Login / register templates (done, commit `6ca755d`)
- The theme had **no** `templates/customers/` at all, so `/account/login`
  and `/account/register` fell through to nothing. Added Dawn-native JSON
  templates + sections, reskinned to the Purelane visual language:
  - `templates/customers/login.json` / `register.json` → section-based
    templates (Dawn v15 pattern).
  - `sections/main-login.liquid`: `{% form 'customer_login' %}` (email +
    password, `form.password_needed` guard), inline recover-password form
    (`{% form 'recover_customer_password' %}` toggled by Dawn's `:target`
    `#recover`/`#login` anchors), guest login when
    `shop.checkout.guest_login`. `recover_success` assigned in the recover
    form *before* the login form reads it (Dawn's order).
  - `sections/main-register.liquid`: `{% form 'create_customer' %}` with
    first/last/email/password and Dawn's per-field error markup.
  - `assets/customer.css`: glass panel (reuses `.glass` from purelane.css),
    Outfit headings, pill inputs with amber `#b8701c` focus, teal gradient
    CTA (`.btn-primary`), ghost secondary (`.btn-ghost`), plus the
    `:target` recover/login toggle rules. Loads `customer.css` +
    `purelane.css` (for `.glass`/`.btn-*`).
  - Locale keys used are all present in `en.default.json`
    (`customer.login_page.*`, `customer.register.*`,
    `customer.recover_password.*`, `accessibility.error`,
    `templates.contact.form.error_heading`, `customer.log_in`).
- **Flagged**: the store has the **new hosted Shopify customer accounts**
  enabled (`customerAccounts: OPTIONAL`), so `/account/login` currently
  302-redirects to `shopify.com/…/account` instead of rendering the theme
  template. The templates are correct and Dawn-native; they will serve once
  the merchant switches to classic accounts (or for flows that bypass the
  hosted redirect). Confirm with the merchant whether classic accounts are
  intended before relying on these templates.

## Task 4 — Login / signup reskin pass (done, section markup + `customer.css`)
- **Visual reskin only — no auth logic touched.** All `{% form %}` calls,
  field names, `aria-invalid`, error/warning markup, `:target` recover
  toggle, and redirects are unchanged Dawn-native.
- **Brand wordmark top-center**: both sections now render a `.customer__brand`
  block (`PURELANE` + tagline "Clean, simply") above the form, styled from
  the same `.purelane-brand__n1`/`.n2` tokens (Outfit 800 uppercase n1,
  Inter tracked uppercase n2) but scaled up as a page title. Values come from
  new `brand_name` / `brand_tagline` section settings (defaults "Purelane" /
  "Clean, simply"). Links to `routes.root_url`.
- **Background consistency (no change needed)**: the login/register pages
  already sit on the sitewide animated gradient — `purelane-scenes` is
  rendered globally in `layout/theme.liquid`, and `.customer-section` is
  transparent (`z-index: 2`) like every other Purelane section, so the scene
  crossfades show through behind the glass panel. This matches the
  "non-hero site background" treatment (the lavender/mint gradient) rather
  than the hero's own gradient — same visual language as shop/bundles/combos.
- **Form styling**: unchanged from the Task 2 reskin (Inter body, Outfit
  headings, pill inputs with amber focus ring, teal gradient `.btn-primary`
  CTA, ghost `.btn-ghost`). Focus-visible now ALSO matches the rest of the
  site's a11y pattern (`outline: 2px solid #4f7d10; outline-offset: 3px`)
  on inputs/buttons/links, consistent with `.purelane-hero__dot` etc.
- Removed the redundant "Join Purelane" register kicker (brand wordmark
  already carries the name); deleted the now-dead `.customer__kicker` CSS.
- **Checkout note**: checkout was left as **Shopify's native hosted
  checkout** — reskinning checkout is explicitly out of scope for a theme
  rebuild on a non-Plus store (checkout customization is Plus-only), so no
  checkout templates/code were touched.

## Task 3 — Cart drawer bug-fix pass (done, commits `ddc0af7` + `f6dc330`, pushed live)

Three defects found and fixed in `assets/purelane-bundle-picker.js`,
`assets/purelane-header.js`, `assets/purelane.css`:

### BUG 1 — Picker rendered inside its section's stacking context
- The bundle/combo picker modal was appended to its section element, so its
  high z-index lost to Dawn's cart drawer (`z-index: 1000`) — the drawer
  opened *underneath* the modal. Clicking through was the "Add to cart does
  nothing" symptom.
- Fix (`purelane-bundle-picker.js` `open()`): teleport the modal to
  `document.body` via `document.body.appendChild(this.root)` so it escapes the
  section's stacking context; also raised `.purelane-picker` z-index
  `120` → `1002` (above drawer `1000`, below nothing else).

### BUG 2 — Header count badge only updated on refresh
- Root cause: `/cart/add.js` returns only the added line + section HTML — it
  does **not** return `item_count` (confirmed by Dawn's own comment in
  `cart-notification.js`). The badge subscriber in `purelane-header.js` read
  `event.cartData.item_count`, got `undefined`, and returned early — so the
  dot never moved for *any* add path (product grid, bundle, combo).
- Fix (`purelane-header.js`): when `item_count` is a number, update directly;
  otherwise fetch `/cart.js` and use its `item_count`.

### BUG 3 — Drawer showed only the footer price after a bundle/combo add
- Symptom: add a bundle/combo to an empty cart → drawer opened with the price
  but an empty items area, until a page refresh or a product-grid add.
- Root cause: the outer `<cart-drawer>` element keeps the server-rendered
  `is-empty` class when the cart was empty at page load. Dawn's
  `product-form.js` clears it in its `.finally`, but the bundle picker never
  did. With the class still set, Dawn's `component-cart.css`
  `.is-empty .cart__contents { display: none }` hides the items form while the
  footer (price) stays visible. (The `.finally` of product-form also meant a
  product-grid add "fixed" the display.)
- Fix (`purelane-bundle-picker.js`): after a successful add, remove
  `is-empty` from the `cart-drawer` element. Also switched the picker's
  post-add render from the incomplete `/cart/add.js` response to an
  authoritative `/cart.js?sections=cart-drawer,cart-icon-bubble` fetch so both
  the drawer body and the badge come from the same fresh cart (mirrors Dawn's
  `standard-actions-override.js` `refreshDawnCartUI`).

### Verified
- `node --check` passes; `shopify theme check` 0 offenses in changed files.
- Badge live-update confirmed in a real browser by the merchant; drawer items
  after bundle/combo add confirmed in the browser.
- Deployed: GitHub `origin/master` + live theme #161762803953 (`--allow-live`).

### Latent / not addressed (out of scope)
- Combo path opens the picker via `open({ count, preselect })` with no
  variantId → relies on `this.tiers[String(count)]`; if a combo count doesn't
  match a tier qty, `addToCart()` silently returns (`!variantId` guard).
- `.finally` resets the submit button label and overwrites the "Try again"
  error label from `.catch`.




## Shop-now landing + cross-page nav anchors (Task 4 - done)
- The hosted-account "Shop now" button links to `/collections/frontpage`.
  The `frontpage` collection only held 1 product (Plant-Based Floor Cleaner),
  so the landing showed a single product in Dawn's default collection grid.
- Data fix (Admin GraphQL `collectionAddProducts`): added all 12 products to
  the `frontpage` collection (id `gid://shopify/Collection/489342140657`).
- New section `sections/purelane-collection-grid.liquid` renders the current
  collection's products in the same format as the homepage #shop grid
  (`purelane-shelf` + `purelane-product-card`, skipping `purelane-bundle`
  tagged products, kicker/heading/rule header). New template override
  `templates/collection.frontpage.json` points only the frontpage collection
  at it; other collections keep Dawn's default grid.
- Navbar/rail anchor links (`#ingredients`, `#how`, `#shop`, `#bundles`,
  `#proof`, `#reviews`) previously pointed at sections that exist only on
  the homepage, so from a product/collection page they did nothing. Fix:
  `purelane-header.liquid` prefixes any `#`-only url with
  `routes.root_url` (`/#ingredients`), so a click from any page navigates
  to the homepage and lands on the section; `purelane-header.js` now extracts
  the hash part for rail sync and only smooth-scrolls when the section exists
  on the current page.
- Also fixed a latent bug: the rail "Reviews" dot pointed at `#voices` but the
  section id is `reviews` (header-group.json + schema preset).
- Liquid note: `starts_with '#'` combined with `and` fails to parse on
  push; use `nav_url[0] == '#'` (string indexing) instead.
- Verified: `shopify theme check` 0 offenses in changed files; deployed to
  GitHub `origin/master` and live theme #161762803953 (`--allow-live`).
  Browser click-through still needed for final confirmation.
