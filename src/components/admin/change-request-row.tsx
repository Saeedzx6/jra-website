"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { approveChangeRequest, rejectChangeRequest } from "@/lib/actions/admin";

export function ChangeRequestRow({
  id,
  entityType,
  action,
  payload,
  submittedByName,
}: {
  id: string;
  entityType: string;
  action: string;
  payload: Record<string, unknown>;
  submittedByName: string;
}) {
  const tcr = useTranslations("admin.changeRequests");
  const ta = useTranslations("admin.common");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  if (done) {
    return (
      <div className="rounded-2xl border border-rule bg-surface-2 p-5 text-ink-faint">
        {tcr("resultLine", { entityType, status: tcr(`statusLabels.${done}`) })}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rule bg-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="rounded-full bg-brass-soft px-2 py-0.5 text-xs font-medium text-brass-text">
            {entityType}
          </span>
          <span className="ms-2 text-sm text-ink-soft">
            {tcr("byLine", { action, name: submittedByName })}
          </span>
        </div>
        <div className="flex gap-2">
          <button suppressHydrationWarning
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await approveChangeRequest(id);
                setDone("approved");
              })
            }
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {ta("approve")}
          </button>
          <button suppressHydrationWarning
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await rejectChangeRequest(id);
                setDone("rejected");
              })
            }
            className="rounded-full border border-rule px-4 py-1.5 text-xs font-semibold text-ink-soft disabled:opacity-60"
          >
            {ta("reject")}
          </button>
        </div>
      </div>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-2 p-3 text-xs text-ink-soft">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}
