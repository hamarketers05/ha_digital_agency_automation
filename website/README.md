# HA Digital Agency website

A lightweight, static, responsive website intended for a separate Cloudflare Pages project. It intentionally has no framework/build dependency and does not use the Worker or D1 database.

## Files

- `index.html`: main landing page
- `services.html`, `about.html`, `contact.html`: service, approach and project-brief pages
- `privacy.html`, `terms.html`: starter legal pages to review before launch
- `styles.css`, `script.js`, `config.js`: local design, navigation and contact-form behaviour
- `robots.txt`, `sitemap.xml`, `_headers`: crawl metadata and basic response headers
- `404.html`: branded not-found page

## Contact form behaviour

The form does not submit to a server or store personal data. Before launch, add the agency's genuine business inbox to `config.js` under `contactEmail`. When configured, the form opens the visitor's email app with a prepared draft; it does not send the message automatically. Keep the field empty until the team confirms which inbox is appropriate.

## Cloudflare Pages settings

Recommended Git-connected Pages settings:

- Project name: `ha-digital-agency-site`
- Production branch: `main`
- Root directory: `website`
- Build command: leave blank (plain static HTML/CSS/JS)
- Build output directory: `/` (or `.`, depending on the dashboard/API field validation)

This project is separate from `ha-digital-agency-core`; do not change the root `wrangler.toml`, Worker source or its D1 binding to publish the static site.

## Before production launch

1. Confirm official contact email and business contact details.
2. Confirm whether a custom domain is available; update canonical URLs, Open Graph URLs, sitemap and robots when changing hosts.
3. Review privacy/terms for actual business practices and applicable laws.
4. Test each page on mobile and desktop, verify links and form fallback, then submit the sitemap in Google Search Console.
5. Do not add external fonts, trackers, analytics or paid services without reviewing licence, privacy and cost first.
