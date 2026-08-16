import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with later ones winning conflicts.
 *
 * Added for the shadcn-style components under `components/ui`, which expect it
 * at this path. Plain `clsx` is not enough on its own — it concatenates, so
 * `cn("px-4", "px-6")` would emit both and let source order decide. twMerge
 * resolves the conflict to `px-6`, which is what callers passing an override
 * through `className` expect.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
