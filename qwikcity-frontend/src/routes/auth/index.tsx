import { component$, useSignal, useStore, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { loginUser, registerUser } from "~/lib/api/auth";
import { setCurrentUser, markAuthChecked } from "~/lib/storage";
import { toast } from "~/lib/toast";

export default component$(() => {
  const tab = useSignal<"login" | "register">("login");
  const nav = useNavigate();
  const form = useStore({ name: "", email: "", password: "", busy: false });

  const handleSubmit = $(async () => {
    form.busy = true;
    try {
      const data =
        tab.value === "login"
          ? await loginUser(form.email, form.password)
          : await registerUser(form.name, form.email, form.password);
      setCurrentUser(data);
      markAuthChecked();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("moringa:user-changed"));
        window.dispatchEvent(new Event("moringa:auth-checked"));
      }
      toast.success(tab.value === "login" ? "Welcome back!" : "Account created!");
      nav("/profile");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      form.busy = false;
    }
  });

  return (
    <div class="container-page flex justify-center py-12">
      <div class="card w-full max-w-md p-6">
        <div class="mb-6 flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            class={`flex-1 rounded-md py-2 text-sm font-medium ${tab.value === "login" ? "bg-white shadow dark:bg-slate-700" : ""}`}
            onClick$={() => (tab.value = "login")}
          >
            Sign in
          </button>
          <button
            type="button"
            class={`flex-1 rounded-md py-2 text-sm font-medium ${tab.value === "register" ? "bg-white shadow dark:bg-slate-700" : ""}`}
            onClick$={() => (tab.value = "register")}
          >
            Register
          </button>
        </div>

        <form
          class="space-y-4"
          preventdefault:submit
          onSubmit$={handleSubmit}
        >
          {tab.value === "register" ? (
            <div>
              <label class="mb-1 block text-sm font-medium">Name</label>
              <input class="input" bind:value={form.name} required />
            </div>
          ) : null}
          <div>
            <label class="mb-1 block text-sm font-medium">Email</label>
            <input type="email" class="input" bind:value={form.email} required />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Password</label>
            <input type="password" class="input" bind:value={form.password} required />
          </div>
          <button type="submit" class="btn-primary w-full" disabled={form.busy}>
            {form.busy
              ? "Please wait…"
              : tab.value === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
});
