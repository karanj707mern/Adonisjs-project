import { component$ } from "@builder.io/qwik";
import { useCurrentUser } from "~/lib/storage";
import { signOutCurrentUser } from "~/lib/session";
import { useNavigate } from "@builder.io/qwik-city";
import { toast } from "~/lib/toast";

export default component$(() => {
  const user = useCurrentUser();
  const nav = useNavigate();

  const profile = (user.user as { user?: Record<string, unknown> } | null)?.user
    ?? (user.user as Record<string, unknown> | null)
    ?? null;

  return (
    <div class="container-page py-10">
      <h1 class="text-3xl font-bold">My Profile</h1>

      {!user.user ? (
        <p class="mt-6 text-slate-500">
          Please <a href="/auth" class="text-neon hover:underline">sign in</a> to view your profile.
        </p>
      ) : (
        <div class="mt-6 max-w-md space-y-4">
          <div class="card p-6">
            <p class="text-sm text-slate-500">Name</p>
            <p class="font-medium">{typeof profile?.name === "string" ? profile.name : "—"}</p>
            <p class="mt-3 text-sm text-slate-500">Email</p>
            <p class="font-medium">{typeof profile?.email === "string" ? profile.email : "—"}</p>
          </div>

          <div class="flex gap-3">
            <a href="/orders" class="btn-ghost">My orders</a>
            <a href="/wishlist" class="btn-ghost">Wishlist</a>
            <button
              type="button"
              class="btn-ghost text-rose-500"
              onClick$={async () => {
                await signOutCurrentUser();
                toast.success("Signed out");
                nav("/");
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
