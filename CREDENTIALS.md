# Purelane — Dev store credentials

Everything a merchant/reviewer needs to open the store and preview the
"Purelane Clean v1" theme.

## Store

| Item | Value |
| --- | --- |
| Store URL | `https://purelane-dev-csw5qplv.myshopify.com` |
| Store name | purelane-dev |
| Storefront password | `aflowr` (Settings → Preferences → Storefront password) |
| Admin | `https://purelane-dev-csw5qplv.myshopify.com/admin` |
| Store plan | Developer (dev) store — no custom domain, no checkout in this plan |

The storefront is password-protected. Any visitor opening the store URL sees
the password page; entering `aflowr` unlocks it for that browser session.

## Theme previews

The two custom themes are **not** published as the live storefront (the live
theme is the stock "Horizon"). Open the preview links below with the
storefront password already entered, or open them from the Admin Themes page
where Shopify grants access automatically.

| Theme | Preview URL |
| --- | --- |
| Purelane Clean v1 (#161762803953) | `https://purelane-dev-csw5qplv.myshopify.com/?preview_theme_id=161762803953` |
| Development (#161735213297) | `https://purelane-dev-csw5qplv.myshopify.com/?preview_theme_id=161735213297` |

Admin Themes page: `https://purelane-dev-csw5qplv.myshopify.com/admin/themes`
— "Purelane Clean v1" appears as an unpublished theme; "Development (…)" is
hidden from that list (dev-role theme).

## To make it live

If the client wants this on a production store: publish "Purelane Clean v1"
on a real store (Actions → Publish) and, if desired, enable checkout on that
plan. The theme itself needs no further code changes.
