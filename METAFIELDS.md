# Purelane Metafields

Product metafields in the `purelane` namespace. Consumed by
`snippets/purelane-product-card.liquid`, which is rendered by the Shop
section (`sections/purelane-shop.liquid`).

> Update (login/signup reskin pass): **no new metafield or metaobject was
> created** for the customer login/register work. The reskin only added
> `brand_name` / `brand_tagline` as plain *section settings* (text fields in
> the `main-login`/`main-register` schemas), not metafields. Everything else
> reuses `shop.name`, locale strings, and existing CSS tokens.

> Scope: these are the ONLY custom metafield/metaobject definitions created
> for this build. There are **no metaobjects** — combos and bundle tiers are
> real products (tagged `purelane-bundle`, `tier-N`, `product_type: Purelane
> Bundle`), not metaobject records, so nothing else needs defining in the
> Admin.

## Definitions

| Key | Type | Description | Consumers |
| --- | --- | --- | --- |
| `purelane.rating` | `number_decimal` | Average product rating (e.g. 4.8). | Shop section product cards (star row) |
| `purelane.rating_count` | `number_integer` | Number of customer reviews. | Shop section product cards (review count) |
| `purelane.badge` | `single_line_text_field` | Short badge label, e.g. "Best seller", "Top rated", "New". | Shop section product cards (pill badge) |

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
- Shop section (`sections/purelane-shop.liquid`) — the only section that
  renders `purelane-product-card`. (Combos and the bundle picker use their own
  card markup and product settings, not these metafields.)
