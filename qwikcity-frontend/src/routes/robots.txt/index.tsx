import { component$ } from "@builder.io/qwik";
import { getSiteUrl } from "~/lib/config";

export const head = {
  "content-type": "text/plain",
};

export default component$(() => {
  const site = getSiteUrl();
  const body = `User-agent: *
Allow: /
Sitemap: ${site}/sitemap.xml
`;

  return (
    <pre
      style={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
        fontFamily: "monospace",
        fontSize: "14px",
      }}
    >
      {body}
    </pre>
  );
});
