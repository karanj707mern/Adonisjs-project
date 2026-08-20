import { component$, useSignal } from "@builder.io/qwik";

type SkeletonProps = {
  class?: string;
  variant?: "text" | "rounded" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
};

export const Skeleton = component$<SkeletonProps>(
  ({ class: klass, variant = "rectangular", width, height }) => {
    const style = {
      width: width ?? "100%",
      height: height ?? (variant === "text" ? "1rem" : "100%"),
    };

    const variantClasses: Record<string, string> = {
      text: "rounded",
      rounded: "rounded",
      circular: "rounded-full",
      rectangular: "rounded-lg",
    };

    return (
      <div
        class={`skeleton ${variantClasses[variant]} ${klass ?? ""}`}
        style={style}
        aria-hidden="true"
      />
    );
  },
);

export { ProductCardSkeleton } from "./product-card-skeleton";
