# AI Workflow Notes

One-line log of every production decision that deliberately deviates from
the prototype, so nothing is "lost in translation" between static HTML and
the live theme.

- 2026-08-14 — Replaced the prototype's hardcoded product cards/SVGs with a
  single data-driven card snippet driven by real product data + `purelane`
  metafields (badge / rating / rating_count).
- 2026-08-14 — No-image products (e.g. dishwash-gel) render a flat leaf-icon
  fallback instead of the prototype's inline SVG art or a Dawn placeholder.
- 2026-08-14 — Long product titles (ultra-concentrated multi-surface …) are
  clamped to 2 lines with ellipsis so they cannot break the `.shelf` grid
  row height (prototype titles were all short).
- 2026-08-14 — Sold-out products keep their card visible but show a disabled
  "Sold out" button (prototype had no sold-out state).
- 2026-08-14 — Prices / compare-at / % off come from the store, not the
  prototype's placeholder ₹200/₹299/33%. Only real compare-at prices show a
  strikethrough + computed %.
- 2026-08-14 — Shop grid is collection-driven (single `collection` setting,
  defaults to "shop") rather than a fixed product list, so the section stays
  in sync with the store.
- 2026-08-14 — Metafield definition renamed `rating_value` → `rating` and
  corrected to `number_decimal` (the integer type can't store 4.8).
- 2026-08-14 — Added a missing `--ease` custom-property definition in
  `purelane.css` (the hero CSS already referenced it; it was undefined).
- 2026-08-14 — CTA "Add to cart" uses a Shopify product form (single-variant
  add-to-cart); multi-variant products fall back to a "Choose options" link.
