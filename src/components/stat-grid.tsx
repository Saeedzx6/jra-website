import { CountUp } from "@/components/count-up";
import { cx } from "@/lib/ui";

export type Stat = {
  value: number;
  label: string;
  /** Appended to the number, e.g. "+" for "1,300+". */
  suffix?: string;
  /**
   * Whether the number counts up from zero when it scrolls into view.
   * A founding year should not: watching "2002" tick up reads as a quantity
   * rather than a date.
   */
  animate?: boolean;
};

/**
 * A row of figures with captions.
 *
 * The homepage and the About page each wrote this out by hand -- the homepage
 * four times over, once per figure -- so the two drifted and one of the four
 * captions ended up as a hardcoded English string sitting between three
 * translated ones. Passing the figures in as data is what stops that: a new
 * one is a line in an array, not another copy of the markup.
 */
export function StatGrid({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <div className={cx("grid gap-8 text-center", className)}>
      {stats.map(({ value, label, suffix, animate = true }) => (
        <div key={label}>
          <div className="font-display text-4xl font-semibold text-accent">
            {animate ? <CountUp value={value} suffix={suffix} /> : value}
          </div>
          <div className="mt-1 text-sm text-ink-soft">{label}</div>
        </div>
      ))}
    </div>
  );
}
