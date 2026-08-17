/*
 * WHAT IS THIS FILE?
 *
 * It's the development entry point for `dev.tsx` - the client-side development
 * runtime.
 */
import { render, type RenderOptions } from "@builder.io/qwik";
import Root from "./root";

export default function (opts: RenderOptions) {
  return render(document, <Root />, opts);
}
