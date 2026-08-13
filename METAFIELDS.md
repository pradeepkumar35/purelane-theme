# Purelane Metafields

Product metafields in the `purelane` namespace. Consumed by
`snippets/purelane-product-card.liquid` (and reused by the Shop, Combos and
Bundle-picker sections).

## Definitions

| Key           | Type                | Description                     |
| ------------- | ------------------- | ------------------------------- |
| `purelane.rating`       | `number_decimal` | Average product rating (e.g. 4.8). |
| `purelane.rating_count` | `number_integer` | Number of customer reviews.     |
| `purelane.badge`        | `single_line_text_field` | Short badge label, e.g. "Best seller", "Top rated", "New". |

Notes:

- The earlier `purelane.rating_value` definition was created as
  `number_integer` in error; it was deleted and replaced with
  `purelane.rating` (`number_decimal`) so fractional ratings (4.8) persist.
- Definitions were created via the Admin GraphQL API
  (`metafieldDefinitionCreate`). The REST `metafield_definitions` endpoint is
  not available on this plan.
- `purelane.badge` stays unset on products without a badge; the card snippet
  renders nothing in that case. No "empty" badge is shown.

## Current values (all 9 products)

| Handle | rating | rating_count | badge |
| ------ | ------ | ------------ | ----- |
| copper-bronze-brass-cleaner | 4.8 | 231 | Top rated |
| dishwash-gel-aloe-clean | 4.8 | 198 | Best seller |
| kitchen-degreaser-lemon-enzyme | 4.8 | 254 | Best seller |
| laundry-detergent-lavender-calm | 4.8 | 342 | Top rated |
| multi-surface-disinfectant-herbal-shield | 4.7 | 128 | New |
| plant-based-floor-cleaner-citrus-neem | 4.8 | 276 | Best seller |
| tap-limescale-cleaner | 4.8 | 237 | Best seller |
| toilet-cleaner-deep-clean-herbal | 4.7 | 189 | Top rated |
| ultra-concentrated-plant-based-multi-surface-cleaning-solution-with-lavender-extract-and-sustainable-refill-packaging-system | 4.6 | 64 | New |

rating / rating_count for tap, kitchen and copper are taken verbatim from the
prototype's #shop cards; the rest are plausible values consistent with those.

## Consumers

- `snippets/purelane-product-card.liquid` — reads all three; renders the star
  row, review count, and pill badge.
- Shop section: collection grid over the product cards.
- Bundle picker / Combos: product cards (compact variant).
