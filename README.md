# Coff Circle website

Static site for `https://coffcircle.com`. Plain HTML, CSS and JS, with no build
step. It is served by Cloudflare Pages.

## Name

- In text, the product is always **Coff Circle**: titles, descriptions, copy,
  the footer © line.
- **coff.** (lowercase, with the dot) is the wordmark. It appears only as the
  logo: the app icon, the header icon and images. Never put it in a sentence.
- Legal pages (`privacy`, `terms`, `kvkk`) define "Coff" as a short term in
  their own text. Change that wording only with a legal review.

## Routes

Every Turkish page has an English twin under `/en/`.

| Turkish | English | Notes |
| --- | --- | --- |
| `/` | `/en/` | Home |
| `/investors/` | `/en/investors/` | |
| `/support/` | `/en/support/` | App Store support URL |
| `/privacy/` | `/en/privacy/` | App Store / Play privacy URL |
| `/terms/` | `/en/terms/` | Current terms |
| `/terms/2026-09-12/` | `/en/terms/2026-09-12/` | Archived version. Never edit its text. |
| `/kvkk/` | `/en/kvkk/` | KVKK notice |
| `/delete-account/` | `/en/delete-account/` | Play account deletion URL |
| `/child-safety/` | `/en/child-safety/` | Play CSAE declaration |

App-flow pages that mail links open: `/verify-email/`, `/reset-password/` and
`/email-verified/`. Each is one file for both languages. English copy sits in
`data-en*` attributes, and `assets/i18n.js` swaps it in when the URL has
`?lang=en`.

Other files: `404.html`, `sitemap.xml`, `robots.txt`, `_headers` (security
headers and caching), `_redirects` (QR short links, see below), and
`.well-known/` (iOS universal links and Android app links).

## Files

```
assets/
  css/  base.css        tokens (the brand palette), reset, type, buttons, header, footer, shared panels
        home.css        home page: scroll tour, the HTML phone, app-card demos, feature cards, premium, safety, FAQ, launch card
        investors.css   investor page
        pages.css       legal, support, account and app-flow pages
        verify-email.css, reset-password.css, email-verified.css   one app-flow page each
  js/   site.js         every page: reveal, header line, mobile nav, FAQ motion, scrollspy, footer year
        home.js         home page: /indir hand-off, panel parallax, scroll tour
        i18n.js         ?lang=en swap on the app-flow pages
        verify-email.js, reset-password.js, email-verified.js
  img/  images, favicons and link previews (old /assets/<image> URLs 301 here)
  fonts/ Nunito, used only by the og image renderer
```

Every page loads `base.css` plus its group's file (`home`, `investors` or
`pages`), and `site.js`; the home pages add `home.js`.

## Header and footer

Every page carries the same header and footer. They are generated from
`tools/website/sync-chrome.mjs` (at the monorepo root). Do not hand-edit them
in one page:

```sh
node tools/website/sync-chrome.mjs           # rewrite every page
node tools/website/sync-chrome.mjs --check   # exit 1 if a page is out of sync
```

To change a menu item or a footer link, edit the templates in that script and
run it.

## Rules for changes

- **TR and EN together.** Change a Turkish page, and change its `/en/` twin in
  the same PR. That includes images: `index.html` and `en/index.html` share
  every image slot.
- **Bump the asset version.** Browsers and Cloudflare keep `/assets/css/*` and
  `/assets/js/*` for 5 minutes and revalidate; everything else under
  `/assets/` is immutable. If you change a stylesheet or script, bump its
  `?v=N` in every page that loads it:

  ```sh
  grep -rl "home.css?v=" coff-website | xargs sed -i '' -E 's/home.css\?v=[0-9]+/home.css?v=NEW/'
  ```

- **Look:** only the brand palette (`coff-designs/color-palette-coff.pdf`),
  as tokens at the top of `assets/css/base.css`: navy `#173F62`, charcoal
  `#2C3639`, blue `#218DBC`, cream `#FFFAF3`, slate `#3F4E4F`, taupe
  `#736A5B`, sand `#F3E7D8`, plus white for cards and `--flow` (`#DDE9EA`),
  the pale blue of the brand flows. The app's success and error colours are
  used only for those states. The one exception is the home tour's phone,
  whose bezel is black (`--bezel`) like real hardware. **No gradients anywhere.** Cards are white with
  a sand border. Behind every page is `assets/img/flow-v2.svg`, the flows of
  the coff. poster (traced, without the wordmark), fixed to the window. White
  text on the brand blue is large and bold (AA as large text only). Page
  text uses Inter or the system font. The Nunito files in `assets/fonts/`
  are used only by the og image renderer.
