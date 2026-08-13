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
- Combos section (`.comborail`) on top of the picker.
- Reviews marquee rail (bonus).
- Wire `templates/index.json` in prototype order once all sections exist
  (currently hero + shop + bundles).

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
