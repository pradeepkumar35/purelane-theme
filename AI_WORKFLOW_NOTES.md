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
- 2026-08-14 — The header group is a single custom `purelane-header` section
  (ticker + nav pill + rail + mobile menu) replacing Dawn's announcement bar
  + header, and the footer group a single `purelane-footer` (columns + sticky
  CTA) replacing Dawn's footer group.
- 2026-08-14 — Section `id` attributes are the anchor targets themselves
  (`#ingredients`, `#how`, `#proof`, `#shop`, `#bundles`, `#voices`,
  `#combos`) so nav links / rail dots / hero CTAs all resolve; no JS was
  already depending on the old `PurelaneX-{{ section.id }}` ids.
- 2026-08-14 — Ticker messages are richtext blocks rendered twice so the
  `-50%` marquee loop is seamless; the valid `inline_richtext` filter needs a
  `theme-check-disable` comment because the bundled theme-check plugin
  doesn't recognize it.
- 2026-08-14 — Dawn's `base.css` rule `a:empty { display: none }` hid the
  empty rail dots; `.purelane-rail a` now forces `display: inline-block`.
- 2026-08-14 — The full-range strip is `overflow-x: auto` at every width, not
  just ≤760px — the desktop `justify-content: space-between` row with 9
  images overflowed the page at 768px by 385px otherwise.
- 2026-08-14 — The proof rotator is JS-cycled (2.9s, IntersectionObserver
  gated, reduced-motion aware) and its caption/dot "active" state is tracked
  with a `slide_index` counter rather than `forloop.first`, so slides keep
  working even when a stat block comes first in the block order.
- 2026-08-14 — Footer link columns use a chosen menu when set, otherwise
  fall back to `Label|URL` lines (the admin API token lacks the `menus`
  scope), so the columns render without needing menu setup.
- 2026-08-14 — The prototype's fixed `#scenes` animated background is
  rendered once as a global `snippets/purelane-scenes.liquid` in
  `layout/theme.liquid` (not a per-section asset), with scenes CSS appended
  to `purelane.css` and a scroll-driven picker in `assets/purelane-scenes.js`.
  Sections' own wrappers are transparent so the layer shows through; only the
  footer stays translucent for contrast.
- 2026-08-14 — Hero scroll parallax targets `.purelane-hero__slides` directly
  (translate3d + scale + opacity from `scrollY`), and the scenes layer keeps
  `data-d="1..4"` opacity fallbacks so content stays readable even if JS
  fails. All scene/water animations respect `prefers-reduced-motion`.
- 2026-08-14 — Badgestrip labels are a separate `badge_text` setting per
  promise block (short versions "Kids & pet safe"/"Zero harsh chem") while
  `text` keeps the full promise wording used in the hero promises list; the
  strip renders `badge_text | default: text`.
- 2026-08-14 — Issue-fix parallel edits to `templates/index.json` raced and
  silently dropped two blocks; the headless verification caught it, edits
  were re-applied sequentially and re-verified. Rule going forward: no
  concurrent edits to the same file.
- 2026-08-14 — Hero product photos are opaque studio PNGs (not transparent
  SVGs like the prototype). The original `mix-blend-mode: multiply` over the
  anchor's green gradient tinted the gray boxes mint-green and the gradient
  box showed above the bottle, so it was REVERSED (item-8 fix): the anchor's
  green gradient background is now `transparent` (drop-shadow kept on the
  anchor) and the img blend is removed. The product photo shows its natural
  studio-gray tones on the green scene.
- 2026-08-14 — Dawn's `base.css` rule
  `a:empty, div:empty, section:empty, … { display: none }` also hid the
  empty gradient `.scene` divs (plus `.bub span` bubbles and `.vig`
  vignette) of the global scenes layer, so the whole background painted
  lavender `#eee7fb` instead of the prototype's lime-green. Item-8 fix:
  `display: block` on `.purelane-scenes .scene`, `.purelane-scenes .bub span`,
  `.purelane-scenes .vig`. Any future empty decorative element needs an
  explicit `display`.
- 2026-08-14 — Global `body` reset in `purelane.css` (font Inter, line-height
  1.62, letter-spacing normal) overrides Dawn's Assistant/1.8/0.06rem so text
  wraps identically to the prototype. This is page-wide, so it also affects
  the Dawn header/footer fonts.
- 2026-08-14 — `.purelane-combo__inc` keeps `flex: 1`; its box is ~11px taller
  than the prototype's `.inc` because the card stretches it — a flex stretch,
  not a text-wrap difference (verified identical 3-line wrap via range
  measurement).
- 2026-08-14 — Bundle tier cards prefer the tier product's `featured_image`
  (the merchant-uploaded bundle pack shots) over the block's decorative
  `image_picker`; the leaf-icon is now only a last fallback. The tier pix
  frame uses `object-fit: contain` with the `<img>` absolutely positioned
  (`.purelane-tier__pix img { position:absolute; inset:0 }`) so the
  landscape bundle artwork fits fully inside the fixed 118px frame — a plain
  `height:100%` in a `display:grid` container was being sized to the image's
  intrinsic aspect ratio and cropped top/bottom.

