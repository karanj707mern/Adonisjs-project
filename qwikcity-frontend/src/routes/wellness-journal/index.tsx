import { component$ } from "@builder.io/qwik";
import { InfoPage } from "~/components/info-page";

export default component$(() => {
  return (
    <InfoPage title="Wellness Journal" subtitle="Stories, science and rituals for a healthier you.">
      <p>
        The Wellness Journal is our space for deep dives into moringa
        nutrition, simple daily rituals, and conversations with the people who
        grow and craft our products.
      </p>
      <h2 class="pt-4 text-xl font-semibold">Recent themes</h2>
      <ul class="list-disc space-y-1 pl-5">
        <li>Morning routines with moringa</li>
        <li>Understanding antioxidants</li>
        <li>Sustainable farming in practice</li>
      </ul>
      <p class="pt-4">
        Browse the <a href="/blog" class="text-neon hover:underline">blog</a> for
        the latest entries.
      </p>
    </InfoPage>
  );
});
