import { component$ } from "@builder.io/qwik";
import { InfoPage } from "~/components/info-page";

export default component$(() => {
  return (
    <InfoPage title="Shipping & Delivery">
      <p>
        We ship across India using trusted courier partners. Most orders are
        dispatched within 1–2 business days.
      </p>
      <h2 class="pt-4 text-xl font-semibold">Delivery times</h2>
      <ul class="list-disc space-y-1 pl-5">
        <li>Metro cities: 2–4 business days</li>
        <li>Other regions: 4–7 business days</li>
      </ul>
      <h2 class="pt-4 text-xl font-semibold">Tracking</h2>
      <p>
        Once your order ships, you'll receive a tracking link by email and in
        your account's orders page.
      </p>
    </InfoPage>
  );
});
