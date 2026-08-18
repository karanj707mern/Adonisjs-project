# qwikcity-frontend — run helper

## Prerequisites

- Node.js >= 18.17

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

This also runs `scripts/postbuild.mjs` automatically (via npm `postbuild` hook) to
recreate the Node runtime shim required by Qwik's server bundle.

## Run (production)

```bash
npm start
# or on a custom port
PORT=3100 npm start
```

## Dev (SSR with hot reload)

```bash
npm run dev
```

## What the extra files do

- `register-loader.mjs` + `server-manifest-loader.mjs`: Node ESM loader that
  resolves Qwik's virtual `@qwik-client-manifest` / `@qwik-city-*` modules at
  runtime to the files emitted by `npm run build`.
- `node-server.mjs`: Hand-rolled Node server using `@builder.io/qwik-city/middleware/node`.
- `qwik-manifest-shim.mjs`: Minimal stub for `@qwik-client-manifest` (the real
  manifest is inlined into `server/entry.ssr.js` and merged per request).
- `scripts/postbuild.mjs`: Recreates the shim inside `node_modules/` after
  `npm install` (which wipes `node_modules`).

## Notes

- The first `npm start` after `npm install` must be preceded by `npm run build`
  so that `server/entry.ssr.js` and `server/@qwik-city-plan.js` exist.
- `npm run build` runs client + server bundling plus lint.
