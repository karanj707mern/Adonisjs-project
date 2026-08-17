import { component$ } from "@builder.io/qwik";
import { InfoPage } from "~/components/info-page";

export default component$(() => {
  return (
    <InfoPage title="Returns & Refunds">
      <p>
        We want you to love your purchase. If something isn't right, you can
        request a return within 7 days of delivery.
      </p>
      <h2 class="pt-4 text-xl font-semibold">Eligibility</h2>
      <ul class="list-disc space-y-1 pl-5">
        <li>Items must be unopened and in original packaging</li>
        <li>Perishable goods are not eligible for return</li>
      </ul>
      <h2 class="pt-4 text-xl font-semibold">Refunds</h2>
      <p>
        Approved refunds are processed to your original payment method within
        5–7 business days.
      </p>
    </InfoPage>
  );
});
