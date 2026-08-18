import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { toast } from "~/lib/toast";
import { getReviewEligibility } from "~/lib/api/review";
import type { ReviewSummary } from "~/lib/types";

export interface ReviewFormProps {
  canReview: boolean;
  reason: string;
  isLoggedIn: boolean;
  submittingReview: boolean;
  reviewError: string;
  onFormChange: (name: string, value: string | number) => void;
  onSubmit: () => Promise<void>;
  productId: string | number;
}

export const ReviewForm = component$<ReviewFormProps>(
  ({
    canReview,
    reason,
    isLoggedIn,
    submittingReview,
    reviewError,
    onFormChange,
    onSubmit,
    productId,
  }) => {
    const localEligibility = useSignal({
      canReview: false,
      reason: "Sign in to review this product.",
    });

    useVisibleTask$(async () => {
      if (!isLoggedIn) {
        localEligibility.value = {
          canReview: false,
          reason: "Sign in to review this product.",
        };
        return;
      }

      try {
        const data = await getReviewEligibility(productId);
        localEligibility.value = {
          canReview: Boolean((data as { canReview?: boolean }).canReview),
          reason:
            (data as { reason?: string }).reason ??
            "You can review this product.",
        };
      } catch {
        localEligibility.value = {
          canReview: false,
          reason: "We could not confirm review eligibility right now.",
        };
      }
    });

    const showForm =
      isLoggedIn && (canReview || localEligibility.value.canReview);

    return (
      <>
        <div class="mt-8 rounded-[1.5rem] border border-dashed border-[var(--border-strong)] bg-[var(--bg-primary)] p-5">
          <p class="text-base font-semibold uppercase tracking-[0.1em] text-[var(--text-primary)]">
            Write a review
          </p>
          <p class="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            {localEligibility.value.reason}
          </p>
        </div>

        {showForm ? (
          <form
            preventdefault:submit
            onSubmit$={async (e: Event) => {
              e.preventDefault();
              await onSubmit();
            }}
            class="mt-6 space-y-4"
          >
            <label class="block text-sm font-medium text-[var(--text-secondary)]">
              Star rating
              <select
                name="rating"
                class="mt-2 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
                value={"5"}
                onChange$={(e) =>
                  onFormChange(
                    "rating",
                    Number((e.target as HTMLSelectElement).value),
                  )
                }
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={String(rating)}>
                    {`${rating} star${rating === 1 ? "" : "s"}`}
                  </option>
                ))}
              </select>
            </label>

            <input
              name="title"
              placeholder="Short headline"
              aria-label="Review title"
              class="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
              onInput$={(e) =>
                onFormChange("title", (e.target as HTMLInputElement).value)
              }
            />

            <div>
              <label
                htmlFor="reviewContent"
                class="block text-sm font-medium text-[var(--text-secondary)]"
              >
                Your review
              </label>
              <textarea
                id="reviewContent"
                name="content"
                placeholder="Share what you liked, what stood out, and how you used it."
                rows={5}
                required
                class="mt-2 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
                onInput$={(e) =>
                  onFormChange(
                    "content",
                    (e.target as HTMLTextAreaElement).value,
                  )
                }
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              class="btn-admin disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submittingReview ? "Posting review..." : "Post review"}
            </button>
          </form>
        ) : null}

        {reviewError ? (
          <div class="mt-6 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger-text)]">
            {reviewError}
          </div>
        ) : null}
      </>
    );
  },
);
