import { component$ } from "@builder.io/qwik";
import { InfoPage } from "~/components/info-page";

export default component$(() => {
  return (
    <InfoPage title="Privacy Policy">
      <p>
        We respect your privacy. This policy explains what information we
        collect and how we use it.
      </p>
      <h2 class="pt-4 text-xl font-semibold">Information we collect</h2>
      <ul class="list-disc space-y-1 pl-5">
        <li>Account details you provide (name, email)</li>
        <li>Order and shipping information</li>
        <li>Technical data such as device and usage analytics</li>
      </ul>
      <h2 class="pt-4 text-xl font-semibold">How we use it</h2>
      <p>
        We use your information to process orders, improve our store, and
        communicate with you about your account. We never sell your personal
        data.
      </p>
    </InfoPage>
  );
});
