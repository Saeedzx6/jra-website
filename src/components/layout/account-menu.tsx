"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LogIn, UserPlus, LogOut, LayoutDashboard, ChevronDown, User } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Who is signed in, in the header.
 *
 * The header previously showed "Log In" and "Join JRA" unconditionally, so a
 * signed-in admin who navigated to any public page had no indication they were
 * still signed in and no way back to the dashboard short of typing the URL. The
 * session was never gone — it lasts thirty days — it just was not visible
 * anywhere outside /portal.
 *
 * Read through `useSession` rather than by calling `auth()` in the layout on
 * purpose. `auth()` reads cookies, which would opt every page in the site out
 * of static rendering to show one name in a corner. This fetches the session
 * from the client after hydration and leaves the pages static.
 *
 * The cost of that choice is a moment where the state is unknown, which is why
 * `loading` renders a placeholder the same width as the buttons rather than
 * the signed-out state — flashing "Log In" at someone who is signed in is the
 * exact confusion this is meant to remove.
 */

/** Where a role's dashboard lives. Mirrors the guards in middleware.ts. */
function dashboardFor(role: string | undefined) {
  if (role === "ADMIN" || role === "EDITOR") return "/admin";
  return "/portal";
}

export function AccountMenu({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  /** Lets the mobile panel close itself when a link in here is followed. */
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav");
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on an outside click or Escape, the two ways anyone expects a menu
  // like this to go away.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status === "loading") {
    return (
      <div
        aria-hidden="true"
        className="h-9 w-28 animate-pulse rounded-full bg-surface-2"
      />
    );
  }

  if (status !== "authenticated" || !session?.user) {
    return (
      <>
        <Link
          href="/login"
          onClick={onNavigate}
          className="ui-caps lift flex cursor-pointer items-center gap-1.5 rounded-full border border-rule px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-accent/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {t("login")}
        </Link>
        <Link
          href="/membership"
          onClick={onNavigate}
          className="pill-press ui-caps lift flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {t("membership")}
        </Link>
      </>
    );
  }

  const user = session.user;
  const role = user.role as string | undefined;
  const dashboard = dashboardFor(role);
  const name = user.name || user.email || "";
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  // On mobile the menu is already inside an expanded panel, so it renders
  // flat rather than as a second dropdown inside a dropdown.
  if (compact) {
    return (
      <div className="space-y-1">
        <p className="px-2 py-1 text-xs text-ink-faint">
          {t("signedInAs")} <span className="font-medium text-ink-soft">{name}</span>
        </p>
        <Link
          href={dashboard}
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-ink hover:bg-surface-2"
        >
          <LayoutDashboard className="h-4 w-4 text-accent" aria-hidden="true" />
          {dashboard === "/admin" ? t("dashboard") : t("portal")}
        </Link>
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-ink-soft hover:bg-surface-2"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t("logout")}
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        suppressHydrationWarning
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="lift flex cursor-pointer items-center gap-2 rounded-full border border-rule bg-surface px-2 py-1.5 text-sm font-medium text-ink transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white"
        >
          {initial}
        </span>
        <span className="max-w-[9rem] truncate">{name}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute end-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-rule bg-surface"
        >
          <div className="border-b border-rule px-4 py-3">
            <p className="text-xs text-ink-faint">{t("signedInAs")}</p>
            <p className="truncate text-sm font-medium text-ink">{name}</p>
            {user.email && user.email !== name ? (
              <p className="truncate text-xs text-ink-faint" dir="ltr">
                {user.email}
              </p>
            ) : null}
          </div>

          <Link
            href={dashboard}
            role="menuitem"
            onClick={() => { setOpen(false); onNavigate?.(); }}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-surface-2"
          >
            <LayoutDashboard className="h-4 w-4 text-accent" aria-hidden="true" />
            {dashboard === "/admin" ? t("dashboard") : t("portal")}
          </Link>

          {/* An admin is also a member of nothing in particular, but the portal
              is where their own listing lives if they have one, so both routes
              stay reachable rather than guessing. */}
          {dashboard === "/admin" ? (
            <Link
              href="/portal"
              role="menuitem"
              onClick={() => { setOpen(false); onNavigate?.(); }}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-surface-2"
            >
              <User className="h-4 w-4 text-ink-faint" aria-hidden="true" />
              {t("portal")}
            </Link>
          ) : null}

          <button
            suppressHydrationWarning
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className="flex w-full items-center gap-2.5 border-t border-rule px-4 py-2.5 text-sm text-ink-soft hover:bg-surface-2 hover:text-danger-text"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t("logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
