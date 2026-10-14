# HA Digital Agency website deployment

The public static site lives in `website/` and is deployed by a separate Cloudflare Pages project. It does not use the HA Worker or D1 database.

## Current Pages configuration

- Project: `ha-digital-agency-site`
- Hostname: `ha-digital-agency-site.pages.dev`
- Repository: `hamarketers05/ha_digital_agency_automation`
- Production branch: `main`
- Root directory: `website`
- Build command: blank (plain static HTML/CSS/JavaScript)
- Build output directory: `.`
- Preview deployments: disabled

## Public files

`index.html`, `services.html`, `about.html`, `contact.html`, `privacy.html`, `terms.html`, `404.html`, `styles.css`, `script.js`, `config.js`, `robots.txt`, `sitemap.xml`, and `_headers`.

## Before calling the website production-ready

1. Confirm the official agency contact inbox and enter it in `website/config.js` under `contactEmail`. When set, the brief form opens the visitor's email client with a draft; it does not send automatically.
2. Confirm whether a custom domain is available. If host changes, update canonical and Open Graph URLs, `website/sitemap.xml` and `website/robots.txt`.
3. Review the starter privacy notice and terms against actual business practices and applicable law.
4. Verify desktop/mobile layout, links, headers, contact form behaviour and live HTTP responses.
5. In the Cloudflare dashboard, verify the GitHub Pages integration and that a normal push to `main` starts a production deployment. The initial deployment was triggered manually; automatic push triggering is not yet verified.
6. Complete Search Console ownership verification and submit the live sitemap.

No contact inbox, custom domain, Search Console ownership, search ranking, or client results are assumed or fabricated.
