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
- 2026-08-14 — Bundles are sold as **real tier products** (one line item at
  a flat price) rather than adding N individual products, because Shopify
  cart lines can't apply a bundle discount on the fly. The picker adds the
  tier variant with `properties[Pick 1..N]` naming each selection.
- 2026-08-14 — Bundle flat prices (₹349/₹499/₹799) come from the prototype
  tiers; they are stored on the tier products' price/compare-at so a merchant
  can adjust them without code.
- 2026-08-14 — The picker pool is the section's `collection` setting
  (defaults to Shop), not a hardcoded list.
- 2026-08-14 — Card product image is absolutely positioned inside the shot
  frame with `object-fit: contain` + padding, so square product art scales to
  fit the 242×150 landscape frame instead of overflowing (was zooming).
- 2026-08-14 — Combo cards use real product images (max 66px in the tray)
  rather than the prototype's tall inline SVG art, so cards are ~433px vs
  the prototype's 448px — a 15px delta, not a layout bug.
- 2026-08-14 — Combos reference products via `product_list` settings (up to
  3) and resolve the tier product from the picker's count→variant map, so a
  merchant can point a combo at any products without code.
- 2026-08-14 — Combo prices are flat bundle prices stored as settings (e.g.
  ₹499), matching the prototype's "already priced below the sum" framing;
  they are not computed from the member products.
- 2026-08-14 — Review cards are merchant-editable schema blocks
  (title/body/name/product) rather than hardcoded testimonials; the marquee
  duplicates each card once for a seamless -50% loop.
- 2026-08-14 — Reviews marquee is CSS-animated (52s, 40s mobile) and pauses
  on hover/focus; `prefers-reduced-motion` disables it entirely (the
  prototype left the animation playing for everyone).
