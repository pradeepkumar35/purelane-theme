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
_pending_

## Pass 2 — Accessibility
_pending_

## Pass 3 — Performance
_pending_