import {
  component$,
  useSignal,
  useStore,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import {
  getHeroImages,
  createHeroImage,
  updateHeroImage,
  deleteHeroImage,
  uploadHeroImage,
} from "~/lib/api/hero";
import {
  getNewArrivalImages,
  createNewArrivalImage,
  updateNewArrivalImage,
  deleteNewArrivalImage,
  uploadNewArrivalImage,
} from "~/lib/api/new-arrival";
import { resolveImageUrl } from "~/lib/config";
import { toast } from "~/lib/toast";

type Tab = "hero" | "new-arrivals";

export default component$(() => {
  const tab = useSignal<Tab>("hero");
  const heroImages = useStore<Record<string, unknown>[]>([]);
  const newArrivalImages = useStore<Record<string, unknown>[]>([]);
  const saving = useSignal(false);
  const heroUploadPreview = useSignal<string | null>(null);
  const heroUploadFile = useSignal<File | null>(null);
  const newArrivalUploadPreview = useSignal<string | null>(null);
  const newArrivalUploadFile = useSignal<File | null>(null);

  const loadHeroImages = $(async () => {
    try {
      const data = await getHeroImages();
      heroImages.length = 0;
      const list = Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : [];
      list.forEach((img) => heroImages.push(img));
    } catch {
      toast.error("Failed to load hero images");
    }
  });

  const loadNewArrivalImages = $(async () => {
    try {
      const data = await getNewArrivalImages();
      newArrivalImages.length = 0;
      const list = Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : [];
      list.forEach((img) => newArrivalImages.push(img));
    } catch {
      toast.error("Failed to load new arrival images");
    }
  });

  useVisibleTask$(({ cleanup }) => {
    if (tab.value === "hero") void loadHeroImages();
    else void loadNewArrivalImages();

    const timer = setInterval(() => {
      if (heroUploadPreview.value) URL.revokeObjectURL(heroUploadPreview.value);
      if (newArrivalUploadPreview.value)
        URL.revokeObjectURL(newArrivalUploadPreview.value);
    }, 0);
    cleanup(() => clearInterval(timer));
  });

  useVisibleTask$(({ cleanup }) => {
    const handler = $(() => {
      if (heroUploadPreview.value) URL.revokeObjectURL(heroUploadPreview.value);
      if (newArrivalUploadPreview.value)
        URL.revokeObjectURL(newArrivalUploadPreview.value);
    });
    window.addEventListener("beforeunload", handler);
    cleanup(() => window.removeEventListener("beforeunload", handler));
  });

  const activeHeroImages = heroImages.filter((img) => img.active);
  const activeNewArrivalImages = newArrivalImages.filter((img) => img.active);

  const handleHeroFileChange = $(
    (e: Event, currentTarget: HTMLInputElement) => {
      const file = currentTarget.files?.[0] ?? null;
      heroUploadFile.value = file;
      heroUploadPreview.value = file ? URL.createObjectURL(file) : null;
    },
  );

  const handleNewArrivalFileChange = $(
    (e: Event, currentTarget: HTMLInputElement) => {
      const file = currentTarget.files?.[0] ?? null;
      newArrivalUploadFile.value = file;
      newArrivalUploadPreview.value = file ? URL.createObjectURL(file) : null;
    },
  );

  const handleCreateHero = $(
    async (e: Event, currentTarget: HTMLFormElement) => {
      e.preventDefault();
      saving.value = true;
      try {
        const formAlt =
          (currentTarget.elements.namedItem("alt") as HTMLInputElement | null)
            ?.value || "";
        const formSortOrder = Number(
          (
            currentTarget.elements.namedItem(
              "sortOrder",
            ) as HTMLInputElement | null
          )?.value || 0,
        );
        const formActive =
          (
            currentTarget.elements.namedItem(
              "active",
            ) as HTMLInputElement | null
          )?.checked ?? true;

        let url = "";
        let alt = formAlt;
        let sortOrder = formSortOrder;
        let active = formActive;

        if (heroUploadFile.value) {
          const result = await uploadHeroImage(heroUploadFile.value, {
            alt: formAlt,
            sortOrder: formSortOrder,
            active: formActive,
          });
          url = (result as Record<string, unknown>).url as string;
        } else {
          const formData = new FormData(currentTarget);
          url = (formData.get("url") as string) || "";
          alt = (formData.get("alt") as string) || "";
          sortOrder = Number(formData.get("sortOrder") || 0);
          active = formData.get("active") !== "off";
        }

        if (!url) {
          toast.error("Image URL or file is required");
          return;
        }

        if (!heroUploadFile.value) {
          await createHeroImage({ url, alt, sortOrder, active });
        }

        toast.success("Hero image added");
        currentTarget.reset();
        heroUploadFile.value = null;
        heroUploadPreview.value = null;
        await loadHeroImages();
      } catch {
        toast.error("Failed to add hero image");
      } finally {
        saving.value = false;
      }
    },
  );

  const handleCreateNewArrival = $(
    async (e: Event, currentTarget: HTMLFormElement) => {
      e.preventDefault();
      saving.value = true;
      try {
        const formAlt =
          (currentTarget.elements.namedItem("alt") as HTMLInputElement | null)
            ?.value || "";
        const formSortOrder = Number(
          (
            currentTarget.elements.namedItem(
              "sortOrder",
            ) as HTMLInputElement | null
          )?.value || 0,
        );
        const formActive =
          (
            currentTarget.elements.namedItem(
              "active",
            ) as HTMLInputElement | null
          )?.checked ?? true;
        const formComingSoon =
          (
            currentTarget.elements.namedItem(
              "comingSoon",
            ) as HTMLInputElement | null
          )?.checked ?? false;

        let url = "";
        let alt = formAlt;
        let sortOrder = formSortOrder;
        let active = formActive;
        let comingSoon = formComingSoon;

        if (newArrivalUploadFile.value) {
          const result = await uploadNewArrivalImage(
            newArrivalUploadFile.value,
            {
              alt: formAlt,
              sortOrder: formSortOrder,
              active: formActive,
              comingSoon: formComingSoon,
            },
          );
          url = (result as Record<string, unknown>).url as string;
        } else {
          const formData = new FormData(currentTarget);
          url = (formData.get("url") as string) || "";
          alt = (formData.get("alt") as string) || "";
          sortOrder = Number(formData.get("sortOrder") || 0);
          active = formData.get("active") !== "off";
          comingSoon = formData.get("comingSoon") === "on";
        }

        if (!url) {
          toast.error("Image URL or file is required");
          return;
        }

        if (!newArrivalUploadFile.value) {
          await createNewArrivalImage({
            url,
            alt,
            sortOrder,
            active,
            comingSoon,
          });
        }

        toast.success("New arrival image added");
        currentTarget.reset();
        newArrivalUploadFile.value = null;
        newArrivalUploadPreview.value = null;
        await loadNewArrivalImages();
      } catch {
        toast.error("Failed to add new arrival image");
      } finally {
        saving.value = false;
      }
    },
  );

  const handleUpdateHero = $(
    async (id: number, data: Record<string, unknown>) => {
      saving.value = true;
      try {
        await updateHeroImage(id, data);
        toast.success("Hero image updated");
        await loadHeroImages();
      } catch {
        toast.error("Failed to update hero image");
      } finally {
        saving.value = false;
      }
    },
  );

  const handleDeleteHero = $(async (id: number) => {
    saving.value = true;
    try {
      await deleteHeroImage(id);
      toast.success("Hero image removed");
      await loadHeroImages();
    } catch {
      toast.error("Failed to remove hero image");
    } finally {
      saving.value = false;
    }
  });

  const handleUpdateNewArrival = $(
    async (id: number, data: Record<string, unknown>) => {
      saving.value = true;
      try {
        await updateNewArrivalImage(id, data);
        toast.success("New arrival image updated");
        await loadNewArrivalImages();
      } catch {
        toast.error("Failed to update new arrival image");
      } finally {
        saving.value = false;
      }
    },
  );

  const handleDeleteNewArrival = $(async (id: number) => {
    saving.value = true;
    try {
      await deleteNewArrivalImage(id);
      toast.success("New arrival image removed");
      await loadNewArrivalImages();
    } catch {
      toast.error("Failed to remove new arrival image");
    } finally {
      saving.value = false;
    }
  });

  return (
    <section class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
      <div class="flex flex-wrap items-center gap-3">
        <p class="text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          Marketing
        </p>
        <h1 class="font-serif text-3xl text-slate-900 sm:text-4xl dark:text-slate-100">
          New Arrivals & Hero
        </h1>
      </div>
      <p class="mt-2 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
        Manage the hero carousel and curate new arrivals. Changes are reflected
        immediately after the cache refreshes.
      </p>

      <div class="mt-8 inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800">
        <button
          type="button"
          onClick$={() => (tab.value = "hero")}
          class={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tab.value === "hero"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300"
          }`}
        >
          Hero Images
        </button>
        <button
          type="button"
          onClick$={() => (tab.value = "new-arrivals")}
          class={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            tab.value === "new-arrivals"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300"
          }`}
        >
          New Arrivals
        </button>
      </div>

      <div class="mt-8">
        {tab.value === "hero" ? (
          <div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div class="space-y-4">
              <h2 class="font-serif text-2xl text-slate-900 dark:text-slate-100">
                Active hero images
              </h2>
              {activeHeroImages.length === 0 && (
                <p class="text-sm text-slate-500">
                  No active hero images yet. Add one to get started.
                </p>
              )}
              <div class="grid gap-4 sm:grid-cols-2">
                {activeHeroImages.map((image) => (
                  <div
                    key={image.id as string | number}
                    class="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div class="relative h-56 w-full">
                      <img
                        src={resolveImageUrl(image.url as string)}
                        alt={(image.alt as string) || "Hero image"}
                        class="h-full w-full object-cover"
                      />
                    </div>
                    <div class="space-y-3 p-4">
                      <p class="text-sm text-slate-600 dark:text-slate-300">
                        {(image.alt as string) || "No description"}
                      </p>
                      <div class="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick$={() =>
                            handleUpdateHero(image.id as number, {
                              active: !image.active,
                            })
                          }
                          class="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-400"
                        >
                          {image.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick$={() =>
                            handleUpdateHero(image.id as number, {
                              sortOrder: Math.max(
                                0,
                                (image.sortOrder as number) - 1,
                              ),
                            })
                          }
                          class="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-400"
                        >
                          Move left
                        </button>
                        <button
                          type="button"
                          onClick$={() =>
                            handleUpdateHero(image.id as number, {
                              sortOrder: (image.sortOrder as number) + 1,
                            })
                          }
                          class="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-400"
                        >
                          Move right
                        </button>
                        <button
                          type="button"
                          onClick$={() => handleDeleteHero(image.id as number)}
                          class="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div class="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 class="font-serif text-2xl text-slate-900 dark:text-slate-100">
                Add hero image
              </h2>
              <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Upload an image or paste a URL. For best results, use AVIF or
                WebP at 1200×800 or larger.
              </p>
              <form
                preventdefault:submit
                onSubmit$={handleCreateHero}
                class="mt-6 space-y-4"
              >
                <div>
                  <label
                    for="hero-image-file"
                    class="text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    Image file
                  </label>
                  <input
                    id="hero-image-file"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange$={handleHeroFileChange}
                    class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  {heroUploadPreview.value && (
                    <div class="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                      <img
                        src={heroUploadPreview.value}
                        alt="Upload preview"
                        class="h-56 w-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Or Image URL
                  </label>
                  <input
                    name="url"
                    placeholder="/images/hero-5.webp"
                    class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Alt text
                  </label>
                  <input
                    name="alt"
                    placeholder="Fresh moringa harvest"
                    class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Sort order
                    </label>
                    <input
                      name="sortOrder"
                      type="number"
                      class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div class="flex items-center gap-3">
                    <input
                      id="hero-active"
                      name="active"
                      type="checkbox"
                      defaultChecked
                      class="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                    />
                    <label
                      for="hero-active"
                      class="text-sm text-slate-900 dark:text-slate-100"
                    >
                      Active
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  class="btn-primary w-full"
                  disabled={saving.value}
                >
                  {saving.value ? "Saving…" : "Add hero image"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div class="space-y-4">
              <h2 class="font-serif text-2xl text-slate-900 dark:text-slate-100">
                Active new arrival images
              </h2>
              {activeNewArrivalImages.length === 0 && (
                <p class="text-sm text-slate-500">
                  No active new arrival images yet. Add one to get started.
                </p>
              )}
              <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {activeNewArrivalImages.map((image) => (
                  <div
                    key={image.id as string | number}
                    class="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div class="relative h-48 w-full sm:h-56">
                      <img
                        src={resolveImageUrl(image.url as string)}
                        alt={(image.alt as string) || "New arrival image"}
                        class="h-full w-full object-cover"
                      />
                    </div>
                    <div class="space-y-3 p-4">
                      <p class="text-sm text-slate-600 dark:text-slate-300">
                        {(image.alt as string) || "No description"}
                      </p>
                      <div class="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick$={() =>
                            handleUpdateNewArrival(image.id as number, {
                              active: !image.active,
                            })
                          }
                          class="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-400"
                        >
                          {image.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick$={() =>
                            handleUpdateNewArrival(image.id as number, {
                              sortOrder: Math.max(
                                0,
                                (image.sortOrder as number) - 1,
                              ),
                            })
                          }
                          class="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-400"
                        >
                          Move left
                        </button>
                        <button
                          type="button"
                          onClick$={() =>
                            handleUpdateNewArrival(image.id as number, {
                              sortOrder: (image.sortOrder as number) + 1,
                            })
                          }
                          class="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-400"
                        >
                          Move right
                        </button>
                        <button
                          type="button"
                          onClick$={() =>
                            handleUpdateNewArrival(image.id as number, {
                              comingSoon: !image.comingSoon,
                            })
                          }
                          class={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            image.comingSoon
                              ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                              : "border-slate-300 text-slate-600 hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:text-slate-400"
                          }`}
                        >
                          {image.comingSoon ? "Coming Soon" : "Available"}
                        </button>
                        <button
                          type="button"
                          onClick$={() =>
                            handleDeleteNewArrival(image.id as number)
                          }
                          class="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {newArrivalImages.length === 0 && (
                <p class="text-sm text-slate-500">
                  No new arrival images found.
                </p>
              )}
            </div>

            <div class="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 class="font-serif text-2xl text-slate-900 dark:text-slate-100">
                Add new arrival image
              </h2>
              <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Upload an image or paste a URL. For best results, use AVIF or
                WebP at 1200×800 or larger.
              </p>
              <form
                preventdefault:submit
                onSubmit$={handleCreateNewArrival}
                class="mt-6 space-y-4"
              >
                <div>
                  <label
                    for="new-arrival-image-file"
                    class="text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    Image file
                  </label>
                  <input
                    id="new-arrival-image-file"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange$={handleNewArrivalFileChange}
                    class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  {newArrivalUploadPreview.value && (
                    <div class="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                      <img
                        src={newArrivalUploadPreview.value}
                        alt="Upload preview"
                        class="h-48 w-full object-cover sm:h-56"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Or Image URL
                  </label>
                  <input
                    name="url"
                    placeholder="/images/new-arrival-1.webp"
                    class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Alt text
                  </label>
                  <input
                    name="alt"
                    placeholder="Fresh moringa harvest"
                    class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Sort order
                    </label>
                    <input
                      name="sortOrder"
                      type="number"
                      class="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div class="flex items-center gap-3">
                    <input
                      id="new-arrival-active"
                      name="active"
                      type="checkbox"
                      defaultChecked
                      class="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                    />
                    <label
                      for="new-arrival-active"
                      class="text-sm text-slate-900 dark:text-slate-100"
                    >
                      Active
                    </label>
                  </div>
                  <div class="flex items-center gap-3">
                    <input
                      id="new-arrival-coming-soon"
                      name="comingSoon"
                      type="checkbox"
                      class="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                    />
                    <label
                      for="new-arrival-coming-soon"
                      class="text-sm text-slate-900 dark:text-slate-100"
                    >
                      Coming soon
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  class="btn-primary w-full"
                  disabled={saving.value}
                >
                  {saving.value ? "Saving…" : "Add new arrival image"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});
