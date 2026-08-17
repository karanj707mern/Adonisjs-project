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

const port = Number(process.env.PORT || 3000);

const server = createServer((req, res) => {
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
