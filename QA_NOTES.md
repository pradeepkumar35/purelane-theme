# Purelane QA Notes

QA hardening pass on `purelane-dev-csw5qplv` theme 161735213297, branch `qa-hardening-pass`.

Format: `section | test | result | fix applied (if any) | commit hash`

## Pass 1 — Theme editor survivability

Verified via code review + headless-DOM stress template (duplicated sections, empty blocks, 15-block
reviews) served through the local dev server (`http://127.0.0.1:9293`), then restored the production
`templates/index.json`. The interactive Shopify admin UI cannot be driven headlessly, so the same
DOM states the editor produces (duplicate, delete-all-blocks, 15 blocks, `shopify:section:load`)
were recreated and probed directly.

| section | test | result | fix applied (if any) | commit hash |
| --- | --- | --- | --- | --- |
| Hero (`purelane-hero`) | Fresh add renders from presets (3 slides + 3 promises) | PASS | — | — |
| Hero | Duplicate section: both instances init independently (`data-initialized`, own `data-section-id`) | PASS | — | — |
| Hero | Duplicate section: each cycles its own slides/dots (observed 0→1→2 on instance A) | PASS | — | — |
| Hero | Duplicate via `shopify:section:load` event → re-init with new id | PASS | — | — |
| Hero | All blocks deleted (0 slides/0 dots) | PASS — `initHero` early-returns on empty slides/dots, no errors | — | — |
| Hero | `shopify:section:unload` clears its own timer (matched by `data-section-id`) | PASS (code review) | — | — |
| Bundles (`purelane-bundles`) | Duplicate section: tier button opens the duplicated section's OWN picker (`pickers[sectionId]`) | PASS | — | — |
| Bundles | Two pickers on page keyed by distinct `data-section-id` | PASS | — | — |
| Combos (`purelane-combos`) | Combo CTA opens the picker pre-filled with that combo's products | PASS | — | — |
| Combos | All 4 combo blocks render with correct `data-preselect` product lists | PASS | — | — |
| Combos | Zero blocks (delete all) | PASS — rail renders empty, no JS errors | — | — |
| Reviews (`purelane-reviews`) | 15 review blocks → 30 cards in track (2× for seamless marquee loop) | PASS | — | — |
| Reviews | Zero blocks → fallback single review card | PASS | — | — |
| Shop (`purelane-shop`) | Duplicate + collection-driven grid renders 9 cards (bundle products excluded) | PASS | — | — |
| Reveal (`purelane-reveal.js`) | All `.rv` elements gain `.in` when scrolled into view | PASS | — | — |
| Reveal | `shopify:section:reorder` re-inits reveal for new section | PASS | — | — |
| All | No console errors / uncaught exceptions in any stress scenario | PASS | — | — |
| All | `html { scroll-behavior: smooth }` at `purelane.css:3485` — anchor nav OK; IO probes show all `.rv` reveal with instant scroll | PASS | — | — |

### Pass 1 notes (no fix required)
- Combos CTA resolves the picker via `Object.values(pickers)[0]` (first picker on page). With a single
  Bundles section this is correct; if a merchant duplicates Bundles, combos will keep opening the first
  picker instance. Intended for the current 1:1 layout — no change.
- Section `id` attributes (`reviews`, `combos`, `bundles`, `shop`) are static strings. Duplicating the
  section duplicates the DOM id, which is harmless for current functionality (nav/reveal use the first
  match). Editor always generates unique section ids, so JS scoping is unaffected.
- Reviews marquee duplicates cards into the track; with a very large block count the track is wider but
  the `-50%` loop remains seamless. No practical limit hit at 15 blocks.

## Pass 4 — Edge-case products

Verified against live store data (12 products in the `shop` collection: 9 individual + 3 bundle products).

