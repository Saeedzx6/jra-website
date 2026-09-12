"use client";

import { useActionState, useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { SubmitButton, FormStatus } from "@/components/admin/form-controls";
import { createSupplier, updateSupplier, deleteSupplier } from "@/lib/actions/suppliers";
import { IDLE } from "@/lib/action-state";

export type GovernorateOption = { id: string; nameEn: string };

export type SupplierRow = {
  id: string;
  name: string;
  nameAr: string | null;
  shortDescription: string | null;
  addressText: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  governorateId: string | null;
  status: string;
};

export type SupplierLabels = {
  namePlaceholder: string;
  nameArPlaceholder: string;
  descriptionPlaceholder: string;
  addressPlaceholder: string;
  noGovernorate: string;
  phonePlaceholder: string;
  emailPlaceholder: string;
  websitePlaceholder: string;
  draft: string;
  published: string;
  create: string;
  save: string;
  remove: string;
  confirmRemove: string;
  cancel: string;
};

const FIELD =
  "w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm focus:border-accent focus:outline-none";

const EMPTY = IDLE;

function Fields({
  governorates,
  labels,
  value,
}: {
  governorates: GovernorateOption[];
  labels: SupplierLabels;
  value?: SupplierRow;
}) {
  return (
    <>
      <input
        suppressHydrationWarning
        name="name"
        required
        defaultValue={value?.name ?? ""}
        placeholder={labels.namePlaceholder}
        className={FIELD}
      />
      <input
        suppressHydrationWarning
        name="nameAr"
        dir="rtl"
        defaultValue={value?.nameAr ?? ""}
        placeholder={labels.nameArPlaceholder}
        className={FIELD}
      />
      <textarea
        suppressHydrationWarning
        name="shortDescription"
        rows={2}
        defaultValue={value?.shortDescription ?? ""}
        placeholder={labels.descriptionPlaceholder}
        className={`${FIELD} sm:col-span-2`}
      />
      <input
        suppressHydrationWarning
        name="addressText"
        defaultValue={value?.addressText ?? ""}
        placeholder={labels.addressPlaceholder}
        className={FIELD}
      />
      <select
        suppressHydrationWarning
        name="governorateId"
        defaultValue={value?.governorateId ?? ""}
        className={FIELD}
      >
        <option value="">{labels.noGovernorate}</option>
        {governorates.map((g) => (
          <option key={g.id} value={g.id}>
            {g.nameEn}
          </option>
        ))}
      </select>
      <input
        suppressHydrationWarning
        name="phone"
        dir="ltr"
        defaultValue={value?.phone ?? ""}
        placeholder={labels.phonePlaceholder}
        className={FIELD}
      />
      <input
        suppressHydrationWarning
        name="email"
        type="email"
        dir="ltr"
        defaultValue={value?.email ?? ""}
        placeholder={labels.emailPlaceholder}
        className={FIELD}
      />
      <input
        suppressHydrationWarning
        name="website"
        type="url"
        dir="ltr"
        defaultValue={value?.website ?? ""}
        placeholder={labels.websitePlaceholder}
        className={`${FIELD} sm:col-span-2`}
      />
      <select
        suppressHydrationWarning
        name="status"
        defaultValue={value?.status ?? "DRAFT"}
        className={FIELD}
      >
        <option value="DRAFT">{labels.draft}</option>
        <option value="PUBLISHED">{labels.published}</option>
      </select>
    </>
  );
}

export function SupplierCreateForm({
  governorates,
  labels,
}: {
  governorates: GovernorateOption[];
  labels: SupplierLabels;
}) {
  const [state, action] = useActionState(createSupplier, EMPTY);

  return (
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
      <Fields governorates={governorates} labels={labels} />
      <div className="sm:col-span-2">
        <SubmitButton icon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}>
          {labels.create}
        </SubmitButton>
        <div className="mt-2">
          <FormStatus state={state} />
        </div>
      </div>
    </form>
  );
}

export function SupplierEditForm({
  supplier,
  governorates,
  labels,
}: {
  supplier: SupplierRow;
  governorates: GovernorateOption[];
  labels: SupplierLabels;
}) {
  const save = updateSupplier.bind(null, supplier.id);
  const [state, action] = useActionState(save, EMPTY);

  const removeAction = deleteSupplier.bind(null, supplier.id);
  const [deleteState, runDelete] = useActionState(removeAction, EMPTY);
  const [confirming, setConfirming] = useState(false);

  return (
    <div>
      <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2">
        <Fields governorates={governorates} labels={labels} value={supplier} />
        <div className="sm:col-span-2">
          <SubmitButton icon={<Save className="h-3.5 w-3.5" aria-hidden="true" />}>
            {labels.save}
          </SubmitButton>
          <div className="mt-2">
            <FormStatus state={state} />
          </div>
        </div>
      </form>

      {/* Delete is a separate form, so pressing Enter in a field above can only
          ever save. The confirmation step is inline rather than a window
          dialog: a browser confirm() is blocked in some embedded views, and
          the failure mode there is a delete that appears to do nothing. */}
      <div className="mt-2 border-t border-rule pt-3">
        {confirming ? (
          <form action={runDelete} className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-soft">{labels.confirmRemove}</span>
            <SubmitButton
              variant="danger"
              icon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              {labels.remove}
            </SubmitButton>
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full border border-rule px-4 py-1.5 text-xs font-medium text-ink-soft"
            >
              {labels.cancel}
            </button>
          </form>
        ) : (
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-rule px-4 py-1.5 text-xs font-medium text-ink-soft hover:border-danger hover:text-danger-text"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {labels.remove}
          </button>
        )}
        <div className="mt-2">
          <FormStatus state={deleteState} />
        </div>
      </div>
    </div>
  );
}
