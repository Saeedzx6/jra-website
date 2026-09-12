"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import type { ActionState } from "@/lib/action-state";

/**
 * A submit button that shows it has been pressed.
 *
 * Every form in the back office used a plain <button>. Submitting did nothing
 * visible until the server came back and the page revalidated, which on a slow
 * connection is seconds of silence — so people clicked again, and a second
 * click on a create form makes a second record.
 *
 * `useFormStatus` has to be read from a component *inside* the form, not from
 * the one that renders it, which is why this is its own component rather than
 * a prop on each form.
 *
 * The button keeps its width while pending: the spinner replaces the icon
 * rather than being added next to the label, so the row does not reflow under
 * the cursor mid-click.
 */
export function SubmitButton({
  children,
  icon,
  pendingLabel,
  variant = "primary",
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  /** Shown when idle; swapped for a spinner while the action runs. */
  icon?: React.ReactNode;
  /** Optional label while pending. Falls back to the normal one. */
  pendingLabel?: string;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  const base =
    "pill-press inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
  const styles = {
    primary: "bg-accent px-5 py-2 text-sm text-white hover:bg-accent-strong",
    ghost:
      "border border-rule px-4 py-1.5 text-xs font-medium text-ink-soft hover:border-ink hover:text-ink",
    danger: "bg-danger px-4 py-1.5 text-xs text-white",
  }[variant];

  return (
    <button
      suppressHydrationWarning
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={`${base} ${styles} ${className}`}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

/**
 * Reports the outcome of a submit, then gets out of the way.
 *
 * A success note clears itself after a few seconds. An error does not: an
 * error nobody has dealt with should never disappear on a timer.
 */
export function FormStatus({ state }: { state: ActionState }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    if (state.status !== "ok") return;
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
    // `at` changes on every result, so a repeated save re-shows the note.
  }, [state.status, state.at]);

  if (state.status === "idle" || !state.message || !visible) {
    // Reserve the line so confirming a save does not nudge the layout.
    return <p aria-live="polite" className="min-h-5" />;
  }

  const isError = state.status === "error";
  return (
    <p
      aria-live="polite"
      className={`flex min-h-5 items-start gap-1.5 text-xs ${
        isError ? "text-danger-text" : "text-success-text"
      }`}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      {state.message}
    </p>
  );
}
