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
headers and caching), and `.well-known/` (iOS universal links and Android app
links).

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
- **Bump the asset version.** `_headers` caches `/assets/*` for a long time. If
  you change `styles.css`, `site.js` or any other asset, bump its `?v=N` in
  every page that loads it. Otherwise production keeps serving the old file:

  ```sh
  grep -rl "styles.css?v=" coff-website | xargs sed -i '' 's/styles.css?v=14/styles.css?v=15/'
  ```

- **Look:** the palette, radii and type come from the app
  (`coff-frontend/coff/DesignSystem/DesignSystem.swift`). Surfaces are flat
  (cream, white cards, charcoal); no gradients, glow or blur. Headings and
  buttons use Nunito (`assets/fonts/`, subset to Latin + Turkish, the same
  face the Android app uses); body text uses the system font.
- **Images:** the home hero is the real app on the store-screenshot
  backend (see `docs/` and the hero recipe), pasted into the phone frame.
  Link previews (`og-image-v2-{tr,en}.png`) are rendered from
  `tools/website/og/og.html` with `tools/website/og/render.mjs`. A changed
  image gets a new file name, since `/assets/*` is cached as immutable.
- **No inline script or style.** The CSP in `_headers` blocks them. Put page code
  in `/assets/`. Fonts and scripts load from `'self'` only. Self-host any
  font.
- **No analytics or third-party tracking scripts.**

## Launch switch

`STORE_STATE` in `tools/website/sync-chrome.mjs` drives the header button,
the store buttons, the home hero note and the launch card (TR and EN):

| State | When | Store buttons |
| --- | --- | --- |
| `soon` | store pages not public | white "Yakında" tiles, not links |
| `preorder` | App Store pre-order and Play pre-registration are live | links: "Ön sipariş" / "Ön kayıt" |
| `live` | the app is out | links: "İndir" |

Change it, run `node tools/website/sync-chrome.mjs`, then check by hand
what the script does not own: the FAQ answer "Ne zaman yayında olacak?"
(TR + EN, also in the page's FAQ JSON-LD).

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
curl -sL "https://coffcircle.com/?nocache=$(date +%s)" | grep "styles.css?v="
```

## DNS

- `coffcircle.com` is the Pages project, and `www` redirects to the apex.
- `api.coffcircle.com` points to the Spring Boot backend on Railway. The admin
  console is at `/admin/`.
- `cdn.coffcircle.com` points to R2 and serves public profile photos.
