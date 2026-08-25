import { component$, useStore } from "@builder.io/qwik";
import { InfoPage } from "~/components/info-page";
import { toast } from "~/lib/toast";

export default component$(() => {
  const form = useStore({ name: "", email: "", message: "", sending: false });

  return (
    <InfoPage pageKey="contact">
      <form
        class="card mt-2 space-y-4 p-6"
        preventdefault:submit
        onSubmit$={async () => {
          form.sending = true;
          const response = await fetch(
            `${import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1"}/contact`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: form.name,
                email: form.email,
                message: form.message,
              }),
            },
          );
          form.sending = false;
          if (response.ok) {
            toast.success("Thanks! We'll get back to you soon.");
            form.name = "";
            form.email = "";
            form.message = "";
          } else {
            toast.error("Could not send your message. Please try again.");
          }
        }}
      >
        <div>
          <label class="mb-1 block text-sm font-medium">Name</label>
          <input
            class="input"
            value={form.name}
            onInput$={(_, el) => (form.name = el.value)}
            required
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            class="input"
            value={form.email}
            onInput$={(_, el) => (form.email = el.value)}
            required
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Message</label>
          <textarea
            class="input min-h-32"
            value={form.message}
            onInput$={(_, el) => (form.message = el.value)}
            required
          />
        </div>
        <button type="submit" class="btn-primary" disabled={form.sending}>
          {form.sending ? "Sending…" : "Send message"}
        </button>
      </form>
    </InfoPage>
  );
});
