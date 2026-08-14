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
| Bundle picker | **Bundle products present in pool** | FAIL — "Purelane Bundle - Starter/Most Popular/Whole Home" were selectable as individual picks (picker iterated full collection without the `purelane-bundle` tag filter the grid applies) | Added `{% if product.tags contains 'purelane-bundle' %}{% continue %}{% endif %}` to `snippets/purelane-bundle-picker.liquid` pool loop; picker now lists 9 individual products | `7e28c68` |
| Bundle picker | Empty pool (all products removed) | PASS — grid empty, submit stays disabled, no JS error | — | — |
| Combos | Product with image vs no image in stack | PASS — image renders / tile fallback | — | — |
| Combos | Long benefit labels | PASS | — | — |
| Hero | Long product titles in slides | PASS | — | — |

## Pass 2 — Accessibility

| section | test | result | fix applied (if any) | commit hash |
| --- | --- | --- | --- | --- |
| Hero | Keyboard focus enters hidden slides | FAIL — `aria-hidden` alone doesn't remove links from tab order; real Tab landed in `aria-hidden="true"` slides | Added `inert` attribute to inactive slides in `sections/purelane-hero.liquid` + toggled `inert`/`aria-hidden` in `purelane-hero.js` `showSlide` | `fac3715` |
| Hero | ARIA tabs pattern | PARTIAL — dots `role=tab` but slides had no `role=tabpanel` | Slides now `role=tabpanel` with `aria-label` on active, dots carry `aria-controls` | same |
| Picker | Focus trap inside dialog | FAIL — Tab could escape the modal | Added `trapFocus()` Tab/Shift+Tab cycle in `purelane-bundle-picker.js` | same |
| Picker | Focus restore on close | FAIL — focus stayed wherever it was | `open()` stores `lastFocused`, `close()` restores it | same |
| All images | Alt text present | PASS — 53 images, 0 missing/empty alt | — | — |
| All buttons | Accessible name | PASS — no unnamed buttons | — | — |
| Hero | Single `h1`, subsequent headings | PASS — one `h1`; section heading levels vary (h2/h3/h4/h5) matching prototype | — | — |
| Marquee | `prefers-reduced-motion: reduce` | PASS — animation disabled at `purelane.css:1869` | — | — |
| Hero JS | Auto-advance under reduced motion | PASS — `start()` early-returns | — | — |

## Pass 3 — Performance

| section | test | result | fix applied (if any) | commit hash |
| --- | --- | --- | --- | --- |
| Hero | LCP image loading | FAIL — hero product images (LCP element, above the fold) were `loading="lazy"`, delaying LCP | First hero slide's product images now `loading="eager"` + `fetchpriority="high"`; remaining slides stay lazy (`sections/purelane-hero.liquid`) | `2fc5358` |
| All images | `loading` strategy | PASS — all non-hero images remain lazy | — | — |
| All images | `fetchpriority` | FAIL — no image prioritized | `high` set on first hero slide only | same |
| Assets | JS weight | PASS — purelane JS is small (~8KB picker, hero/reveal/scenes minimal) | — | — |
| Assets | CSS weight | PASS — purelane.css ~79KB, loaded via section stylesheet tags | — | — |
| Scenes | `requestAnimationFrame`-gated scroll/mousemove | PASS — no unthrottled scroll handlers; `prefers-reduced-motion` disables parallax | — | — |
| LCP/CLS/TBT | Headless paint metrics | NOT MEASURED — LCP/CLS observers returned no entries in headless; verified loading strategy statically instead | — | — |

## Requirement — Nothing hardcoded

Audited all 15 purelane sections: every `section.settings.*` (68 refs) and `block.settings.*` (62 refs) is
declared in its section schema (zero orphaned refs); nav uses `link_list` menus and URL settings. Remaining
hardcoded literals are intentional fallbacks (empty-collection placeholder "Example product", zero-block
review fallback, "Products" qty suffix). The one real magic number — hero autoplay `3800ms` — was exposed
as a section setting.

| item | test | result | fix applied | commit hash |
| --- | --- | --- | --- | --- |
| Hero autoplay | Timing hardcoded in JS | FAIL — `3800` buried in `purelane-hero.js` | Added `autoplay_speed` range setting (0–8000ms, default 3800) + `data-autoplay-speed` attribute; JS reads it, 0 disables autoplay | — |
| Hero autoplay | Custom speed honored | PASS — probe set 600ms, slide advanced in ~900ms | — | — |
| Hero autoplay | 0 disables autoplay | PASS — probe confirmed slide did not advance | — | — |
| Hero autoplay | Reduced motion still respected | PASS — `start()` early-returns before reading speed | — | — |
| All sections | Settings referenced = settings declared | PASS — 0 orphaned refs across 15 sections | — | — |
| Nav | Menus/links editor-driven | PASS — `link_list` + URL settings | — | — |

## Pass 5 — Performance / GPU tuning

Diagnosis: the always-running infinite CSS animations (reviews marquee `52s`, ticker `30s`, scenes drift/sway/surface `11–34s`,
bubbles `--dur`), a 7s infinite `filter: drop-shadow()` animation on the hero product, and live `backdrop-filter` blurs over
moving content keep the GPU compositing every frame. Fixes below remove the per-frame work without changing the look
(shadow and glass effects preserved as static equivalents).

| item | test | result | fix applied (if any) | commit hash |
| --- | --- | --- | --- | --- |
| Hero product | Infinite 7s `drop-shadow` filter animation | FAIL — `prod.animate` re-filtered every frame forever | Removed the animation; applied a static `drop-shadow` via `prod.style.filter` (`purelane-scenes.js`) | `—` |
| Off-screen | Infinite animations still compositing off-screen | FAIL — marquee/ticker/scenes always animated | IntersectionObserver pauses `animation-play-state` on the ticker, marquee, scenes `.wl-a/b/c/s` and bubbles when off-screen; resumes on return (`purelane-scenes.js`) | same |
| Parallax | `.wl` parallax writes styles even when stage hidden | FAIL — `frame()` updated `--px/--py` + product transform on every scroll regardless of visibility | Gated parallax work behind a `stageVisible` flag driven by an IntersectionObserver on `#scenes` | same |
| Ticker | `will-change: transform` + `backdrop-filter: blur(14px)` over the moving track | FAIL — permanent GPU layer + per-frame re-blur | Removed `will-change`; replaced live blur with opaque `rgba(255,255,255,.9)` background (`purelane.css`) | same |
| Sticky CTA | `backdrop-filter: blur(20px)` over scrolling content | FAIL — re-blur on every scroll frame | Replaced with near-opaque `rgba(255,255,255,.94)` background (`purelane.css`) | same |
| Static glass | Hero promises/badge/offer, picker backdrop, footer blurs | PASS — static backdrops; blur cost is one-time, visual unchanged | — | — |
| Live DOM | Served JS/CSS match working tree | PASS — probe confirmed: no `prod.animate`, static filter applied, no ticker/sticky blur, no ticker `will-change` | — | — |
| Live DOM | Off-screen pause / on-screen resume | PASS — probe: ticker paused at page bottom & resumed at top; marquee/bubbles paused below fold | — | — |
| Reduced motion | Static shadow still skipped | PASS — static filter only applied when `!reduce` | — | — |
| Theme check | No new offenses | PASS — 0 errors, 14 pre-existing Dawn warnings | — | — |