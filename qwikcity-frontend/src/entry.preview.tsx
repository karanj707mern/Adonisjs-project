/*
 * WHAT IS THIS FILE?
 *
 * It's the production entry point for `preview.tsx` - the client-side runtime
 * that boots a Qwik application in the browser.
 */
import { render, type RenderOptions } from "@builder.io/qwik";
import Root from "./root";

export default function (opts: RenderOptions) {
  return render(document, <Root />, opts);
}
