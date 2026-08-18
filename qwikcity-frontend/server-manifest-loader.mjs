import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const VIRTUAL_MAP = {
  "@qwik-client-manifest": join(here, "qwik-manifest-shim.mjs"),
  "@qwik-city-not-found-paths": join(
    here,
    "server",
    "@qwik-city-not-found-paths.js",
  ),
  "@qwik-city-static-paths": join(here, "server", "@qwik-city-static-paths.js"),
};

export async function resolve(specifier, context, nextResolve) {
  const mapped = VIRTUAL_MAP[specifier];
  if (mapped) {
    return {
      url: pathToFileURL(mapped).href,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
