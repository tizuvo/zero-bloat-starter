<p align="center">
  <a href="https://tizuvo.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://tizuvo.com/assets/svg/tizuvo-lockup-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://tizuvo.com/assets/svg/tizuvo-lockup-light.svg">
      <img alt="Tizuvo" src="https://tizuvo.com/assets/svg/tizuvo-lockup-light.svg" height="36">
    </picture>
  </a>
</p>

<h1 align="center">zero-bloat-starter</h1>

<p align="center">
  A zero-dependency, zero-build-step static and edge website starter kit developed by
  <a href="https://tizuvo.com">Tizuvo</a> to score <strong>100/100</strong> across Lighthouse and pass
  <strong>20/20</strong> checks in <code>npx @tizuvo/audit</code> out of the box.
</p>

<p align="center">
  <a href="https://starter.tizuvo.com"><strong>Live Demo (starter.tizuvo.com)</strong></a> &middot;
  <a href="https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fstarter.tizuvo.com%2F">PageSpeed 100/100</a> &middot;
  <a href="https://tizuvo.com/audit">Run Audit</a> &middot;
  <a href="https://github.com/tizuvo/zero-bloat-starter/generate">Use this template</a>
</p>

---

## Verified 100/100 Benchmarks

Tested live on [`starter.tizuvo.com`](https://starter.tizuvo.com) via **[PageSpeed Insights](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fstarter.tizuvo.com%2F)** and **`@tizuvo/audit`**:

| Audit | Score | Verify Live |
| --- | --- | --- |
| **PageSpeed Insights — Performance** | **100 / 100** | [Run on pagespeed.web.dev](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fstarter.tizuvo.com%2F) |
| **PageSpeed Insights — Accessibility** | **100 / 100** | [Run on pagespeed.web.dev](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fstarter.tizuvo.com%2F) |
| **PageSpeed Insights — Best Practices** | **100 / 100** | [Run on pagespeed.web.dev](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fstarter.tizuvo.com%2F) |
| **PageSpeed Insights — SEO** | **100 / 100** | [Run on pagespeed.web.dev](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fstarter.tizuvo.com%2F) |
| **`npx @tizuvo/audit`** | **100 / 100 (A+ · 20/20)** | `npx @tizuvo/audit https://starter.tizuvo.com` |

---

## Why Zero-Bloat?

Most marketing and studio sites ship megabytes of JavaScript just to render a few kilobytes of typography. `zero-bloat-starter` strips away bundlers, frameworks, and runtime dependencies in favor of modern native web primitives:

| Pillar | What Ships Out of the Box |
| --- | --- |
| **Zero Dependencies** | Pure semantic HTML5, modern CSS tokens, `< 4 KB` vanilla JS, and `0` packages in `package.json`. |
| **Strict CSP** | Zero `unsafe-inline` scripts or styles — full `default-src 'none'` policy synchronized across Cloudflare Pages, Vercel, and Nginx. |
| **Editorial Design System** | Dark obsidian base + Warm Paper contrast band, fluid `clamp()` type, 4px/8px spacing rhythm, and nested radii (`24px / 16px / 8px`). |
| **Native Motion & UX** | Cross-document `@view-transition` with pinned sticky header, keyboard-accessible mobile drawer, native `<details>` FAQ, and `prefers-reduced-motion` support. |
| **Technical SEO & PWA** | Canonical links, Open Graph metadata, JSON-LD structured data, `robots.txt`, `sitemap.xml`, `site.webmanifest`, and RFC 9116 `security.txt`. |
| **Built-in Verification** | Zero-dep Node preview server (`scripts/dev.mjs`) injecting `_headers` locally + native `node:test` suite (`test/starter.test.mjs`). |

---

## Quickstart (2 Commands)

Requires **Node.js >= 20.0.0** (only for the optional local preview server and test suite — production hosting requires no Node runtime at all).

```bash
# 1. Start the local preview server with production _headers & gzip at http://127.0.0.1:4173
npm run dev

# 2. Run the native node:test verification suite (HTML, CSP, headers, SEO, budgets)
npm test
```

---

## Customize in 5 Minutes

1. **Brand & Palette:** Edit CSS custom properties in [`public/assets/css/tokens.css`](public/assets/css/tokens.css).
2. **Logo & Favicon:** Replace [`public/assets/svg/favicon.svg`](public/assets/svg/favicon.svg).
3. **Copy & Domain:** Replace `Starter Studio` and `https://example.com` across `public/index.html`, `public/work.html`, `public/404.html`, `public/robots.txt`, `public/sitemap.xml`, and `public/.well-known/security.txt`.
4. **Optional Self-Hosted Fonts:** Drop `.woff2` files into `public/assets/fonts/` and uncomment the `@font-face` hook in `tokens.css` (CSP `font-src 'self'` already permits them).
5. **Contact Form Endpoint:** Wire the validated form in `public/assets/js/app.js` to a Cloudflare Worker, Formspree, or your own API.

---

## Deploy Guides

All three deployment targets enforce identical hardened security headers (`CSP`, `HSTS`, `XCTO`, `XFO`, `Referrer-Policy`, `Permissions-Policy`, `COOP`, `CORP`) and immutable caching on `/assets/*`.

### Cloudflare Pages (Recommended)
1. Click **Use this template** on GitHub and connect your repository in Cloudflare Pages.
2. Set **Build command** to *(empty)* and **Build output directory** to `public`.
3. Cloudflare Pages automatically applies [`public/_headers`](public/_headers) and serves `404.html`.
4. **Tip for 100/100 Best Practices:** Disable Cloudflare Web Analytics auto-injection (RUM) and Email Address Obfuscation for your custom domain so Cloudflare does not inject third-party scripts that conflict with the strict `script-src 'self'` CSP.

### Vercel
1. Copy [`deploy/vercel.json`](deploy/vercel.json) to the repository root (`cp deploy/vercel.json vercel.json`).
2. Import the repository in Vercel — `outputDirectory: "public"`, `cleanUrls: true`, and all security/cache headers are applied automatically.

### Self-Hosted Nginx
1. Copy `public/` to `/var/www/zero-bloat-starter/public`.
2. Install [`deploy/nginx.conf`](deploy/nginx.conf) into `/etc/nginx/sites-available/`, replace `example.com` and your TLS 1.3 certificate paths, and reload Nginx (`nginx -t && systemctl reload nginx`).

---

## Audit Your Deployed Site

Verify performance, security headers, and technical SEO in one command using [`@tizuvo/audit`](https://github.com/tizuvo/site-audit-cli) (or run a browser-based report at [tizuvo.com/audit](https://tizuvo.com/audit)):

```bash
# Audit the live demo deployment
npx @tizuvo/audit https://starter.tizuvo.com

# Or audit your own deployed domain
npx @tizuvo/audit https://your-domain.com
```

---

## Repository Structure

```text
zero-bloat-starter/
├── public/
│   ├── index.html                  # Flagship landing page (dark + warm paper rhythm)
│   ├── work.html                   # Secondary page demonstrating @view-transition
│   ├── 404.html                    # Custom 404 page
│   ├── assets/
│   │   ├── css/tokens.css          # Palette, spacing, nested radii, fluid clamp() type
│   │   ├── css/main.css            # Layout, components, @view-transition, reduced-motion
│   │   ├── js/app.js               # < 4 KB: mobile nav, scroll reveal, form validation
│   │   └── svg/favicon.svg         # Minimal geometric SVG favicon
│   ├── _headers                    # Cloudflare Pages / Netlify security & cache headers
│   ├── robots.txt                  # Search engine directives + sitemap pointer
│   ├── sitemap.xml                 # XML sitemap
│   ├── site.webmanifest            # PWA web manifest
│   └── .well-known/security.txt    # RFC 9116 security policy
├── deploy/
│   ├── vercel.json                 # Vercel headers + cleanUrls config
│   └── nginx.conf                  # Hardened Nginx server block (TLS 1.3, gzip/brotli, CSP)
├── scripts/dev.mjs                 # Zero-dep local preview server with _headers & gzip
├── test/starter.test.mjs           # Native node:test verification suite
├── .github/workflows/ci.yml        # CI: Node 20/22 tests + @tizuvo/audit check
├── package.json                    # Zero dependencies, zero devDependencies
└── LICENSE                         # MIT License (Copyright 2026 Tizuvo)
```

---

## License

MIT &copy; 2026 [Tizuvo](https://tizuvo.com). Built to be forked, customized, and shipped fast.
