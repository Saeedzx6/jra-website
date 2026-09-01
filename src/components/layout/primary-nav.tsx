"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { primaryNav } from "@/lib/nav";

/**
 * Centered primary navigation with an underline indicator that slides between
 * items. The indicator rests on the active route and follows the pointer on
 * hover, returning to the active item on leave.
 */
export function PrimaryNav() {
  const t = useTranslations();
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [style, setStyle] = useState({ x: 0, w: 0 });

  // Longest-prefix match so /news/some-article still lights up "News".
  const activeIndex = primaryNav.reduce((best, item, i) => {
    const hit = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!hit) return best;
    const bestLen = primaryNav[best]?.href.length ?? -1;
    return item.href.length > bestLen ? i : best;
  }, -1);

  const target = hovered ?? (activeIndex === -1 ? null : activeIndex);

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    if (target === null) {
      setReady(false);
      return;
    }
    const el = itemRefs.current[target];
    if (!el) return;
    setStyle({ x: el.offsetLeft, w: el.offsetWidth });
    setReady(true);
  }, [target]);

  useEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    // Web fonts land after first paint and change label widths — remeasure
    // once they're ready so the indicator doesn't sit on a stale width.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);

  return (
    <nav aria-label="Primary" className="hidden xl:block">
      <ul
        ref={listRef}
        className="relative flex items-center gap-1"
        onMouseLeave={() => setHovered(null)}
      >
        {primaryNav.map((item, i) => {
          const active = i === activeIndex;
          return (
            <li key={item.href}>
              <Link
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onMouseEnter={() => setHovered(i)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                // Colours come from --nav-*, which the header flips when it is
                // sitting transparent over the hero. Brand blue is close to
                // invisible against photography, so it resolves to white there.
                className={`block cursor-pointer rounded-md px-3.5 pb-3 pt-2 text-sm tracking-[var(--nav-tracking)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--nav-focus)] ${
                  active
                    ? "font-semibold text-[color:var(--nav-accent)]"
                    : "font-medium text-[color:var(--nav-fg-soft)] hover:text-[color:var(--nav-fg)]"
                }`}
              >
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
        <span
          aria-hidden="true"
          className="nav-indicator"
          data-ready={ready ? "true" : "false"}
          style={
            {
              "--nav-x": `${style.x}px`,
              "--nav-w": `${style.w}px`,
            } as React.CSSProperties
          }
        />
      </ul>
    </nav>
  );
}
