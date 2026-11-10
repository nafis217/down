# Cute Store theme (Dawn 15.4 + `cs-` layer)

Light, pastel, animation-rich single-product store. Everything is editable in the Shopify theme editor.
Store name is not decided yet: set it in Settings > General and upload a logo in Theme settings > Logo.

## Preview / deploy
```
shopify theme dev      # live preview with hot reload (log in to your store first)
shopify theme check    # lint (0 errors; remaining warnings are Dawn's own + the Google Fonts link)
shopify theme push     # upload (use --unpublished first)
```

## Tokens (Theme settings > Cute Store)
| Token | Default | Notes |
|---|---|---|
| `--cs-bg` | #FFFDF9 | page background |
| `--cs-surface` | #FFF4F0 | blush sections/cards |
| `--cs-pink` / `--cs-blue` / `--cs-mint` | #FFB7C5 / #BDE0FE / #CDEAC0 | accents, blobs, badges |
| `--cs-text` | #3B3355 | 11.5:1 on bg |
| `--cs-cta` / hover | #8FCFA3 / #79BF90 | soft sage green buttons with black text (11.6:1, AA) |
| `--cs-radius` | 24px | slider 12-32 |
| Fonts | Fredoka + DM Sans | Fredoka/Nunito, DM Sans/Inter, loaded with `display=swap` |

Files: `cs-base.css` (global), `cs-header.css` (header, popup, cart drawer extras), `cs-hero.css`, `cs-sections.css` (homepage sections), `cs-product.css`; JS: `cs-motion.js` (reveals, carousel, video, tilt, fly-to-cart, upsell, exit popup), `cs-product.js` (bundles, sticky bar).

## Sections (add/reorder in the editor)
Homepage `templates/index.json` order: CS Hero, Trust marquee, Social proof strip, Demo video, Why you'll love it, How it works, Comparison table, Customer photos, Reviews carousel, Offer bundles, Guarantee, FAQ, Final CTA. The announcement bar (rotating, 3 messages), sticky header and footer use Dawn's sections, restyled.
Product page: gallery (swipe, thumbnails, tap-to-zoom), title, rating, price, CS Save % pill, benefit bullets, pill variants, CS Quantity bundles, buy buttons with dynamic checkout, CS Delivery & returns, CS Trust badges, accordions, CS Reviews, related products ("You may also like"), CS Sticky add to cart (mobile).
Each section has text, link and colour-free settings; blocks add/remove items (cards, steps, FAQ, reviews, rows).

## Setup checklist
1. Settings > General: store name. Theme settings: logo, favicon, check Cute Store group.
2. **Markets** (Settings > Markets): create Philippines (PHP) first, then United States (USD) and Canada (CAD). Turn on Shopify Payments / local payment methods (e.g. GCash, Maya, COD via a provider you enable) per market. Add the country selector (already on in header/footer).
3. **Shipping**: set real rates per market. State only delivery windows you have confirmed with your supplier; the placeholders read `[X–Y days]` on purpose. Set the free-shipping goal in Theme settings > Cute Store > Cart drawer so it matches a real rate.
4. **Bundle prices are display only.** Create an automatic discount (Discounts > Automatic > Buy X get Y / quantity break, or "Amount off products" with minimum quantity) for 2 and 3 units that matches the percentages in the bundle block. Otherwise customers see a price that checkout will not honour.
5. Menus: Navigation > main-menu (keep it to 3-4 items) and footer menu. Policies: Settings > Policies (refund, shipping, privacy, terms).
6. Checkout: Settings > Checkout: enable Shop Pay / Apple Pay / Google Pay, set contact to email or phone only, hide optional fields (company, address line 2).
7. Product: upload lifestyle photos, one short looping video, 3 close-ups; fill compare-at price; add the product to the product template blocks as needed.
8. Replace every placeholder below, then turn the exit popup on only if you have a real offer.

## Apps still needed (prefer free tiers)
- **Reviews**: Judge.me (free) or Shopify's Product Reviews; the theme reads `product.metafields.reviews.rating` for the stars. Use the CS Reviews section only with real reviews.
- **Bundles / upsell** (optional): the built-in bundle block + an automatic discount covers launch. Apps like Frequently Bought Together only if you want per-variant bundles.
- **Email**: Shopify Email (free tier) for the newsletter and exit popup list.
- **Image/video compression**: Squoosh (free) before upload; no app required.

## Placeholders you must replace
There are no `[PLACEHOLDER]` strings left in the theme. Sections hide themselves when content is missing. Things only you can supply:
- Hero: subheadline, product image, note under button, star rating and "loved by" line (left empty = hidden; use real numbers only), 3 stickers.
- Announcement bar: 3 messages. Marquee: 3 messages.
- Social proof strip: logos/thumbnails (only genuine press or UGC; delete the section otherwise).
- Demo video + poster. Benefits (3), steps (3), comparison rows (4) and column names.
- Customer photos (4) and reviews (3 on home, 3 on product): paste real reviews only, tick "Verified buyer" only when true; review summary rating/count.
- Offer bundles discounts, product-page bundle labels/discounts, delivery and returns text, trust badges, benefit bullets, "Shipping & returns" tab, product description.
- Guarantee items, FAQ answers, final CTA text.
- Footer contact text and links; exit popup text; cart free-shipping goal; upsell product.

## Performance notes
Hero image is eager with `fetchpriority=high` and `srcset`; all other images/videos are lazy; video is `preload=none` and only plays when visible; motion uses transform/opacity only; fonts use `display=swap` and a non-blocking stylesheet; `prefers-reduced-motion` disables animation. Run Lighthouse (mobile) on a real preview URL and check LCP/CLS after adding your media; no measurements have been taken yet.

## Store structure (launch version)
A general store for trending products (gadgets, chargers and fans, light bulbs, room decor, and more).
Header menu (built into the Header section, 6 items): **Shop All, Trending, New Arrivals, Categories (Gadgets & Tech, Lights & Room Decor, Home & Living), Deals, Track Order.**
Footer: Shop (Shop All, Trending Now, New Arrivals, Deals) and Help (Track Order, Shipping Info, Returns & Refunds, FAQ, Privacy Policy, Terms of Service).

Collections are driven by **product tags**, so one product can appear in several places and a new product type never needs theme changes. Create these as Automated collections (Products > Collections). The menu and homepage rows find them by handle and fall back to all products until they exist.

| Handle | Rule (any of) |
|---|---|
| `trending-now` | Tag is `trending` |
| `new-arrivals` | Tag is `new` (remove the tag when it is no longer new) |
| `deals` | Compare-at price is greater than 0 |
| `gadgets-tech` | Tag is `gadgets` or `tech` or `charger` |
| `lights-decor` | Tag is `lights` or `decor` or `led` |
| `home-living` | Tag is `home` or `organizer` or `kitchen` |

Adding a new category later: create the collection, then in the theme editor open the Header and add a "Dropdown item" under Categories (and a category chip on the homepage).
Add later, when there is real data: Best Sellers (needs real sales).
