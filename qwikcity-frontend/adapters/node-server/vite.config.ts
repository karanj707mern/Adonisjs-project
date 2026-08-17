import { defineConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nodeServerAdapter } from "@builder.io/qwik-city/adapters/node-server/vite";

export default defineConfig(() => {
  return {
    plugins: [
      qwikCity(),
      qwikVite(),
      tailwindcss(),
      tsconfigPaths(),
      // nodeServerAdapter generates the `server/entry.node-server.js` runtime.
      // ssg: null keeps the build dynamic (no prerender at build time).
      nodeServerAdapter({ ssg: null }),
    ],
    build: {
      ssr: true,
      rollupOptions: {
        input: ["./src/entry.ssr.tsx", "@qwik-city-plan"],
      },
    },
    server: {
      port: Number(process.env.PORT || 3000),
    },
  };
});
