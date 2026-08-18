import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

export const AnimatedStat = component$<
  {
    values?: string[];
    interval?: number;
    class?: string;
    countTo?: number;
    countFrom?: number;
    duration?: number;
  }
>((props) => {
  const index = useSignal(0);
  const displayNumber = useSignal(props.countFrom ?? 1);

  useVisibleTask$(() => {
    if (props.values && props.values.length > 1) {
      const timer = window.setInterval(() => {
        index.value = (index.value + 1) % props.values!.length;
      }, props.interval ?? 2000);
      return () => window.clearInterval(timer);
    }
  });

  useVisibleTask$(({ track }) => {
    track(() => props.countTo);
    if (props.countTo == null) return;

    const duration = props.duration ?? 1200;
    const startTime = performance.now();
    const startValue = props.countFrom ?? 1;
    const endValue = props.countTo;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      displayNumber.value = Math.round(startValue + (endValue - startValue) * eased);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  });

  const content = (() => {
    if (props.countTo != null) {
      return `${displayNumber.value}+`;
    }
    if (props.values && props.values.length > 0) {
      return props.values[index.value];
    }
    return null;
  })();

  if (!content) return null;

  return (
    <span
      class={`inline-block transition-all duration-500 ease-in-out ${props.class ?? ""}`}
    >
      {content}
    </span>
  );
});
