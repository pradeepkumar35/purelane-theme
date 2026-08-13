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
