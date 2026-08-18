import {
  component$,
  useStore,
  useSignal,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import {
  routeLoader$,
  useNavigate,
  useDocumentHead,
} from "@builder.io/qwik-city";
import type {
  Product,
  Review,
  ReviewSummary,
  ReviewComment,
} from "~/lib/types";
import { getProduct, getProducts } from "~/lib/api/product";
import {
  getProductReviews,
  getReviewEligibility,
  createReview,
  createReviewComment,
} from "~/lib/api/review";
import { addToWishlist, removeFromWishlist } from "~/lib/api/wishlist";
import { addCartItem } from "~/lib/api/cart";
import {
  useCurrentUser,
  markAuthChecked,
  CART_CHANGED_EVENT,
  WISHLIST_CHANGED_EVENT,
  getCartItems,
  addWishlistItem,
  removeWishlistItem,
} from "~/lib/storage";
import { resolveImageUrl } from "~/lib/config";
import {
  formatRupees,
  normalizePrice,
  renderStars,
  formatMediumDate,
} from "~/lib/formatters";
import { toast } from "~/lib/toast";
import { useProductViewers } from "~/hooks/useProductViewers";
import { ProductCard } from "~/components/ui/product-card";
import { ProductDetailsInfo } from "~/components/product/product-details-info";
import { RatingSummary } from "~/components/product/rating-summary";
import { ReviewForm } from "~/components/product/review-form";
import { ReviewList } from "~/components/product/review-list";

function normalizeProducts(data: unknown): Product[] {
  if (Array.isArray(data)) return data as Product[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { products?: unknown }).products)
  ) {
    return (data as { products: Product[] }).products;
  }
  return [];
}

function normalizeReviewSummary(data: unknown): ReviewSummary | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (
    typeof obj.averageRating === "number" &&
    typeof obj.reviewCount === "number"
  ) {
    return {
      averageRating: obj.averageRating as number,
      reviewCount: obj.reviewCount as number,
      ratingBreakdown:
        (obj.ratingBreakdown as ReviewSummary["ratingBreakdown"]) ?? [],
    };
  }
  return null;
}

function normalizeReviews(data: unknown): Review[] {
  if (Array.isArray(data)) return data as Review[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { reviews?: unknown }).reviews)
  ) {
    return (data as { reviews: Review[] }).reviews;
  }
  return [];
}

export const useProductData = routeLoader$(async ({ params, error }) => {
  let product: Product | null = null;
  let reviewSummary: ReviewSummary | null = null;
  let initialReviews: Review[] = [];
  let relatedProducts: Product[] = [];
  let productError = "";

  try {
    const productData = await getProduct(params.id);
    product = Array.isArray(productData)
      ? (productData[0] as Product)
      : (productData as Product);
  } catch (err) {
    productError = err instanceof Error ? err.message : "Product not found.";
  }

  if (product) {
    try {
      const reviewsData = await getProductReviews(product.id);
      const raw = reviewsData as unknown;
      if (raw && typeof raw === "object" && "summary" in raw) {
        reviewSummary = normalizeReviewSummary(
          (raw as { summary: unknown }).summary,
        );
        initialReviews = normalizeReviews(
          (raw as unknown as { reviews?: Review[] }).reviews ?? [],
        );
      } else {
        initialReviews = normalizeReviews(raw);
        reviewSummary = {
          averageRating:
            initialReviews.reduce((sum, r) => sum + r.rating, 0) /
            (initialReviews.length || 1),
          reviewCount: initialReviews.length,
          ratingBreakdown: [],
        };
      }
    } catch {
      // reviews optional
    }

    try {
      const allProducts = await getProducts();
      const products = normalizeProducts(allProducts);
      relatedProducts = products
        .filter((p) => p.id !== product.id && p.isActive !== false)
        .slice(0, 4);
    } catch {
      // related products optional
    }
  }

  if (!product && !productError) {
    productError = "Product not found.";
  }

  return {
    product,
    reviewSummary,
    initialReviews,
    relatedProducts,
    error: productError,
  };
});

export const head = {
  title: "Product",
};