| section | test | result | fix applied (if any) | commit hash |
| --- | --- | --- | --- | --- |
| Shop grid | Sold-out product ("Multi-Surface Disinfectant") | PASS — disabled CTA, no form rendered | — | — |
| Shop grid | Product with no featured image ("Dishwash Gel") | PASS — SVG no-image placeholder | — | — |
| Shop grid | Very long title (124 chars) | PASS — clamps to 2 lines (`-webkit-line-clamp`) | — | — |
| Shop grid | Multi-variant product | PASS — form with hidden variant id | — | — |
| Shop grid | Bundle products excluded from grid | PASS | — | — |
| Bundle picker | Sold-out / no-image / long title pool items | PASS — SVG placeholder + 2-line clamp | — | — |
| Bundle picker | **Bundle products present in pool** | FAIL — "Purelane Bundle - Starter/Most Popular/Whole Home" were selectable as individual picks (picker iterated full collection without the `purelane-bundle` tag filter the grid applies) | Added `{% if product.tags contains 'purelane-bundle' %}{% continue %}{% endif %}` to `snippets/purelane-bundle-picker.liquid` pool loop; picker now lists 9 individual products | — |
| Bundle picker | Empty pool (all products removed) | PASS — grid empty, submit stays disabled, no JS error | — | — |
| Combos | Product with image vs no image in stack | PASS — image renders / tile fallback | — | — |
| Combos | Long benefit labels | PASS | — | — |
| Hero | Long product titles in slides | PASS | — | — |

_commit for the picker fix: `184811b`_

## Pass 2 — Accessibility

| section | test | result | fix applied (if any) | commit hash |
| --- | --- | --- | --- | --- |
| Hero | Keyboard focus enters hidden slides | FAIL — `aria-hidden` alone doesn't remove links from tab order; real Tab landed in `aria-hidden="true"` slides | Added `inert` attribute to inactive slides in `sections/purelane-hero.liquid` + toggled `inert`/`aria-hidden` in `purelane-hero.js` `showSlide` | — |
| Hero | ARIA tabs pattern | PARTIAL — dots `role=tab` but slides had no `role=tabpanel` | Slides now `role=tabpanel` with `aria-label` on active, dots carry `aria-controls` | same |
| Picker | Focus trap inside dialog | FAIL — Tab could escape the modal | Added `trapFocus()` Tab/Shift+Tab cycle in `purelane-bundle-picker.js` | same |
| Picker | Focus restore on close | FAIL — focus stayed wherever it was | `open()` stores `lastFocused`, `close()` restores it | same |
| All images | Alt text present | PASS — 53 images, 0 missing/empty alt | — | — |
| All buttons | Accessible name | PASS — no unnamed buttons | — | — |
| Hero | Single `h1`, subsequent headings | PASS — one `h1`; section heading levels vary (h2/h3/h4/h5) matching prototype | — | — |
| Marquee | `prefers-reduced-motion: reduce` | PASS — animation disabled at `purelane.css:1869` | — | — |
| Hero JS | Auto-advance under reduced motion | PASS — `start()` early-returns | — | — |

_commit for accessibility fixes: `e530b83`_

## Pass 3 — Performance

| section | test | result | fix applied (if any) | commit hash |
| --- | --- | --- | --- | --- |
| Hero | LCP image loading | FAIL — hero product images (LCP element, above the fold) were `loading="lazy"`, delaying LCP | First hero slide's product images now `loading="eager"` + `fetchpriority="high"`; remaining slides stay lazy (`sections/purelane-hero.liquid`) | — |
| All images | `loading` strategy | PASS — all non-hero images remain lazy | — | — |
| All images | `fetchpriority` | FAIL — no image prioritized | `high` set on first hero slide only | same |
| Assets | JS weight | PASS — purelane JS is small (~8KB picker, hero/reveal/scenes minimal) | — | — |
| Assets | CSS weight | PASS — purelane.css ~79KB, loaded via section stylesheet tags | — | — |
| Scenes | `requestAnimationFrame`-gated scroll/mousemove | PASS — no unthrottled scroll handlers; `prefers-reduced-motion` disables parallax | — | — |
| LCP/CLS/TBT | Headless paint metrics | NOT MEASURED — LCP/CLS observers returned no entries in headless; verified loading strategy statically instead | — | — |
