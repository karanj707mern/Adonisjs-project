import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { getActiveHeroImages } from "~/lib/api/hero";
import { resolveImageUrl } from "~/lib/config";
import { useHomeData } from "~/routes/index";

export const Header = component$(() => {
  const data = useHomeData();
  const heroImage = data.value.heroImage;

  const activeImageIndex = useSignal(0);
  const availableImages = useSignal<string[]>(() => {
    if (heroImage) {
      return [heroImage];
    }
    return [
      "/images/home-hero-1.webp",
      "/images/home-hero-2.webp",
      "/images/home-hero-3.webp",
      "/images/home-hero-4.webp",
    ];
  });

  useVisibleTask$(() => {
    if (availableImages.value.length > 0) return;

    let cancelled = false;

    async function fetchHeroImages() {
      try {
        const result = await getActiveHeroImages();
        if (cancelled) return;
        const images = Array.isArray(result) ? result : [];
        const urls = images.map((img) => img.url);
        if (urls.length > 0) {
          availableImages.value = urls;
        }
      } catch {
        // keep fallback
      }
    }

    fetchHeroImages();

    return () => {
      cancelled = true;
    };
  });

  useVisibleTask$(() => {
    if (availableImages.value.length <= 1) return;

    let timer: number | null = null;

    const startCarousel = () => {
      if (timer !== null) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(() => {
        activeImageIndex.value =
          (activeImageIndex.value + 1) % availableImages.value.length;
      }, 3500);
    };

    const stopCarousel = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    startCarousel();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCarousel();
      } else {
        startCarousel();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopCarousel();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  });

  const handleImageError = $((imagePath: string) => {
    availableImages.value = availableImages.value.filter((img) => img !== imagePath);
    if (availableImages.value.length === 0) {
      activeImageIndex.value = 0;
    } else if (activeImageIndex.value >= availableImages.value.length) {
      activeImageIndex.value = availableImages.value.length - 1;
    }
  });

  return (
    <section class="relative overflow-hidden bg-[radial-gradient(circle_at_top,var(--hero-bg-start)_0%,var(--hero-bg-mid)_50%,var(--hero-bg-end)_100%)]">
      <div class="absolute left-0 top-12 h-40 w-40 rounded-full bg-emerald-200/60 blur-3xl dark:bg-emerald-500/10" />
      <div class="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-lime-100 blur-3xl dark:bg-emerald-900/20" />

      <div class="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-16">
        <div class="min-w-0">
          <div class="mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--bg-secondary)] px-8 py-3 text-lg font-medium text-emerald-900 shadow dark:text-emerald-200">
            Pure moringa for everyday wellness
          </div>

          <h1 class="font-serif text-4xl leading-tight text-emerald-900 dark:text-emerald-200 sm:text-5xl lg:text-7xl">
            Pure Moringa
          </h1>

          <h2 class="mt-3 max-w-xl text-2xl font-semibold text-emerald-900 dark:text-emerald-200 sm:text-3xl lg:text-5xl">
            Natural support for energy, immunity, and daily health.
          </h2>

          <p class="mt-6 max-w-lg text-base leading-7 text-[var(--text-secondary)]">
            Discover premium moringa powders, teas, oils, capsules, and wellness
            blends made for modern daily nutrition.
          </p>

          <div class="mt-8 flex flex-wrap gap-4">
            <a href="/shop" class="btn-primary">
              Browse products
            </a>
            <a href="/#products" class="btn-secondary">
              See catalog
            </a>
          </div>

          <div class="mt-10 flex flex-wrap gap-6 sm:gap-10">
            <div>
              <h3 class="text-2xl font-bold text-emerald-900 dark:text-emerald-200">
                8+
              </h3>
              <p class="text-sm text-[var(--text-muted)]">
                Wellness products
              </p>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-emerald-900 dark:text-emerald-200">
                100%
              </h3>
              <p class="text-sm text-[var(--text-muted)]">Natural focus</p>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-emerald-900 dark:text-emerald-200">
                Daily
              </h3>
              <p class="text-sm text-[var(--text-muted)]">
                Wellness routine
              </p>
            </div>
          </div>
        </div>

        <div class="relative min-w-0">
          <div class="relative h-[320px] overflow-hidden rounded-[2rem] shadow-lg sm:h-[380px] lg:h-[450px]">
            {availableImages.value.length > 0 && (
              <img
                src={resolveImageUrl(availableImages.value[0])}
                alt="Hero image"
                onError$={() => void handleImageError(availableImages.value[0])}
                class={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                  activeImageIndex.value === 0
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-105"
                }`}
                fetchPriority="high"
                loading="eager"
              />
            )}
            {availableImages.value.slice(1).map((imagePath, index) => (
              <img
                key={imagePath}
                src={resolveImageUrl(imagePath)}
                alt="Hero image"
                onError$={() => void handleImageError(imagePath)}
                class={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                  index + 1 === activeImageIndex.value
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-105"
                }`}
                loading="lazy"
                fetchPriority="auto"
              />
            ))}

            <div class="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </div>

          <div class="absolute right-4 top-4 flex items-center gap-3 rounded-full bg-[var(--bg-secondary)]/85 px-4 py-3 shadow-sm backdrop-blur">
            {availableImages.value.length > 0 && (
              <span class="text-xs font-medium text-[var(--text-secondary)]">
                {activeImageIndex.value + 1}/{availableImages.value.length}
              </span>
            )}
            <div class="flex gap-2">
              {availableImages.value.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick$={() => {
                    activeImageIndex.value = index;
                  }}
                  class={`h-3 w-3 rounded-full transition-all duration-300 ${
                    index === activeImageIndex.value
                      ? "bg-emerald-700 scale-100"
                      : "bg-[var(--border-color)] hover:bg-[var(--text-muted)] scale-75"
                  }`}
                  aria-label={`Show hero image ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div class="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-[1.5rem] bg-[var(--bg-secondary)] px-4 py-3 shadow-md sm:bottom-6 sm:left-6 sm:right-auto sm:px-5">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              +
            </div>
            <div>
              <p class="text-sm font-semibold text-[var(--text-primary)]">
                Premium quality
              </p>
              <p class="text-sm text-[var(--text-secondary)]">
                Fresh, clean, and naturally sourced
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
