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

**"Purelane Clean v1" (#161762803953) is now the LIVE theme** — published via
`shopify theme push --theme 161762803953 --allow-live` (role: live). The
storefront URL serves it directly (behind the storefront password).

The older "Development" theme (#161735213297) is kept as a rollback/staging
copy. Open the preview links below with the storefront password already
entered, or open them from the Admin Themes page where Shopify grants access
automatically.

| Theme | Preview URL |
| --- | --- |
| Purelane Clean v1 (#161762803953) — **LIVE** | `https://purelane-dev-csw5qplv.myshopify.com` (enter `aflowr` on the password page) |
| Development (#161735213297) — staging/rollback | `https://purelane-dev-csw5qplv.myshopify.com/?preview_theme_id=161735213297` |

Admin Themes page: `https://purelane-dev-csw5qplv.myshopify.com/admin/themes`
— "Purelane Clean v1" is published (live); "Development (…)" is a dev-role
theme hidden from that list.

## To make it live

Already done — "Purelane Clean v1" is the published live theme. If the client
moves this to a production store: publish on the real store (Actions →
Publish) and, if desired, enable checkout on that plan. The theme itself
needs no further code changes.
