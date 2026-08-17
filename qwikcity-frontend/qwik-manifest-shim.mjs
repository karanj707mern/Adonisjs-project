// Shim for Qwik's virtual "@qwik-client-manifest" module at Node runtime.
// The real client manifest is inlined into server/entry.ssr.js and merged per
// request, so an empty object is sufficient for SSR/resumption.
export const manifest = {};
