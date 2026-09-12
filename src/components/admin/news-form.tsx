"use client";

import { useActionState, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { upsertNewsArticle, deleteNewsArticle } from "@/lib/actions/admin";
import { IDLE } from "@/lib/action-state";
import { SubmitButton, FormStatus } from "@/components/admin/form-controls";

export type NewsRow = {
  id: string;
  title: string;
  bodyHtml: string;
  status: string;
};

export type NewsLabels = {
  title: string;
  body: string;
  draft: string;
  published: string;
  create: string;
  save: string;
  remove: string;
  confirmRemove: string;
  cancel: string;
  coverOnCreate: string;
};

const FIELD =
  "w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm focus:border-accent focus:outline-none";

function Fields({ labels, value }: { labels: NewsLabels; value?: NewsRow }) {
  return (
    <>
      <input
        suppressHydrationWarning
        name="title"
        required
        defaultValue={value?.title ?? ""}
        placeholder={labels.title}
        className={FIELD}
      />
      <textarea
        suppressHydrationWarning
        name="bodyHtml"
        required
        rows={5}
        defaultValue={value?.bodyHtml ?? ""}
        placeholder={labels.body}
        className={FIELD}
      />
      <select
        suppressHydrationWarning
        name="status"
        defaultValue={value?.status ?? "DRAFT"}
        className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm"
      >
        <option value="DRAFT">{labels.draft}</option>
        <option value="PUBLISHED">{labels.published}</option>
      </select>
    </>
  );
}

export function NewsCreateForm({ labels }: { labels: NewsLabels }) {
  const [state, action] = useActionState(upsertNewsArticle, IDLE);

  return (
    <form action={action} className="mt-4 space-y-3">
      <Fields labels={labels} />

      {/* A cover can be chosen here rather than only after the article exists.
          Before, every new article was necessarily created without one and
          then had to be edited to add it. */}
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-ink-soft">
          {labels.coverOnCreate}
        </span>
        <input
          suppressHydrationWarning
          type="file"
          name="cover"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="w-full text-xs text-ink-soft file:me-3 file:rounded-full file:border file:border-rule file:bg-surface file:px-3 file:py-1.5 file:text-xs file:text-ink hover:file:border-ink"
        />
      </label>

      <div>
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

export function NewsEditForm({ article, labels }: { article: NewsRow; labels: NewsLabels }) {
  const [state, action] = useActionState(upsertNewsArticle, IDLE);

  const removeAction = deleteNewsArticle.bind(null, article.id);
  const [deleteState, runDelete] = useActionState(removeAction, IDLE);
  const [confirming, setConfirming] = useState(false);

  return (
    <div>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="id" value={article.id} />
        <Fields labels={labels} value={article} />
        <div>
          <SubmitButton icon={<Save className="h-3.5 w-3.5" aria-hidden="true" />}>
            {labels.save}
          </SubmitButton>
          <div className="mt-2">
            <FormStatus state={state} />
          </div>
        </div>
      </form>

      {/* Its own form, so Enter in a field above can only ever save. The
          confirmation is inline rather than window.confirm(), which is blocked
          in some embedded views — there a delete appears to do nothing. */}
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
