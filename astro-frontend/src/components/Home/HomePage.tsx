"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useCurrentUser } from "../../lib/storage";
import type { Product, Review, User } from "../../lib/types";
import { getProducts, getNewArrivals } from "../../lib/api/product";
import { getFeaturedReviews } from "../../lib/api/review";
import { addCartItem } from "../../lib/api/cart";

import ProductCard from "./ProductCard";
import UpcomingProductsSection from "./UpcomingProductsSection";
import TestimonialsSection from "./TestimonialsSection";
import ReviewsSection from "./ReviewsSection";

type BrokenImageId = string | number;

export default function HomePage() {
  const currentUser = useCurrentUser() as User | null;
  const isAdmin = currentUser?.role === "ADMIN";

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [upcomingProducts, setUpcomingProducts] = useState<Product[]>([]);
  const [featuredReviews, setFeaturedReviews] = useState<Review[]>([]);
  const [brokenImages, setBrokenImages] = useState<Set<BrokenImageId>>(
    new Set(),
  );
  const [wishlisted, setWishlisted] = useState<Set<BrokenImageId>>(new Set());
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [products, newArrivals, reviews] = await Promise.all([
          getProducts(),
          getNewArrivals(),
          getFeaturedReviews(),
        ]);

        if (!active) return;

        const safeProducts = Array.isArray(products) ? products : [];
        const safeArrivals = Array.isArray(newArrivals) ? newArrivals : [];
        const safeReviews = Array.isArray(reviews) ? reviews : [];

        setFeaturedProducts(safeProducts.slice(0, 8));
        setUpcomingProducts(
          safeArrivals.filter(
            (product: Product) => product.stock <= 0 || product.isNewArrival,
          ),
        );
        setFeaturedReviews(safeReviews);
      } catch {
        if (active) {
          setFeaturedProducts([]);
          setUpcomingProducts([]);
          setFeaturedReviews([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const handleImageError = useCallback((id: BrokenImageId) => {
    setBrokenImages((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleToggleWishlist = useCallback((product: Product) => {
    setWishlisted((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.add(product.id);
      }
      return next;
    });
  }, []);

  const handleAddToCart = useCallback(
    async (product: Product) => {
      if (isAdmin) {
        toast.error("Admins cannot purchase products");
        return;
      }
      if (product.stock <= 0) {
        toast.error("This product is out of stock");
        return;
      }
      try {
        await addCartItem(product.id, 1);
        toast.success(`Added "${product.name}" to your cart`);
      } catch {
        toast.error("Could not add item to cart. Please try again.");
      }
    },
    [isAdmin],
  );

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-[var(--bg-primary)] to-[var(--bg-primary)] dark:from-emerald-900/30 dark:via-[var(--bg-primary)] dark:to-[var(--bg-primary)]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              Pure moringa, straight from the source
            </p>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
              Nourish your everyday with Moringa Store
            </h1>
            <p className="mt-6 text-lg leading-8 text-[var(--text-secondary)]">
              Explore a thoughtfully curated range of moringa teas, powders, and
              wellness essentials. Browse the full collection before you sign in
              and shop with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/shop"
                className="btn-primary px-6 py-3 text-base font-semibold"
              >
                Shop all products
              </a>
              <a
                href="/shop"
                className="rounded-full border border-[var(--border-color)] px-6 py-3 text-base font-semibold text-[var(--text-primary)] transition hover:border-emerald-300 hover:text-emerald-700 dark:text-emerald-300"
              >
                Browse new arrivals
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-200">
              Featured
            </p>
            <h2 className="mt-2 font-serif text-2xl text-[var(--text-primary)] sm:text-3xl">
              Shop our bestsellers
            </h2>
          </div>
          <a
            href="/shop"
            className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
          >
            View all products →
          </a>
        </div>

        {loading ? (
          <p className="mt-10 text-[var(--text-secondary)]">
            Loading products…
          </p>
        ) : featuredProducts.length === 0 ? (
          <p className="mt-10 text-[var(--text-secondary)]">
            No products available yet. Check back soon.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlisted.has(product.id)}
                isAdmin={isAdmin}
                brokenImages={brokenImages}
                onImageError={handleImageError}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </section>

      <UpcomingProductsSection
        upcomingProducts={upcomingProducts}
        brokenImages={brokenImages}
        onImageError={handleImageError}
      />

      <TestimonialsSection
        testimonialIndex={testimonialIndex}
        onTestimonialIndexChange={setTestimonialIndex}
      />

      <ReviewsSection
        reviewIndex={reviewIndex}
        featuredReviews={featuredReviews}
        onReviewIndexChange={setReviewIndex}
      />
    </>
  );
}
