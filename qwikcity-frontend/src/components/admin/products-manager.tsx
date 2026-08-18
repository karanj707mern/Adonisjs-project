import { component$, useSignal, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import {
  getAdminProducts,
  deleteProduct,
  createProduct,
  updateProduct,
  uploadProductImage,
} from "~/lib/api/product";
import { resolveImageUrl } from "~/lib/config";
import { formatRupees } from "~/lib/formatters";
import { toast } from "~/lib/toast";

const EMPTY_FORM = {
  name: "",
  slug: "",
  sku: "",
  price: "",
  compareAtPrice: "",
  description: "",
  image: "",
  brand: "",
  tags: "",
  seoTitle: "",
  seoDescription: "",
  weightGrams: "",
  isActive: true,
  isNewArrival: false,
  stock: "",
};

function toFormState(product: Record<string, unknown>) {
  return {
    name: (product.name ?? "") as string,
    slug: (product.slug ?? "") as string,
    sku: (product.sku ?? "") as string,
    price: product.price == null ? "" : String(product.price),
    compareAtPrice: product.compareAtPrice == null ? "" : String(product.compareAtPrice),
    description: (product.description ?? "") as string,
    image: (product.image ?? "") as string,
    brand: (product.brand ?? "") as string,
    tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
    seoTitle: (product.seoTitle ?? "") as string,
    seoDescription: (product.seoDescription ?? "") as string,
    weightGrams: product.weightGrams == null ? "" : String(product.weightGrams),
    isActive: Boolean(product.isActive ?? true),
    isNewArrival: Boolean(product.isNewArrival ?? false),
    stock: product.stock == null ? "" : String(product.stock),
  };
}

export default component$(() => {
  const nav = useNavigate();
  const products = useStore<Record<string, unknown>[]>([]);
  const form = useStore({ ...EMPTY_FORM });
  const editingId = useSignal<string | null>(null);
  const loading = useSignal(true);
  const error = useSignal("");
  const uploadingImage = useSignal(false);
  const selectedImageName = useSignal("");
  const localImagePreview = useSignal("");

  const loadProducts = $(async () => {
    loading.value = true;
    try {
      const data = await getAdminProducts();
      products.length = 0;
      const list = Array.isArray(data) ? data as Record<string, unknown>[] : [];
      list.forEach((p) => products.push(p));
      error.value = "";
    } catch (err) {
      if ((err as Error & { status: number }).status === 401 || (err as Error & { status: number }).status === 403) {
        nav("/auth?from=" + encodeURIComponent("/admin/products"));
        return;
      }
      error.value = (err as Error).message || "Could not load products.";
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadProducts();
  });

  const resetForm = $(() => {
    if (localImagePreview.value) URL.revokeObjectURL(localImagePreview.value);
    Object.assign(form, EMPTY_FORM);
    editingId.value = null;
    selectedImageName.value = "";
    localImagePreview.value = "";
  });

  const handleChange = $((e: Event, currentTarget: HTMLInputElement | HTMLTextAreaElement) => {
    const target = currentTarget;
    const name = target.name as keyof typeof form;
    if (target.type === "checkbox") {
      (form as Record<string, unknown>)[name as string] = (target as HTMLInputElement).checked;
    } else {
      (form as Record<string, unknown>)[name as string] = target.value;
    }
  });

  const handleImageFileChange = $(async (e: Event, currentTarget: HTMLInputElement) => {
    const file = currentTarget.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    try {
      uploadingImage.value = true;
      error.value = "";
      if (localImagePreview.value) URL.revokeObjectURL(localImagePreview.value);
      selectedImageName.value = file.name;
      localImagePreview.value = previewUrl;
      const response = (await uploadProductImage(file)) as { imageUrl: string };
      form.image = response.imageUrl;
      toast.success("Product image uploaded successfully.");
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      localImagePreview.value = "";
      selectedImageName.value = "";
      error.value = (err as Error).message || "Could not upload image.";
    } finally {
      uploadingImage.value = false;
      currentTarget.value = "";
    }
  });

  const handleSubmit = $(async () => {
    error.value = "";
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice.trim() === "" ? undefined : Number(form.compareAtPrice),
      description: form.description.trim(),
      image: form.image.trim(),
      brand: form.brand.trim() || undefined,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      seoTitle: form.seoTitle.trim() || undefined,
      seoDescription: form.seoDescription.trim() || undefined,
      weightGrams: form.weightGrams.trim() === "" ? undefined : Number(form.weightGrams),
      isActive: Boolean(form.isActive),
      isNewArrival: Boolean(form.isNewArrival),
      stock: Number(form.stock),
    };
    try {
      if (editingId.value) {
        await updateProduct(editingId.value, payload);
        toast.success("Product updated successfully.");
      } else {
        await createProduct(payload);
        toast.success("Product added successfully.");
      }
      resetForm();
      await loadProducts();
    } catch (err) {
      if ((err as Error & { status: number }).status === 401 || (err as Error & { status: number }).status === 403) {
        nav("/auth?from=" + encodeURIComponent("/admin/products"));
        return;
      }
      error.value = (err as Error).message || "Could not save product.";
    }
  });

  const handleEdit = $((product: Record<string, unknown>) => {
    if (localImagePreview.value) URL.revokeObjectURL(localImagePreview.value);
    editingId.value = product.id as string;
    Object.assign(form, toFormState(product));
    selectedImageName.value = "";
    localImagePreview.value = "";
    // scroll to form
    const el = document.getElementById("product-form-top");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const handleDelete = $(async (productId: string) => {
    try {
      await deleteProduct(productId);
      toast.success("Product deleted successfully.");
      if (editingId.value === productId) resetForm();
      await loadProducts();
    } catch {
      toast.error("Could not delete product.");
    }
  });

  return (
    <div class="space-y-8">
      <section id="product-form-top" class="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              {editingId.value ? "Edit product" : "Add product"}
            </p>
            <h2 class="mt-2 font-serif text-2xl text-slate-900 sm:text-3xl dark:text-slate-100">
              {editingId.value ? "Update existing item" : "Create a new store item"}
            </h2>
          </div>
          {editingId.value && (
            <button type="button" onClick$={resetForm} class="btn-secondary">
              Cancel edit
            </button>
          )}
        </div>

        <form preventdefault:submit onSubmit$={handleSubmit} class="mt-8 space-y-4">
          <input
            name="name"
            placeholder="Product name"
            aria-label="Product name"
            value={form.name}
            onInput$={(_, el) => ((form as Record<string, unknown>)["name"] = el.value)}
            required
            class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <div class="grid gap-4 md:grid-cols-2">
            <input
              name="slug"
              placeholder="Slug"
              aria-label="Slug"
              value={form.slug}
              onInput$={(_, el) => ((form as Record<string, unknown>)["slug"] = el.value)}
              required
              class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              name="sku"
              placeholder="SKU"
              aria-label="SKU"
              value={form.sku}
              onInput$={(_, el) => ((form as Record<string, unknown>)["sku"] = el.value)}
              required
              class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            aria-label="Price"
            value={form.price}
            onInput$={(_, el) => ((form as Record<string, unknown>)["price"] = el.value)}
            required
            class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            name="compareAtPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="Compare-at price"
            aria-label="Compare-at price"
            value={form.compareAtPrice}
            onInput$={(_, el) => ((form as Record<string, unknown>)["compareAtPrice"] = el.value)}
            class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            name="stock"
            type="number"
            min="0"
            placeholder="Stock quantity"
            aria-label="Stock quantity"
            value={form.stock}
            onInput$={(_, el) => ((form as Record<string, unknown>)["stock"] = el.value)}
            required
            class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <div class="grid gap-4 md:grid-cols-2">
            <input
              name="brand"
              placeholder="Brand"
              aria-label="Brand"
              value={form.brand}
              onInput$={(_, el) => ((form as Record<string, unknown>)["brand"] = el.value)}
              class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <input
            name="tags"
            placeholder="Tags separated by commas"
            aria-label="Tags separated by commas"
            value={form.tags}
            onInput$={(_, el) => ((form as Record<string, unknown>)["tags"] = el.value)}
            class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            name="weightGrams"
            type="number"
            min="0"
            step="1"
            placeholder="Weight in grams"
            aria-label="Weight in grams"
            value={form.weightGrams}
            onInput$={(_, el) => ((form as Record<string, unknown>)["weightGrams"] = el.value)}
            class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            name="image"
            placeholder="Image URL"
            aria-label="Image URL"
            value={form.image}
            onInput$={(_, el) => ((form as Record<string, unknown>)["image"] = el.value)}
            required
            class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <div class="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-800">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Upload product image</label>
            <p class="mt-1 text-sm text-slate-500">Choose an image from your computer.</p>
            <input
              type="file"
              accept="image/*"
              onChange$={handleImageFileChange}
              class="mt-3 block w-full text-sm text-slate-600 dark:text-slate-400"
            />
            <p class="mt-3 text-sm text-slate-600 dark:text-slate-400">{selectedImageName.value || "No file selected yet."}</p>
            {uploadingImage.value && <p class="mt-3 text-sm text-emerald-700 dark:text-emerald-300">Uploading image…</p>}
          </div>
          {(localImagePreview.value || form.image) && (
            <div class="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
              <img src={resolveImageUrl(localImagePreview.value || form.image)} alt="Product preview" class="h-52 w-full object-cover" />
            </div>
          )}
          <textarea
            name="description"
            placeholder="Product description"
            aria-label="Product description"
            value={form.description}
            onInput$={(_, el) => ((form as Record<string, unknown>)["description"] = el.value)}
            rows={5}
            required
            class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            name="seoTitle"
            placeholder="SEO title"
            aria-label="SEO title"
            value={form.seoTitle}
            onInput$={(_, el) => ((form as Record<string, unknown>)["seoTitle"] = el.value)}
            class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <textarea
            name="seoDescription"
            placeholder="SEO description"
            aria-label="SEO description"
            value={form.seoDescription}
            onInput$={(_, el) => ((form as Record<string, unknown>)["seoDescription"] = el.value)}
            rows={3}
            class="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <label class="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.isActive as boolean}
              onChange$={(_, el) => ((form as Record<string, unknown>)["isActive"] = (el as HTMLInputElement).checked)}
            />
            Product is active on the storefront
          </label>
          <label class="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.isNewArrival as boolean}
              onChange$={(_, el) => ((form as Record<string, unknown>)["isNewArrival"] = (el as HTMLInputElement).checked)}
            />
            Show in New Arrivals carousel
          </label>
          <button type="submit" class="btn-admin w-full">
            {editingId.value ? "Update product" : "Add product"}
          </button>
        </form>
      </section>

      <section class="admin-card rounded-xl p-4 shadow-sm sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Product list</p>
            <h2 class="mt-1 font-serif text-xl text-slate-900 sm:text-2xl dark:text-slate-100">Manage store inventory</h2>
          </div>
          <div class="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400">{products.length} items</div>
        </div>

        {error.value && (
          <div class="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error.value}</div>
        )}

        {loading.value ? (
          <div class="mt-6 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">Loading products…</div>
        ) : products.length === 0 ? (
          <div class="mt-6 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">No products yet.</div>
        ) : (
          <div class="mt-6 space-y-3">
            {products.map((product) => (
              <article key={product.id as string | number} class="admin-card grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[96px_1fr] dark:border-slate-800">
                {product.image ? (
                  <img src={resolveImageUrl(product.image as string)} alt={product.name as string} class="h-24 w-full rounded-[1rem] object-cover" />
                ) : (
                  <div class="flex h-24 w-full items-center justify-center rounded-[1rem] border border-dashed border-slate-300 bg-slate-100 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-700 dark:bg-slate-800">No image</div>
                )}
                <div class="flex flex-col justify-between gap-3">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p class="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Rs. {product.price as number}</p>
                      <h3 class="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{product.name as string}</h3>
                      <p class="mt-1 text-xs uppercase tracking-wider text-slate-500">{product.sku as string}{(product.brand as string) ? ` · ${product.brand as string}` : ""}</p>
                      <p class="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{product.description as string}</p>
                    </div>
                    <div class="space-y-1.5">
                      <div class="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400">Stock {product.stock as number}</div>
                      <div class={`rounded-full px-3 py-1 text-xs uppercase tracking-wider ${product.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                        {product.isActive ? "Active" : "Draft"}
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" onClick$={() => handleEdit(product)} class="btn-secondary px-3 py-1.5 text-sm">Edit</button>
                    <button
                      type="button"
                      onClick$={() => {
                        if (window.confirm("Delete this product? This cannot be undone.")) {
                          handleDelete(product.id as string);
                        }
                      }}
                      class="btn-danger px-3 py-1.5 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
});
