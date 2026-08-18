import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { getProducts } from "~/lib/api/product";
import { getBlogPosts } from "~/lib/api/blog";
import { getSiteUrl } from "~/lib/config";

export const useSitemap = routeLoader$(async () => {
  const site = getSiteUrl();
  const [products, blogs] = await Promise.all([
    getProducts(),
    getBlogPosts(),
  ]);

  const normalizeProducts = (data: unknown): { id: string | number; slug?: string }[] => {
    if (Array.isArray(data)) return data as { id: string | number; slug?: string }[];
    if (data && typeof data === "object" && Array.isArray((data as { products?: unknown }).products)) {
      return (data as { products: { id: string | number; slug?: string }[] }).products;
    }
    return [];
  };

  const normalizeBlogs = (data: unknown): { slug?: string }[] => {
    if (Array.isArray(data)) return data as { slug?: string }[];
    if (data && typeof data === "object" && Array.isArray((data as { posts?: unknown }).posts)) {
      return (data as { posts: { slug?: string }[] }).posts;
    }
    return [];
  };

  const productUrls = normalizeProducts(products)
    .filter((p) => p.slug)
    .map((p) => `${site}/product/${p.slug}`);

  const blogUrls = normalizeBlogs(blogs)
    .filter((b) => b.slug)
    .map((b) => `${site}/blog/${b.slug}`);

  const urls = [
    site,
    `${site}/shop`,
    `${site}/blog`,
    `${site}/cart`,
    `${site}/about-us`,
    `${site}/contact`,
    `${site}/terms`,
    `${site}/privacy-policy`,
    `${site}/returns`,
    `${site}/shipping`,
    `${site}/gift-cards`,
    ...productUrls,
    ...blogUrls,
  ];

  return urls;
});

export const head = {
  "content-type": "application/xml",
};

export default component$(() => {
  const urls = useSitemap();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.value
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return (
    <pre
      style={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
        fontFamily: "monospace",
        fontSize: "14px",
      }}
    >
      {xml}
    </pre>
  );
});