- **Images:** the home hero is the real app on the store-screenshot
  backend (see `docs/` and the hero recipe), pasted into the phone frame.
  Link previews (`og-image-v2-{tr,en}.png`) are rendered from
  `tools/website/og/og.html` with `tools/website/og/render.mjs`. A changed
  image gets a new file name, since `/assets/img/*` is cached as immutable.
- **No inline script or style.** The CSP in `_headers` blocks them. Put page code
  in `/assets/css/` and `/assets/js/`. Fonts and scripts load from `'self'` only. Self-host any
  font.
- **No analytics or third-party tracking scripts.**

## Launch switch

`STORE_STATE` in `tools/website/sync-chrome.mjs` drives the header button,
the home hero button, the store buttons in the launch card and the launch
card text (TR and EN):

| State | When | Store buttons |
| --- | --- | --- |
| `soon` | store pages not public | white "Yakında" tiles, not links |
| `preorder` | App Store pre-order and Play pre-registration are live | links: "Ön sipariş" / "Ön kayıt" |
| `live` | the app is out | links: "İndir" |

Change it, run `node tools/website/sync-chrome.mjs`, then check by hand
what the script does not own: the FAQ answer "Ne zaman yayında olacak?"
(TR + EN, also in the page's FAQ JSON-LD).

### QR short links

Printed QR codes point at `coffcircle.com/android`, `/ios` (posters,
banners, flyers) and `/kart` (square card). The same script writes
`_redirects` for them from `STORE_STATE`:

| Path | `soon` | `preorder` / `live` |
| --- | --- | --- |
| `/ios` | launch card `/#yakinda` | App Store listing |
| `/android` | launch card `/#yakinda` | Google Play listing, referrer `utm_source=qr&utm_medium=print` |
| `/kart` | launch card `/#yakinda` | launch card `/#yakinda` (both store buttons) |

Never remove or rename these paths: the codes are already printed.

### App share link

Both apps share `coffcircle.com/indir` (English: `/en/indir`) from "Coff'u
arkadaşlarına öner" and the Keşfet invite card. `_redirects` always sends it
to the launch card with `?indir` (`/?indir#yakinda`, `/en/?indir#coming-soon`);
`site.js` then forwards an iPhone or Android phone to the store link in that
card. While `STORE_STATE` is `soon` the card has no links, so everyone sees
the card. Nothing changes at launch, and the path must never be renamed:
shipped app builds carry it.

## Deploy

The source of truth is `coff-website/` in this monorepo. The
`.github/workflows/deploy-website.yml` workflow mirrors it into the
`alp-demir/coff-website` repo on every push to `main`. Cloudflare Pages deploys
that repo in about a minute.

The workflow first runs `sync-chrome.mjs --check` and stops if a page's
header or footer was edited by hand.

If the workflow cannot run (for example, the Actions minutes are used up),
mirror by hand after the merge:

```sh
node tools/website/sync-chrome.mjs --check
gh repo clone alp-demir/coff-website /tmp/coff-website-deploy
rsync -a --delete --exclude=.git coff-website/ /tmp/coff-website-deploy/
cd /tmp/coff-website-deploy
git add -A
git commit -m "deploy: mirror coff-website from coff.@<sha>"
git push
```

Then check production with a cache-busting request that follows redirects:

```sh
curl -sL "https://coffcircle.com/?nocache=$(date +%s)" | grep -o "home.css?v=[0-9]*"
```

Only after the deploy has finished, fetch the new stylesheet URL and grep
for something the change added. Requesting a new `?v=N` before the deploy
is live lets Cloudflare cache the old file under the new key; if that
happens, bump to another number.

## DNS

- `coffcircle.com` is the Pages project, and `www` redirects to the apex.
- `api.coffcircle.com` points to the Spring Boot backend on Railway. The admin
  console is at `/admin/`.
- `cdn.coffcircle.com` points to R2 and serves public profile photos.
