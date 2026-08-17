import { component$, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { getNewArrivalImages, createNewArrivalImage } from "~/lib/api/new-arrival";
import { resolveImageUrl } from "~/lib/config";
import { toast } from "~/lib/toast";

interface NewArrival {
  id: string | number;
  image?: string;
  url?: string;
  active?: boolean;
  heading?: string;
}

export default component$(() => {
  const state = useStore<{ items: NewArrival[]; loading: boolean; heading: string }>({
    items: [],
    loading: true,
    heading: "",
  });

  const refresh = $(async () => {
    try {
      const data = await getNewArrivalImages();
      const list = Array.isArray(data)
        ? (data as NewArrival[])
        : ((data as { images?: NewArrival[] })?.images ?? []);
      state.items = list;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load images");
    } finally {
      state.loading = false;
    }
  });

  useVisibleTask$(async () => {
    await refresh();
  });

  return (
    <div>
      <h1 class="text-2xl font-bold">New Arrivals</h1>

      <form
        class="card mt-6 flex gap-3 p-4"
        preventdefault:submit
        onSubmit$={async () => {
          if (!state.heading) return;
          try {
            await createNewArrivalImage({ heading: state.heading, active: true });
            toast.success("Added");
            state.heading = "";
            await refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Create failed");
          }
        }}
      >
        <input class="input flex-1" placeholder="Heading" bind:value={state.heading} />
        <button type="submit" class="btn-primary">Add</button>
      </form>

      {state.loading ? (
        <p class="mt-6 text-sm text-slate-500">Loading…</p>
      ) : (
        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.items.map((item) => (
            <div key={item.id} class="card overflow-hidden">
              {item.image || item.url ? (
                <img src={resolveImageUrl(item.image ?? item.url)} alt={item.heading ?? ""} class="aspect-video w-full object-cover" />
              ) : null}
              <div class="p-3">
                <p class="font-medium">{item.heading ?? item.id}</p>
                <p class="text-sm text-slate-500">{item.active ? "Active" : "Hidden"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
