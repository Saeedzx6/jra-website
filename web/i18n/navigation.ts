import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware replacements for next/link and the router hooks. Always import
 * Link from here rather than from next/link, so the active locale prefix is
 * carried automatically and the ar/en switch never drops a user on an en page.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
