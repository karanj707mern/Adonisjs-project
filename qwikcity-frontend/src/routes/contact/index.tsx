import { component$, useStore } from "@builder.io/qwik";
import { InfoPage } from "~/components/info-page";
import { toast } from "~/lib/toast";

export default component$(() => {
  const form = useStore({ name: "", email: "", message: "", sending: false });

  return (
    <InfoPage title="Contact" subtitle="We'd love to hear from you.">
      <form
        class="card mt-2 space-y-4 p-6"
        preventdefault:submit
        onSubmit$={async () => {
          form.sending = true;
          // No public contact API in this migration; acknowledge locally.
          await new Promise((r) => setTimeout(r, 400));
          form.sending = false;
          toast.success("Thanks! We'll get back to you soon.");
          form.name = "";
          form.email = "";
          form.message = "";
        }}
      >
        <div>
          <label class="mb-1 block text-sm font-medium">Name</label>
          <input class="input" bind:value={form.name} required />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Email</label>
          <input type="email" class="input" bind:value={form.email} required />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Message</label>
          <textarea class="input min-h-32" bind:value={form.message} required />
        </div>
        <button type="submit" class="btn-primary" disabled={form.sending}>
          {form.sending ? "Sending…" : "Send message"}
        </button>
      </form>
    </InfoPage>
  );
});
