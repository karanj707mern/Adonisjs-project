import { register } from "node:module";

try {
  await register("./server-manifest-loader.mjs", import.meta.url);
} catch (err) {
  console.error("[register-loader] failed to register loader:", err);
  process.exit(1);
}
