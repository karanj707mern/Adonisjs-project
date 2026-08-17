import type { RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = ({ url, headers }) => {
  headers.set("Content-Type", "text/plain; charset=utf-8");
  headers.set("Cache-Control", "public, max-age=3600");
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${url.origin}/sitemap.xml\n`;
  return new Response(body, { headers });
};
