"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function HeaderSearch() {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function submit() {
    const q = value.trim();
    setOpen(false);
    router.push(q ? `/restaurants?q=${encodeURIComponent(q)}` : "/restaurants");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("search")}
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <Search className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-rule bg-surface ps-3 pe-1 py-1 shadow-sm animate-fade-rise" style={{ animationDuration: "180ms" }}>
      <Search className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={t("search")}
        suppressHydrationWarning
        className="w-36 bg-transparent px-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none sm:w-48"
      />
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setValue("");
        }}
        aria-label={t("cancel")}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-surface-2 hover:text-ink"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
