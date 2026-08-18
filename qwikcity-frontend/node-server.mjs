import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createQwikCity } from "@builder.io/qwik-city/middleware/node";
import render from "./server/entry.ssr.js";
import qwikCityPlan from "./server/@qwik-city-plan.js";

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, "dist");

const { router, notFound, staticFile } = createQwikCity({
  render,
  qwikCityPlan,
  static: { root: distDir },
});

const STATIC_PATHS = [
  "",
  "/shop",
  "/blog",
  "/gift-cards",
  "/wellness-journal",
  "/about-us",
  "/contact",
  "/terms",
  "/privacy-policy",
  "/shipping",
  "/returns",
  "/cart",
  "/wishlist",
  "/auth",
  "/profile",
  "/admin",
];

function buildSitemapXml(origin) {
  const urls = STATIC_PATHS.map(
    (path) => `  <url><loc>${origin}${path || "/"}</loc></url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

const port = Number(process.env.PORT || 3000);

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);

  if (req.method === "GET" && url.pathname === "/robots.txt") {
    const origin = process.env.PUBLIC_SITE_URL || url.origin;
    const body = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    });
    return res.end(body);
  }

  if (req.method === "GET" && url.pathname === "/sitemap.xml") {
    const xml = buildSitemapXml(url.origin);
    res.writeHead(200, {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    });
    return res.end(xml);
  }

  staticFile(req, res, () => {
    router(req, res, () => {
      notFound(req, res, () => {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
      });
    });
  });
});

server.listen(port, () => {
  console.log(`Qwik City server listening on http://localhost:${port}`);
});
