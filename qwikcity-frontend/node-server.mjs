import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createQwikCity } from "@builder.io/qwik-city/middleware/node";
import render from "./server/entry.ssr.js";
import qwikCityPlan from "./server/@qwik-city-plan.js";

function applySecurityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  next();
}
const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, "dist");

const explicitOrigin =
  process.env.ORIGIN ||
  process.env.PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  undefined;

const { router, notFound, staticFile } = createQwikCity({
  render,
  qwikCityPlan,
  static: { root: distDir },
  ...(explicitOrigin
    ? { origin: explicitOrigin }
    : {
        getOrigin: (request) => {
          const host = request.headers.get("host") || "";
          const xfProto = request.headers.get("x-forwarded-proto") || "http";
          return `${xfProto}://${host}`;
        },
      }),
});

const port = Number(process.env.PORT || 3000);

const server = createServer((req, res) => {
  applySecurityHeaders(req, res, () => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);

    staticFile(req, res, () => {
      router(req, res, () => {
        notFound(req, res, () => {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
        });
      });
    });
  });
});

server.listen(port, () => {
  console.log(`Qwik City server listening on http://localhost:${port}`);
});
