import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const COMPRESSIBLE_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".webmanifest",
  ".svg",
  ".xml",
  ".txt",
]);

/**
 * Parses Cloudflare Pages / Netlify style _headers file into ordered rules.
 */
export function parseHeadersFile(headersPath = path.join(PUBLIC_DIR, "_headers")) {
  if (!existsSync(headersPath)) return [];
  const raw = readFileSync(headersPath, "utf8");
  const rules = [];
  let currentRule = null;

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (!line.startsWith(" ") && !line.startsWith("\t")) {
      const pattern = trimmed;
      const escaped = pattern
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
      currentRule = {
        pattern,
        regex: new RegExp(`^${escaped}$`),
        headers: [],
      };
      rules.push(currentRule);
    } else if (currentRule) {
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex > 0) {
        const name = trimmed.slice(0, colonIndex).trim();
        const value = trimmed.slice(colonIndex + 1).trim();
        currentRule.headers.push([name, value]);
      }
    }
  }

  return rules;
}

function getHeadersForPath(urlPath, rules) {
  const result = {};
  for (const rule of rules) {
    if (rule.regex.test(urlPath)) {
      for (const [name, value] of rule.headers) {
        result[name] = value;
      }
    }
  }
  return result;
}

function resolveFilePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }

  const normalized = path.posix.normalize(decoded);
  if (normalized.includes("..")) return null;

  const candidates = [];
  if (normalized === "/") {
    candidates.push(path.join(PUBLIC_DIR, "index.html"));
  } else {
    const rel = normalized.replace(/^\/+/, "");
    const exact = path.join(PUBLIC_DIR, rel);
    candidates.push(exact);
    if (!path.extname(rel)) {
      candidates.push(`${exact}.html`);
      candidates.push(path.join(exact, "index.html"));
    }
  }

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (!resolved.startsWith(PUBLIC_DIR + path.sep) && resolved !== PUBLIC_DIR) {
      continue;
    }
    if (existsSync(resolved) && statSync(resolved).isFile()) {
      return resolved;
    }
  }

  return null;
}

export function createPreviewServer({ publicDir = PUBLIC_DIR } = {}) {
  const rules = parseHeadersFile(path.join(publicDir, "_headers"));
  const notFoundPath = path.join(publicDir, "404.html");

  return http.createServer((req, res) => {
    const method = req.method || "GET";
    if (method !== "GET" && method !== "HEAD") {
      res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Method Not Allowed");
      return;
    }

    const parsedUrl = new URL(req.url || "/", "http://127.0.0.1");
    const urlPath = parsedUrl.pathname;

    // Never expose _headers directly
    const isBlockedFile = urlPath === "/_headers";
    let filePath = isBlockedFile ? null : resolveFilePath(urlPath);
    let statusCode = 200;

    if (!filePath) {
      statusCode = 404;
      filePath = existsSync(notFoundPath) ? notFoundPath : null;
    }

    const headers = getHeadersForPath(urlPath, rules);

    if (!filePath) {
      headers["Content-Type"] = "text/plain; charset=utf-8";
      res.writeHead(404, headers);
      res.end(method === "HEAD" ? undefined : "Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const body = readFileSync(filePath);
    const etag = `"${createHash("sha256").update(body).digest("hex").slice(0, 16)}"`;

    headers["Content-Type"] = contentType;
    headers["ETag"] = etag;

    if (statusCode === 200 && req.headers["if-none-match"] === etag) {
      res.writeHead(304, headers);
      res.end();
      return;
    }

    const acceptEncoding = String(req.headers["accept-encoding"] || "");
    const canGzip =
      COMPRESSIBLE_EXTENSIONS.has(ext) &&
      /\bgzip\b/i.test(acceptEncoding) &&
      body.length >= 256;

    let payload = body;
    if (COMPRESSIBLE_EXTENSIONS.has(ext)) {
      headers["Vary"] = "Accept-Encoding";
    }
    if (canGzip) {
      payload = gzipSync(body, { level: 6 });
      headers["Content-Encoding"] = "gzip";
    }

    headers["Content-Length"] = String(payload.length);
    res.writeHead(statusCode, headers);
    res.end(method === "HEAD" ? undefined : payload);
  });
}

export function startServer({ port = Number(process.env.PORT || 4173), host = "127.0.0.1" } = {}) {
  const server = createPreviewServer();
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      const resolvedPort = typeof address === "object" && address ? address.port : port;
      resolve({ server, host, port: resolvedPort, url: `http://${host}:${resolvedPort}` });
    });
  });
}

// Run directly when executed via `node scripts/dev.mjs` or `npm run dev`
const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const { url } = await startServer();
  console.log(`zero-bloat-starter preview server running at ${url}`);
}