export default component$(() => {
  const data = useProductData();
  const nav = useNavigate();
  const userStore = useCurrentUser();

  const isAdmin = useStore({ value: false });

  useVisibleTask$(() => {
    markAuthChecked();
    const user = userStore.user as { role?: string } | null;
    isAdmin.value = Boolean(user?.role === "ADMIN");
  });

  const product = data.value.product;
  const productId = product?.id;

  const quantity = useSignal(1);
  const busy = useSignal(false);
  const addingToCart = useSignal(false);
  const wishlist = useStore<Record<string | number, boolean>>({});
  const brokenImages = useStore<Record<string | number, boolean>>({});

  const reviewItems = useStore<{ items: Review[]; loading: boolean }>({
    items: data.value.initialReviews ?? [],
    loading: false,
  });

  const reviewForm = useStore({ rating: 5, title: "", content: "" });
  const reviewError = useSignal("");
  const submittingReview = useSignal(false);
  const commentSubmittingId = useSignal<string | number | null>(null);
  const reviewEligibility = useStore({
    canReview: false,
    reason: "Sign in to review this product.",
  });

  const activeTab = useSignal<"description" | "reviews" | "details">(
    "description",
  );

  const viewers = useProductViewers(productId as string | number);

  const handleImageError = $((id: string | number) => {
    brokenImages[id] = true;
  });

  const handleAddToCart = $(async () => {
    if (!productId || !product) return;
    if (isAdmin.value) {
      toast.error(
        "Admin accounts cannot add products to cart or place orders.",
      );
      return;
    }

    addingToCart.value = true;
    try {
      await addCartItem(productId, quantity.value);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(CART_CHANGED_EVENT));
      }
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not add item to cart.",
      );
    } finally {
      addingToCart.value = false;
    }
  });

  const handleToggleWishlist = $(async () => {
    if (!productId || !product || isAdmin.value) return;

    const isWishlisted = Boolean(wishlist[productId]);

    try {
      if (isWishlisted) {
        await removeFromWishlist(productId);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(WISHLIST_CHANGED_EVENT));
        }
        delete wishlist[productId];
        toast.info("Removed from your wishlist.");
      } else {
        await addToWishlist(productId);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(WISHLIST_CHANGED_EVENT));
        }
        wishlist[productId] = true;
        toast.success("Added to your wishlist.");
      }
    } catch {
      // ignore
    }
  });

  const handleQuantityChange = $((value: number) => {
    quantity.value = Math.max(1, value);
  });

  const loadReviews = $(async () => {
    if (!productId) return;
    reviewItems.loading = true;
    try {
      const result = await getProductReviews(productId);
      const raw = result as unknown;
      if (
        raw &&
        typeof raw === "object" &&
        "summary" in raw &&
        "reviews" in raw
      ) {
        const obj = raw as { summary: ReviewSummary; reviews: Review[] };
        // summary handled by route loader, just update items
        reviewItems.items = obj.reviews;
      } else {
        reviewItems.items = normalizeReviews(raw);
      }
    } catch {
      reviewItems.items = [];
    } finally {
      reviewItems.loading = false;
    }
  });

  const loadReviewEligibility = $(async () => {
    if (!productId) return;
    const user = userStore.user as { role?: string } | null;
    if (!user) {
      reviewEligibility.canReview = false;
      reviewEligibility.reason = "Sign in to review this product.";
      return;
    }
    try {
      const data = await getReviewEligibility(productId as string | number);
      reviewEligibility.canReview = Boolean(
        (data as { canReview?: boolean }).canReview,
      );
      reviewEligibility.reason =
        (data as { reason?: string }).reason ?? "You can review this product.";
    } catch {
      reviewEligibility.canReview = false;
      reviewEligibility.reason =
        "We could not confirm review eligibility right now.";
    }
  });

  useVisibleTask$(async () => {
    if (!productId) return;
    await loadReviews();
    const user = userStore.user as { role?: string } | null;
    if (user) {
      await loadReviewEligibility();
    }
  });

  useVisibleTask$(({ cleanup }) => {
    const user = userStore.user as { role?: string } | null;

    const syncWishlist = $(() => {
      if (typeof window === "undefined" || isAdmin.value) return;
      try {
        const stored = localStorage.getItem("wishlist-items");
        if (!stored) {
          Object.keys(wishlist).forEach((k) => delete wishlist[k]);
          return;
        }
        const items = JSON.parse(stored) as { id: string | number }[];
        const next: Record<string | number, boolean> = {};
        for (const item of items) {
          next[item.id] = true;
        }
        Object.keys(wishlist).forEach((k) => {
          if (!(k in next)) delete wishlist[k];
        });
        Object.assign(wishlist, next);
      } catch {
        localStorage.removeItem("wishlist-items");
      }
    });

    if (typeof window !== "undefined") {
      window.addEventListener(WISHLIST_CHANGED_EVENT, syncWishlist);
      window.addEventListener("storage", syncWishlist);
    }

    cleanup(() => {
      if (typeof window !== "undefined") {
        window.removeEventListener(WISHLIST_CHANGED_EVENT, syncWishlist);
        window.removeEventListener("storage", syncWishlist);
      }
    });
  });

  useVisibleTask$(() => {
    if (!data.value.product) return;
    const head = useDocumentHead() as unknown as {
      title: string;
      meta: {
        key: string;
        name?: string;
        property?: string;
        content: string;
      }[];
    };
    const p = data.value.product;
    const averageRating = data.value.reviewSummary?.averageRating ?? 0;
    const reviewCount = data.value.reviewSummary?.reviewCount ?? 0;
    const productImage = p.image ? resolveImageUrl(p.image) : undefined;

    if (p.seoTitle || p.name) {
      head.title = p.seoTitle || p.name;
    }

    const description = p.seoDescription || p.description || "";
    if (description) {
      head.meta = [
        ...head.meta.filter((m) => m.key !== "description"),
        { key: "description", name: "description", content: description },
      ];
    }

    if (productImage) {
      head.meta = [
        ...head.meta.filter(
          (m) => m.key !== "og:image" && m.key !== "twitter:image",
        ),
        { key: "og:image", property: "og:image", content: productImage },
        {
          key: "twitter:image",
          property: "twitter:image",
          content: productImage,
        },
      ];
    }
  });

  const handleReviewFormChange = $((name: string, value: string | number) => {
    (reviewForm as Record<string, unknown>)[name] = value;
  });

  const handleReviewSubmit = $(async () => {
    if (!productId || !product) return;
    const user = userStore.user as { role?: string } | null;
    if (!user) {
      toast.error("Please sign in to post a review.");
      return;
    }

    submittingReview.value = true;
    reviewError.value = "";

    try {
      await createReview(productId, {
        rating: reviewForm.rating,
        title: reviewForm.title || undefined,
        content: reviewForm.content,
      });
      reviewForm.rating = 5;
      reviewForm.title = "";
      reviewForm.content = "";
      reviewError.value = "";
      await loadReviews();
      await loadReviewEligibility();
      toast.success("Review posted successfully.");
    } catch (err) {
      reviewError.value =
        err instanceof Error ? err.message : "Could not post your review.";
    } finally {
      submittingReview.value = false;
    }
  });

  const handleCommentSubmit = $(
    async (reviewId: string | number, content: string) => {
      if (!content.trim()) return;
      commentSubmittingId.value = reviewId;
      try {
        const newComment = (await createReviewComment(reviewId, {
          content,
        })) as ReviewComment;
        reviewItems.items = reviewItems.items.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                comments: [...(r.comments ?? []), newComment],
              }
            : r,
        );
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not post your comment.",
        );
      } finally {
        commentSubmittingId.value = null;
      }
    },
  );

  if (data.value.error || !product) {
    return (
      <div class="container-page py-20 text-center">
        <h1 class="text-2xl font-bold">Product not found</h1>
        <p class="mt-2 text-slate-500">{data.value.error}</p>
        <a href="/shop" class="btn-primary mt-6">
          Back to shop
        </a>
      </div>
    );
  }

  const reviewSummary = data.value.reviewSummary ?? {
    averageRating: 0,
    reviewCount: 0,
    ratingBreakdown: [],
  };

  return (
    <div class="bg-[var(--bg-primary)] pb-24 text-[var(--text-primary)]">
      <main>
        <div class="container-page py-10">
          <nav
            class="mb-6 text-sm text-[var(--text-secondary)]"
            aria-label="Breadcrumb"
          >
            <ol class="flex items-center gap-2">
              <li>
                <a href="/" class="hover:text-neon">
                  Home
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <a href="/shop" class="hover:text-neon">
                  Shop
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li
                class="font-medium text-[var(--text-primary)]"
                aria-current="page"
              >
                {product.name}
              </li>
            </ol>
          </nav>

          <button
            type="button"
            onClick$={() => {
              if (typeof window !== "undefined") {
                window.history.back();
              } else {
                nav("/shop");
              }
            }}
            class="btn-secondary mb-8"
          >
            Back
          </button>

          {viewers.connected.value && viewers.viewers.value > 0 ? (
            <div class="mb-4 flex items-center gap-2 rounded-full bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-secondary)] shadow-sm">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                {viewers.viewers.value}{" "}
                {viewers.viewers.value === 1 ? "person" : "people"} viewing this
                product
              </span>
            </div>
          ) : null}

          <ProductDetailsInfo
            product={product}
            reviewSummary={{
              averageRating: reviewSummary.averageRating,
              reviewCount: reviewSummary.reviewCount,
            }}
            isAdmin={isAdmin.value}
            isAddingToCart={addingToCart.value}
            isWishlisted={Boolean(wishlist[product.id])}
            quantity={quantity.value}
            relatedProducts={data.value.relatedProducts}
            brokenImages={brokenImages}
            onImageError={handleImageError}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            onQuantityChange={handleQuantityChange}
          />

          <div class="mt-12">
            <div class="flex gap-2 border-b border-[var(--border-color)]">
              {(["description", "reviews", "details"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick$={() => (activeTab.value = tab)}
                  class={`px-4 py-2 text-sm font-medium capitalize transition ${
                    activeTab.value === tab
                      ? "border-b-2 border-neon text-neon"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div class="mt-8">
              {activeTab.value === "description" ? (
                <div class="rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-sm sm:p-8 card">
                  <p class="text-base font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-200">
                    Description
                  </p>
                  <h2 class="mt-3 font-serif text-2xl text-[var(--text-primary)] sm:text-3xl">
                    Product details
                  </h2>
                  <p class="mt-4 text-base leading-8 text-[var(--text-secondary)]">
                    {product.description ||
                      "No description available for this product."}
                  </p>
                  {product.brand || product.sku ? (
                    <div class="mt-6 grid gap-4 sm:grid-cols-2">
                      {product.brand ? (
                        <div class="rounded-[1.5rem] bg-[var(--bg-primary)] p-5">
                          <p class="text-sm uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                            Brand
                          </p>
                          <p class="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                            {product.brand}
                          </p>
                        </div>
                      ) : null}
                      {product.sku ? (
                        <div class="rounded-[1.5rem] bg-[var(--bg-primary)] p-5">
                          <p class="text-sm uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                            SKU
                          </p>
                          <p class="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                            {product.sku}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {product.weightGrams ? (
                    <div class="mt-4 rounded-[1.5rem] bg-[var(--bg-primary)] p-5">
                      <p class="text-sm uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                        Weight
                      </p>
                      <p class="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                        {product.weightGrams}g
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeTab.value === "reviews" ? (
                <section class="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                  <div class="rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-sm sm:p-8 card">
                    <p class="text-base font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-200">
                      Customer Ratings
                    </p>
                    <h2 class="mt-3 font-serif text-2xl text-[var(--text-primary)] sm:text-3xl">
                      Honest buyer feedback
                    </h2>

                    <RatingSummary
                      averageRating={reviewSummary.averageRating}
                      reviewCount={reviewSummary.reviewCount}
                      ratingBreakdown={reviewSummary.ratingBreakdown}
                    />

                    <ReviewForm
                      canReview={reviewEligibility.canReview}
                      reason={reviewEligibility.reason}
                      isLoggedIn={Boolean(userStore.user)}
                      submittingReview={submittingReview.value}
                      reviewError={reviewError.value}
                      onFormChange={handleReviewFormChange}
                      onSubmit={handleReviewSubmit}
                      productId={product.id}
                    />
                  </div>

                  <div class="rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-sm sm:p-8">
                    <p class="text-base font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-200">
                      Reviews and Comments
                    </p>
                    <h2 class="mt-3 font-serif text-2xl text-[var(--text-primary)] sm:text-3xl">
                      Community conversation
                    </h2>

                    <ReviewList
                      reviews={reviewItems.items}
                      reviewsLoading={reviewItems.loading}
                      isLoggedIn={Boolean(userStore.user)}
                      commentSubmittingId={commentSubmittingId.value}
                      onCommentSubmit={handleCommentSubmit}
                      productId={product.id}
                    />
                  </div>
                </section>
              ) : null}

              {activeTab.value === "details" ? (
                <div class="rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-sm sm:p-8 card">
                  <p class="text-base font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-200">
                    Product Details
                  </p>
                  <h2 class="mt-3 font-serif text-2xl text-[var(--text-primary)] sm:text-3xl">
                    Specifications and availability
                  </h2>

                  <div class="mt-6 grid gap-4 sm:grid-cols-2">
                    <div class="rounded-[1.5rem] bg-[var(--bg-primary)] p-5">
                      <p class="text-sm uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                        Availability
                      </p>
                      <p class="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
                        {product.stock > 0 ? "In stock" : "Out of stock"}
                      </p>
                      <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {product.stock > 0
                          ? `${product.stock} units currently available`
                          : "Currently unavailable for purchase"}
                      </p>
                    </div>

                    <div class="rounded-[1.5rem] bg-[var(--bg-primary)] p-5">
                      <p class="text-sm uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                        Delivery
                      </p>
                      <p class="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
                        {product.stock > 0
                          ? "Dispatches in 1-2 business days"
                          : "Ships when inventory is replenished"}
                      </p>
                      <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        Standard shipping rates are calculated at checkout.
                      </p>
                    </div>
                  </div>

                  {product.tags && product.tags.length > 0 ? (
                    <div class="mt-6 flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <span
                          key={tag}
                          class="rounded-full bg-[var(--bg-muted)] px-3 py-1 text-sm uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {data.value.relatedProducts.length > 0 ? (
            <section class="mt-16">
              <div class="mb-6 flex items-end justify-between">
                <h2 class="text-2xl font-bold">Related products</h2>
                <a
                  href="/shop"
                  class="text-sm font-medium text-neon hover:underline"
                >
                  View all
                </a>
              </div>
              <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {data.value.relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                    isWishlisted={Boolean(wishlist[relatedProduct.id])}
                    isAdmin={isAdmin.value}
                    brokenImages={brokenImages}
                    onImageError={handleImageError}
                    onToggleWishlist={async (p) => {
                      const pid = p.id;
                      const isW = Boolean(wishlist[pid]);
                      try {
                        if (isW) {
                          await removeFromWishlist(pid);
                          if (typeof window !== "undefined") {
                            window.dispatchEvent(
                              new Event(WISHLIST_CHANGED_EVENT),
                            );
                          }
                          delete wishlist[pid];
                          toast.info("Removed from your wishlist.");
                        } else {
                          await addToWishlist(pid);
                          if (typeof window !== "undefined") {
                            window.dispatchEvent(
                              new Event(WISHLIST_CHANGED_EVENT),
                            );
                          }
                          wishlist[pid] = true;
                          toast.success("Added to your wishlist.");
                        }
                      } catch {
                        // ignore
                      }
                    }}
                    onAddToCart={async (p) => {
                      if (isAdmin.value) {
                        toast.error(
                          "Admin accounts cannot add products to cart.",
                        );
                        return;
                      }
                      try {
                        await addCartItem(p.id, 1);
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new Event(CART_CHANGED_EVENT));
                        }
                        toast.success(`${p.name} added to cart`);
                      } catch (err) {
                        toast.error(
                          err instanceof Error
                            ? err.message
                            : "Could not add item to cart.",
                        );
                      }
                    }}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
});
