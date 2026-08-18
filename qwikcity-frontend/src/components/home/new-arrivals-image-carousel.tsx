import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { resolveImageUrl } from "~/lib/config";

interface NewArrivalImage {
  id: string | number;
  url: string;
  alt: string | null;
  comingSoon?: boolean;
}

interface NewArrivalsImageCarouselProps {
  images: NewArrivalImage[];
}

const CARD_GAP = 20;

function getVisibleCount(): number {
  if (typeof window === "undefined") return 3;
  const width = window.innerWidth;
  if (width < 640) return 1;
  if (width < 1024) return 2;
  if (width < 1280) return 3;
  return 4;
}

export const NewArrivalsImageCarousel =
  component$<NewArrivalsImageCarouselProps>(({ images }) => {
    const visibleCount = useSignal(getVisibleCount());
    const currentIndex = useSignal(0);

    useVisibleTask$(() => {
      const handleResize = $(() => {
        const next = getVisibleCount();
        visibleCount.value = next;
        currentIndex.value = Math.min(
          currentIndex.value,
          Math.max(0, images.length - next),
        );
      });

      handleResize();
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    });

    const maxIndex = Math.max(0, images.length - visibleCount.value);

    const scrollToIndex = $((index: number) => {
      const clampedIndex = Math.max(0, Math.min(index, maxIndex));
      currentIndex.value = clampedIndex;

      const card = document.querySelector(
        `[data-carousel-index="${clampedIndex}"]`,
      ) as HTMLElement | null;
      if (!card) return;

      const cardWidth = card.offsetWidth;
      const gap = CARD_GAP;
      const scrollLeft = clampedIndex * (cardWidth + gap);

      card.parentElement?.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    });

    const handlePrev = $(() => {
      scrollToIndex(currentIndex.value - 1);
    });

    const handleNext = $(() => {
      scrollToIndex(currentIndex.value + 1);
    });

    if (images.length === 0) return null;

    return (
      <div class="mt-8">
        <div class="relative">
          <div
            id="new-arrivals-scroll"
            class="carousel-scroll flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth"
          >
            {images.map((image, index) => (
              <article
                key={image.id}
                data-carousel-index={index}
                class="group flex flex-col w-[78vw] max-w-sm shrink-0 snap-start overflow-hidden rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm transition hover:-translate-y-1 card"
              >
                <div class="relative h-60 w-full">
                  {typeof image.url === "string" && image.url.trim() ? (
                    <img
                      src={resolveImageUrl(image.url)}
                      alt={image.alt ?? "New arrival"}
                      width={400}
                      height={300}
                      sizes="(max-width: 640px) 78vw, (max-width: 1280px) 50vw, 300px"
                      class="h-60 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : null}
                  <span class="absolute left-4 top-4 z-10 rounded-full bg-emerald-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white shadow-sm">
                    {image.comingSoon ? "Coming Soon" : "New"}
                  </span>
                  <div class="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-emerald-700 dark:text-emerald-300 shadow-sm backdrop-blur">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="h-4 w-4"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>

                <div class="flex flex-1 flex-col p-6">
                  <p class="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
                    New arrival
                  </p>
                  <h3 class="mt-2 text-xl font-semibold text-[var(--text-primary)] line-clamp-2">
                    {image.alt || "Fresh from the source"}
                  </h3>
                  <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)] line-clamp-2">
                    Discover the latest addition to our collection. Crafted with
                    care and quality in mind.
                  </p>
                  <div class="mt-auto flex items-center gap-2 pt-4">
                    <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      In stock
                    </span>
                    <button
                      type="button"
                      disabled
                      class="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Coming soon
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {images.length > visibleCount.value ? (
            <>
              <span class="absolute left-20 top-1/2 z-10 hidden -translate-y-1/2 text-sm font-medium text-[var(--text-secondary)] sm:block">
                {currentIndex.value + 1}-
                {Math.min(
                  currentIndex.value + visibleCount.value,
                  images.length,
                )}{" "}
                of {images.length}
              </span>
              <button
                type="button"
                onClick$={handlePrev}
                disabled={currentIndex.value === 0}
                class="absolute left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg-secondary)]/90 shadow-md transition hover:bg-[var(--bg-secondary)] disabled:opacity-40 sm:flex"
                aria-label="Previous new arrivals"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-5 w-5 text-[var(--text-secondary)]"
                  aria-hidden="true"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick$={handleNext}
                disabled={currentIndex.value >= maxIndex}
                class="absolute right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg-secondary)]/90 shadow-md transition hover:bg-[var(--bg-secondary)] disabled:opacity-40 sm:flex"
                aria-label="Next new arrivals"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-5 w-5 text-[var(--text-secondary)]"
                  aria-hidden="true"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </>
          ) : null}
        </div>
      </div>
    );
  });
