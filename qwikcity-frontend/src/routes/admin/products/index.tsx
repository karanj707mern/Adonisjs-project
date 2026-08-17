import { component$, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { getAdminProducts, deleteProduct } from "~/lib/api/product";
import { resolveImageUrl } from "~/lib/config";
import { formatRupees } from "~/lib/formatters";
import { toast } from "~/lib/toast";

interface AdminProduct {
  id: string | number;
  name: string;
  price: number;
  image?: string;
  stock?: number;
  isActive?: boolean;
}

export default component$(() => {
  const state = useStore<{ items: AdminProduct[]; loading: boolean; creating: boolean; name: string; price: string }>({
    items: [],
    loading: true,
    creating: false,
    name: "",
    price: "",
  });

  const refresh = $(async () => {
    try {
      const data = await getAdminProducts();
      const list = Array.isArray(data)
        ? (data as AdminProduct[])
        : ((data as { products?: AdminProduct[] })?.products ?? []);
      state.items = list;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load products");
    } finally {
      state.loading = false;
    }
  });

  useVisibleTask$(async () => {
    await refresh();
  });

  return (
    <div>
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Products</h1>
      </div>

      <form
        class="card mt-6 flex flex-col gap-3 p-4 sm:flex-row"
        preventdefault:submit
        onSubmit$={async () => {
          if (!state.name || !state.price) return;
          state.creating = true;
          try {
            // Note: image upload handled separately; creating with name/price here.
            await createProduct({ name: state.name, price: Number(state.price), isActive: true });
            toast.success("Product created");
            state.name = "";
            state.price = "";
            await refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Create failed");
          } finally {
            state.creating = false;
          }
        }}
      >
        <input class="input flex-1" placeholder="Product name" bind:value={state.name} />
        <input class="input w-32" placeholder="Price" bind:value={state.price} />
        <button type="submit" class="btn-primary" disabled={state.creating}>
          {state.creating ? "Adding…" : "Add product"}
        </button>
      </form>

      {state.loading ? (
        <p class="mt-6 text-sm text-slate-500">Loading…</p>
      ) : (
        <div class="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th class="px-4 py-3">Product</th>
                <th class="px-4 py-3">Price</th>
                <th class="px-4 py-3">Stock</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((item) => (
                <tr key={item.id} class="border-t border-slate-200 dark:border-slate-800">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      {item.image ? (
                        <img src={resolveImageUrl(item.image)} alt="" class="h-10 w-10 rounded object-cover" />
                      ) : null}
                      <span class="font-medium">{item.name}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3">{formatRupees(item.price)}</td>
                  <td class="px-4 py-3">{item.stock ?? "—"}</td>
                  <td class="px-4 py-3">{item.isActive ? "Active" : "Hidden"}</td>
                  <td class="px-4 py-3 text-right">
                    <button
                      type="button"
                      class="text-sm text-rose-500 hover:underline"
                      onClick$={async () => {
                        try {
                          await deleteProduct(item.id);
                          toast.success("Deleted");
                          await refresh();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Delete failed");
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
