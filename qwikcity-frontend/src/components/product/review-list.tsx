import { component$, useSignal, $ } from "@builder.io/qwik";
import type { Review, ReviewComment } from "~/lib/types";
import { formatMediumDate, renderStars } from "~/lib/formatters";

export interface ReviewListProps {
  reviews: Review[];
  reviewsLoading: boolean;
  isLoggedIn: boolean;
  commentSubmittingId: string | number | null;
  onCommentSubmit: (
    reviewId: string | number,
    content: string,
  ) => Promise<void>;
  productId: string | number;
}

export const ReviewList = component$<ReviewListProps>(
  ({
    reviews,
    reviewsLoading,
    isLoggedIn,
    commentSubmittingId,
    onCommentSubmit,
    productId,
  }) => {
    const commentTexts = useSignal<Record<string | number, string>>({});

    const getCommentText = (reviewId: string | number) => {
      return commentTexts.value[reviewId] ?? "";
    };

    const setCommentText = (reviewId: string | number, value: string) => {
      commentTexts.value = { ...commentTexts.value, [reviewId]: value };
    };

    const handleCommentSubmit = $(
      async (reviewId: string | number, e: Event) => {
        e.preventDefault();
        const content = getCommentText(reviewId)?.trim();
        if (!content) {
          return;
        }
        await onCommentSubmit(reviewId, content);
        setCommentText(reviewId, "");
      },
    );

    if (reviewsLoading) {
      return (
        <div class="mt-8 rounded-[1.5rem] bg-[var(--bg-primary)] p-6 text-sm text-[var(--text-secondary)]">
          Loading reviews...
        </div>
      );
    }

    if (reviews.length === 0) {
      return (
        <div class="mt-8 rounded-[1.5rem] border border-dashed border-[var(--border-strong)] bg-[var(--bg-primary)] p-6 text-sm leading-6 text-[var(--text-secondary)]">
          No buyer reviews yet. The first verified purchase review will appear
          here.
        </div>
      );
    }

    return (
      <div class="mt-8 space-y-6">
        {reviews.map((review) => (
          <article
            key={review.id}
            class="rounded-[1.75rem] border border-[var(--border-color)] bg-[var(--bg-primary)] p-6"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-lg tracking-[0.15em] text-amber-500 dark:text-amber-300">
                  {renderStars(review.rating)}
                </p>
                <h3 class="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                  {review.title || "Verified buyer review"}
                </h3>
                <p class="mt-2 text-sm text-[var(--text-muted)]">
                  {review.user?.name ?? "Anonymous"} on{" "}
                  {formatMediumDate(review.createdAt)}
                </p>
              </div>
            </div>

            <p class="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              {review.content}
            </p>

            <div class="mt-6 border-t border-[var(--border-color)] pt-5">
              <p class="text-sm font-semibold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-200">
                Comments
              </p>

              {Array.isArray(review.comments) && review.comments.length > 0 ? (
                <div class="mt-4 space-y-3">
                  {review.comments.map((comment: ReviewComment) => (
                    <div
                      key={comment.id}
                      class="rounded-2xl bg-[var(--bg-secondary)] px-4 py-3 text-sm"
                    >
                      <p class="font-medium text-[var(--text-primary)]">
                        {comment.user?.name ?? "Anonymous"}
                      </p>
                      <p class="mt-1 leading-6 text-[var(--text-secondary)]">
                        {comment.content}
                      </p>
                      <p class="mt-2 text-sm text-[var(--text-muted)]">
                        {formatMediumDate(comment.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p class="mt-4 text-sm text-[var(--text-muted)]">
                  No comments yet.
                </p>
              )}

              {isLoggedIn ? (
                <form
                  preventdefault:submit
                  onSubmit$={(e) => handleCommentSubmit(review.id, e)}
                  class="mt-4 flex flex-col gap-3"
                >
                  <textarea
                    value={getCommentText(review.id)}
                    onInput$={(e) =>
                      setCommentText(
                        review.id,
                        (e.target as HTMLTextAreaElement).value,
                      )
                    }
                    rows={3}
                    placeholder="Add a thoughtful comment to continue the conversation."
                    aria-label="Add a comment"
                    class="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={commentSubmittingId === review.id}
                    class="btn-secondary self-start disabled:cursor-not-allowed disabled:bg-[var(--bg-muted)]"
                  >
                    {commentSubmittingId === review.id
                      ? "Posting..."
                      : "Post comment"}
                  </button>
                </form>
              ) : (
                <p class="mt-4 text-sm text-[var(--text-muted)]">
                  Sign in to join the discussion.
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    );
  },
);
