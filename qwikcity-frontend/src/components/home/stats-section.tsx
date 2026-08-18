import { component$ } from "@builder.io/qwik";
import { AnimatedStat } from "./animated-stat";
import { ClockAnimation } from "./clock-animation";

interface StatsSectionProps {
  // No props needed - matches the hardcoded Next.js stats
}

export const StatsSection = component$<StatsSectionProps>(() => {
  return (
    <div class="grid gap-4 rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-sm sm:grid-cols-3 lg:grid-cols-1 card">
      <div class="group">
        <p class="text-3xl font-semibold text-[var(--text-primary)] transition-transform duration-300 group-hover:scale-110">
          <AnimatedStat countTo={8} />
        </p>
        <p class="mt-2 text-base text-[var(--text-secondary)]">
          Store products ready to browse
        </p>
      </div>
      <div class="group">
        <p class="text-3xl font-semibold text-[var(--text-primary)] transition-transform duration-300 group-hover:scale-110">
          <AnimatedStat values={["4.9", "4.8", "5.0", "4.7", "4.9"]} />
        </p>
        <p class="mt-2 text-base text-[var(--text-secondary)]">
          Average satisfaction across featured reviews
        </p>
      </div>
      <div class="group">
        <p class="text-3xl font-semibold text-[var(--text-primary)] transition-transform duration-300 group-hover:scale-110">
          <ClockAnimation />
        </p>
        <p class="mt-2 text-base text-[var(--text-secondary)]">
          Open storefront for guest visitors
        </p>
      </div>
    </div>
  );
});
