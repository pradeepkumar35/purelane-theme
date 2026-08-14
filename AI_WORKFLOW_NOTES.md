# AI Workflow Notes

How this theme was built with an AI coding agent, what the agent got wrong,
and what to systematize before doing 20 more of these.

## 1. What was delegated to the agent

The whole build was agent-driven: taking `purelane-homepage.html` (a static
151KB prototype with 1717 lines) and producing a working Shopify Dawn theme.
The agent did the mapping, the code, and the verification:

- **Section mapping**: every prototype block → a semantic Shopify section
  (hero, reviews, ingredients, how, proof, combos, bundles, shop, range,
  why-bundles, categories, trust, signup) + header/footer groups.
- **Data modeling**: decided which hardcoded prototype values become real
  store data (products, collections, metafields) vs. merchant settings.
- **Implementation**: wrote all sections/snippets/assets; replaced the Dawn
  header/footer groups; wired global layout (`layout/theme.liquid`,
  `templates/index.json`).
- **Verification**: headless-Chrome probes at 375/768/1024/1440, computed-
  style audits, composite-pixel captures, `shopify theme check`, and a QA
  pass-by-pass report (`QA_NOTES.md`).
- **Deployment**: `shopify theme push` to a dev theme, then to an
  unpublished "Purelane Clean v1" theme for merchant review.

The human (user) did the judgment calls the agent flagged: signing off on
deviations, choosing where to publish, deciding repo scope. The agent never
made a "this is wrong but I'll just change it" call silently — every such
decision is logged below in §2 and in the deviation log in §4.

## 2. Where the agent got it wrong (and how it was corrected)

Each of these was a real miss during the build, caught by the human or by a
later QA pass. They're the strongest evidence for the rules in §3.

### Bug: duplicate heading on #ingredients
- **What**: the section rendered BOTH a kicker span ("Sourced from nature")
  and the `.d2` heading. The kicker was the schema *default*, not set in the
  template, so the section always doubled its heading.
- **Fix**: removed the `kicker` setting entirely (not blanked) so a heading
  can't silently reappear if the section is re-added in the editor.

### Bug: rail "active dot" always stuck on Reviews
- **What**: `syncRail` used `t.el.offsetTop`, which returned `0` for almost
  every section (offsetParent quirk), so the "first link <= mid" logic always
  picked the last dot (Reviews).
- **Fix**: switched to document-absolute position
  (`getBoundingClientRect().top + y`); also renamed the reviews section from
  `id="voices"` to `id="reviews"` to match the prototype's real anchor.
- **Lesson**: never trust `offsetTop` in scroll-spy; the DOM API contract is
  `getBoundingClientRect()`.

### Bug: background painted lavender instead of the prototype's lime-green
- **What**: Dawn's `base.css` hides empty elements (`a:empty, div:empty, … {
  display: none }`), so the empty gradient `.scene` divs of the fixed
  background layer were never painted. Computed-style audits read `opacity:1`
  + background strings and missed it; only real composite-pixel capture
  showed `[240,235,250]` lavender vs the prototype's `[235,249,238]` mint.
- **Fix**: explicit `display: block` on the empty `.scene`, `.bub span`, and
  `.vig` elements.
- **Lesson**: computed-style checks are necessary but not sufficient — verify
  paint, not just computed values.

### Bug: hero product images tinted green with a box above the bottle
- **What**: the earlier `mix-blend-mode: multiply` decision (made on
  computed values) looked right in style audits but the real opaque studio
  PNGs multiplied over the green anchor gradient → mint tint + gradient box
  extending above the product.
- **Fix**: REVERSED it (anchor transparent, blend removed). Pixel capture,
  not style strings, drove the correction.

### Bug: fonts silently falling back to system-ui
- **What**: the CSS hardcodes "Outfit"/"Inter" but nothing ever loaded them;
  Dawn's own font setting was Assistant. `document.fonts.check('12px Inter')`
  returned true via a system-fallback false positive, hiding the problem.
- **Fix**: added the prototype's exact Google Fonts link in
  `layout/theme.liquid`. Verified by measuring glyph widths, not just
  `fonts.check`.

### Bug: `will-change` + infinite filter animation burned GPU (Pass 5)
- **What**: the hero product ran a 7s infinite `filter: drop-shadow()`
  animation via the Web Animations API, and `will-change: transform` on the
  ticker track held permanent GPU layers — both compositing every frame even
  off-screen.
- **Fix**: static drop-shadow instead of the animation; IntersectionObserver
  pause/resume for off-screen marquees/ticker/bubbles; `will-change` removed
  on the ticker track; live `backdrop-filter` on the ticker/sticky CTA
  replaced with opaque backgrounds.
- **Lesson**: infinite CSS/WAAPI animations are a recurring perf trap; gate
  them off-screen and prefer static equivalents when the look doesn't move.

### Process miss: parallel edits to one file lost silently
- **What**: three simultaneous edits to `templates/index.json` raced and two
  were silently dropped; only the headless verification caught the missing
  blocks.
- **Fix**: re-applied sequentially, re-verified. Rule: **no concurrent edits
  to the same file**.

## 3. What to systematize for the next 20 projects

- **Always diff against the prototype file explicitly before marking a
  section done.** The agent's natural tendency was to "port the intent" and
  skip a strict diff; that's exactly how the duplicate heading, the rainbow
  of a wrong heading level, and the missing kicker slipped through. A
  section is only *done* when its rendered output is diffed (text, classes,
  computed layout) against the prototype block-by-block.
- **Verify paint, not just computed style.** Add a composite-pixel capture
  step to every visual QA. Style-string audits gave false confidence on the
  scenes background and the hero blend.
- **No concurrent edits to the same file.** Serialize file mutations; treat
  the last write as authoritative.
- **Probe live DOM, not just static files.** The served asset must be
  diffed against the working tree (dev-server caching hid mismatches). See
  the Pass 5 probe pattern: fetch the served JS/CSS and assert on it.
- **Measure real glyphs.** `document.fonts.check()` has a fallback false
  positive; assert on measured text widths or `document.fonts.load()` +
  `document.fonts.ready`.
- **Log every judgment call with a one-line reason.** The deviation log
  (§4) is what let the human sign off fast instead of re-auditing.
- **A fixed QA checklist per theme** (a11y → perf → editor-survivability →
  no-hardcoded-values) run by an automated probe, as in `QA_NOTES.md`.
- **One theme-build per repo, no force-pushes after publish.** History is
  clean and reviewable because the repo is small and self-contained.

## 4. Deviation log (production decisions that diverge from the prototype)

One-line log of every deliberate deviation, so nothing is "lost in
translation" between the static HTML and the live theme.

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
  (`#ingredients`, `#how`, `#proof`, `#shop`, `#bundles`, `#reviews`,
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
- 2026-08-14 — Hero slide entrance order: the three-product slide animates
  left → right → middle (delays scoped by `.products-count-N` so the
  two-product slide keeps left → right): `.products-count-3` delays are
  nth-child(1)=0.06s, (2)=0.54s, (3)=0.3s, matching the prototype's
  `.hp.d1/.d2/.d3`.
- 2026-08-14 — Hero offer pill now has per-slide `offer_price` /
  `offer_compare` / `offer_save` settings so the "Any 2 / Any 3 products"
  slides show the flat bundle prices (₹349/₹598/Save ₹249 and
  ₹499/₹897/Save ₹398) instead of the first product's own price. Falls back
  to product-derived price when blank (slide 1 keeps its product price).
