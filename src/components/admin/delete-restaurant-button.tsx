"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteRestaurant } from "@/lib/actions/admin";

export function DeleteRestaurantButton({
  id,
  name,
  redirectToList,
}: {
  id: string;
  name: string;
  redirectToList?: boolean;
}) {
  const ta = useTranslations("admin.common");
  const tr = useTranslations("admin.restaurants");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!window.confirm(tr("deleteConfirm", { name }))) {
      return;
    }
    startTransition(async () => {
      await deleteRestaurant(id);
      if (redirectToList) router.push("/admin/restaurants");
    });
  }

  return (
    <button suppressHydrationWarning
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="flex items-center gap-1.5 rounded-full border border-accent px-3 py-1.5 text-xs font-semibold text-accent-strong transition-colors hover:bg-accent hover:text-white disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      {ta("delete")}
    </button>
  );
}
