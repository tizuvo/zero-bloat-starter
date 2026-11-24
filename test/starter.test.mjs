import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { PUBLIC_DIR, startServer } from "../scripts/dev.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

let server;
let baseUrl;

before(async () => {
  const started = await startServer({ port: 0, host: "127.0.0.1" });
  server = started.server;
  baseUrl = started.url;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe("HTTP routing & status codes", () => {
  const expectedOkRoutes = [
    "/",
    "/work",
    "/work.html",
    "/robots.txt",
    "/sitemap.xml",
    "/.well-known/security.txt",
    "/site.webmanifest",
    "/assets/css/tokens.css",
    "/assets/css/main.css",
    "/assets/js/app.js",
    "/assets/svg/favicon.svg",
  ];

  for (const route of expectedOkRoutes) {
    it(`returns HTTP 200 for ${route}`, async () => {
      const res = await fetch(`${baseUrl}${route}`);
      assert.equal(res.status, 200);
    });
  }

  it("returns HTTP 404 with custom 404 page for missing paths", async () => {
    const res = await fetch(`${baseUrl}/nonexistent`);
    assert.equal(res.status, 404);
    const html = await res.text();
    assert.match(html, /404/i);
  });

  it("supports gzip compression on compressible responses", async () => {
    const res = await fetch(`${baseUrl}/`, {
      headers: { "Accept-Encoding": "gzip" },
    });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("vary") || "", /Accept-Encoding/i);
  });
});

describe("Security & cache headers", () => {
  it("enforces all required hardened security headers on HTML pages", async () => {
    const res = await fetch(`${baseUrl}/`);
    const csp = res.headers.get("content-security-policy") || "";
    assert.ok(csp.length > 0, "CSP header must be present");
    assert.ok(!/unsafe-inline/i.test(csp), "CSP must not allow unsafe-inline");
    assert.ok(!/unsafe-eval/i.test(csp), "CSP must not allow unsafe-eval");
    assert.match(csp, /default-src 'none'/);
    assert.match(csp, /frame-ancestors 'none'/);

    assert.equal(
      res.headers.get("strict-transport-security"),
      "max-age=63072000; includeSubDomains; preload"
    );
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.equal(res.headers.get("x-frame-options"), "DENY");
    assert.equal(res.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.match(res.headers.get("permissions-policy") || "", /camera=\(\)/);
    assert.equal(res.headers.get("cross-origin-opener-policy"), "same-origin");
    assert.equal(res.headers.get("cross-origin-resource-policy"), "same-origin");
    assert.equal(res.headers.get("cache-control"), "public, max-age=0, must-revalidate");
    assert.ok(res.headers.get("etag"), "HTML responses must include an ETag header");
  });

  it("sets immutable caching on /assets/*", async () => {
    const res = await fetch(`${baseUrl}/assets/css/main.css`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "public, max-age=31536000, immutable");
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  });
});

describe("Strict CSP HTML hygiene & Technical SEO", () => {
  const htmlFiles = ["index.html", "work.html", "404.html"];

  for (const filename of htmlFiles) {
    const html = readFileSync(path.join(PUBLIC_DIR, filename), "utf8");

    it(`${filename} has zero inline executable scripts, inline handlers, or inline styles`, () => {
      const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
      for (const [, attrs, body] of scriptMatches) {
        const isJsonLd = /type\s*=\s*["']application\/ld\+json["']/i.test(attrs);
        const hasSrc = /\bsrc\s*=\s*["'][^"']+["']/i.test(attrs);
        if (!isJsonLd) {
          assert.ok(hasSrc, `${filename} contains an inline executable <script>`);
          assert.equal(body.trim(), "", `${filename} <script src> must have empty body`);
        }
      }

      assert.ok(
        !/\sstyle\s*=\s*["']/i.test(html),
        `${filename} must not contain inline style="..." attributes`
      );
      assert.ok(
        !/\son[a-z]+\s*=\s*["']/i.test(html),
        `${filename} must not contain inline on* event handlers`
      );
    });

    it(`${filename} satisfies semantic HTML, SEO metadata, Open Graph, and valid JSON-LD`, () => {
      assert.match(html, /<html\s+lang="en">/i, `${filename} must declare <html lang="en">`);
      assert.match(html, /<meta\s+name="viewport"/i, `${filename} must include viewport meta`);

      const h1Matches = html.match(/<h1\b/gi) || [];
      assert.equal(h1Matches.length, 1, `${filename} must have exactly one <h1>`);

      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      assert.ok(titleMatch, `${filename} must have a <title>`);
      const titleText = titleMatch[1].replace(/&amp;/g, "&").trim();
      assert.ok(
        titleText.length >= 20 && titleText.length <= 65,
        `${filename} <title> length (${titleText.length}) must be between 20 and 65 chars`
      );

      const descMatch = html.match(
        /<meta\s+[^>]*name="description"[^>]*content="([^"]+)"/i
      );
      assert.ok(descMatch, `${filename} must have a meta description`);
      const descText = descMatch[1].trim();
      assert.ok(
        descText.length >= 70 && descText.length <= 165,
        `${filename} meta description length (${descText.length}) must be between 70 and 165 chars`
      );

      assert.match(
        html,
        /<link\s+rel="canonical"\s+href="https?:\/\/[^"]+"/i,
        `${filename} must include a canonical link`
      );
      assert.match(html, /property="og:title"/i, `${filename} must include og:title`);
      assert.match(html, /property="og:description"/i, `${filename} must include og:description`);
      assert.match(html, /property="og:type"/i, `${filename} must include og:type`);
      assert.match(html, /property="og:url"/i, `${filename} must include og:url`);

      const jsonLdMatches = [
        ...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi),
      ];
      assert.ok(jsonLdMatches.length >= 1, `${filename} must contain JSON-LD structured data`);
      for (const [, rawJson] of jsonLdMatches) {
        const parsed = JSON.parse(rawJson);
        assert.equal(parsed["@context"], "https://schema.org");
      }
    });
  }
});

describe("Zero-bloat budgets & zero dependencies", () => {
  it("keeps public/assets/js/app.js under 4 KB uncompressed", () => {
    const jsPath = path.join(PUBLIC_DIR, "assets", "js", "app.js");
    const size = statSync(jsPath).size;
    assert.ok(size < 4096, `app.js is ${size} bytes, exceeding the 4096-byte budget`);
  });

  it("enforces zero dependencies and zero devDependencies in package.json", () => {
    const pkg = JSON.parse(readFileSync(path.join(ROOT_DIR, "package.json"), "utf8"));
    assert.equal(Object.keys(pkg.dependencies || {}).length, 0);
    assert.equal(Object.keys(pkg.devDependencies || {}).length, 0);
  });
});
