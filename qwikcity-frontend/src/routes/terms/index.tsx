import { component$ } from "@builder.io/qwik";
import { InfoPage } from "~/components/info-page";

export default component$(() => {
  return (
    <InfoPage title="Terms of Service">
      <p>
        By accessing or using the Moringa store, you agree to be bound by these
        terms. All content, branding and product photography remain the
        property of Moringa and may not be reproduced without permission.
      </p>
      <h2 class="pt-4 text-xl font-semibold">Orders</h2>
      <p>
        Orders are subject to acceptance and availability. We reserve the right
        to refuse or cancel any order at our discretion.
      </p>
      <h2 class="pt-4 text-xl font-semibold">Limitation of liability</h2>
      <p>
        Our products are not intended to diagnose, treat, cure or prevent any
        disease. Consult a healthcare professional before making changes to
        your diet.
      </p>
    </InfoPage>
  );
});
