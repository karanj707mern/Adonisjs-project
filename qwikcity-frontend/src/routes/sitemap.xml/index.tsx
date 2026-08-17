import type { RequestHandler } from "@builder.io/qwik-city";
import { getSiteUrl } from "~/lib/config";

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

export const onGet: RequestHandler = ({ headers }) => {
  const base = getSiteUrl();
  const urls = STATIC_PATHS.map(
    (path) => `  <url><loc>${base}${path || "/"}</loc></url>`,
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  headers.set("Content-Type", "application/xml; charset=utf-8");
  headers.set("Cache-Control", "public, max-age=3600");
  return new Response(xml, { headers });
};
