# Coff public website

Static public website for `https://coffcircle.com`.

## Routes

- `/`
- `/privacy/`
- `/terms/`
- `/support/`
- `/delete-account/`

The App Store Connect URLs can omit the trailing slash:

- Marketing URL: `https://coffcircle.com`
- Privacy Policy URL: `https://coffcircle.com/privacy`
- Support URL: `https://coffcircle.com/support`
- Terms URL: `https://coffcircle.com/terms`
- Account Deletion URL: `https://coffcircle.com/delete-account`

## Deployment

Recommended deployment is Cloudflare Pages with this folder as the project root.

Cloudflare DNS state verified during implementation:

- `api.coffcircle.com` exists as a proxied CNAME to Railway.
- `cdn.coffcircle.com` exists as a proxied CNAME to `public.r2.dev`.
- `coffcircle.com` did not have an apex website record.
- `admin.coffcircle.com` did not have a DNS record.

Recommended records:

1. Deploy `coff-website/` to Cloudflare Pages.
2. Attach custom domain `coffcircle.com` to the Pages project.
3. Optionally attach `www.coffcircle.com` and redirect it to `https://coffcircle.com`.
4. Preserve `api.coffcircle.com` for the Spring Boot backend.
5. Preserve `cdn.coffcircle.com` for public profile-photo delivery.
6. Keep admin on the backend origin, currently `/admin/` on the API service, or add `admin.coffcircle.com` to the same backend later with the admin same-origin API assumptions checked first.

No analytics or third-party tracking scripts are included.
