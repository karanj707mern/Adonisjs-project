import { component$ } from "@builder.io/qwik";
import { InfoPage } from "~/components/info-page";

export default component$(() => {
  return (
    <InfoPage pageKey="about-us">
      <p>
        Moringa started with a simple belief: the most powerful wellness
        ingredients should be accessible, pure, and honestly sourced. Our
        moringa is grown by partner farms that share our commitment to
        regenerative agriculture and fair wages.
      </p>
      <p>
        Every product passes through rigorous lab testing for purity and potency
        before it reaches your door. From leaf powder to cold-pressed oils, we
        keep processing minimal so the nutrition stays intact.
      </p>
      <h2 class="pt-4 text-xl font-semibold">Our promise</h2>
      <ul class="list-disc space-y-1 pl-5">
        <li>Sustainably and ethically farmed</li>
        <li>Lab tested for purity</li>
        <li>Plastic-conscious, recyclable packaging</li>
        <li>Fast, tracked delivery across India</li>
      </ul>
    </InfoPage>
  );
});
