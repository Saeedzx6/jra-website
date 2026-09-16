"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Save, Trash2, Film } from "lucide-react";
import {
  addAboutSlide,
  updateAboutSlide,
  deleteAboutSlide,
  setAboutVideo,
} from "@/lib/actions/about";
import { IDLE } from "@/lib/action-state";
import { SubmitButton, FormStatus } from "@/components/admin/form-controls";
import { prepareImage, UPLOAD_MAX_BYTES, tooLargeMessage } from "@/lib/prepare-image";

export type SlideRow = {
  id: string;
  imageUrl: string;
  captionEn: string | null;
  captionAr: string | null;
  sortOrder: number;
  isActive: boolean;
};

const FIELD =
  "w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm focus:border-accent focus:outline-none";

/**
 * Carousel and video management for the About page.
 *
 * The upload path resizes in the browser first, for the same reason every
 * other upload here does: a photograph off a camera is larger than a server
 * action's request body can carry, and that failure arrives as a platform 413
 * that no code of ours can turn into a message.
 */
export function AboutManager({
  slides,
  videoUrl,
}: {
  slides: SlideRow[];
  videoUrl: string | null;
}) {
  const t = useTranslations("admin.about");

  const [addState, addAction] = useActionState(
    async (prev: typeof IDLE, formData: FormData) => {
      const picked = formData.get("file");
      if (picked instanceof File && picked.size > 0) {
        const prepared = await prepareImage(picked);
        if (prepared.size > UPLOAD_MAX_BYTES) {
          return { status: "error" as const, message: tooLargeMessage(prepared.size) };
        }
        formData.set("file", prepared, prepared.name);
      }
      return addAboutSlide(prev, formData);
    },
    IDLE
  );

  const [videoState, videoAction] = useActionState(setAboutVideo, IDLE);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-rule bg-surface p-5">
        <h2 className="flex items-center gap-2 font-medium text-ink">
          <Film className="h-4 w-4 text-accent" aria-hidden="true" />
          {t("videoHeading")}
        </h2>
        <p className="mt-1 text-xs text-ink-faint">{t("videoHint")}</p>
        <form action={videoAction} className="mt-4 flex flex-wrap items-start gap-3">
          <input
            suppressHydrationWarning
            name="aboutVideoUrl"
            type="url"
            dir="ltr"
            defaultValue={videoUrl ?? ""}
            placeholder="https://www.youtube.com/watch?v=…"
            className={`${FIELD} min-w-0 flex-1`}
          />
          <SubmitButton icon={<Save className="h-3.5 w-3.5" aria-hidden="true" />}>
            {t("saveVideo")}
          </SubmitButton>
          <div className="w-full">
            <FormStatus state={videoState} />
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-rule bg-surface p-5">
        <h2 className="font-medium text-ink">{t("slidesHeading")}</h2>
        <p className="mt-1 text-xs text-ink-faint">{t("slidesHint")}</p>

        <form action={addAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            suppressHydrationWarning
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            required
            className="text-xs text-ink-soft file:me-3 file:rounded-full file:border file:border-rule file:bg-surface file:px-3 file:py-1.5 file:text-xs file:text-ink hover:file:border-ink sm:col-span-2"
          />
          <input
            suppressHydrationWarning
            name="captionEn"
            placeholder={t("captionEnPlaceholder")}
            className={FIELD}
          />
          <input
            suppressHydrationWarning
            name="captionAr"
            dir="rtl"
            placeholder={t("captionArPlaceholder")}
            className={FIELD}
          />
          <div className="sm:col-span-2">
            <SubmitButton icon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}>
              {t("addSlide")}
            </SubmitButton>
            <div className="mt-2">
              <FormStatus state={addState} />
            </div>
          </div>
        </form>

        <div className="mt-6 space-y-4">
          {slides.map((s) => (
            <SlideRowEditor key={s.id} slide={s} />
          ))}
          {slides.length === 0 ? (
            <p className="text-sm text-ink-soft">{t("noSlides")}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SlideRowEditor({ slide }: { slide: SlideRow }) {
  const t = useTranslations("admin.about");
  const tf = useTranslations("admin.feedback");
  const save = updateAboutSlide.bind(null, slide.id);
  const [state, action] = useActionState(save, IDLE);
  const remove = deleteAboutSlide.bind(null, slide.id);
  const [deleteState, runDelete] = useActionState(remove, IDLE);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="rounded-xl border border-rule bg-paper p-4">
      <div className="flex gap-4">
        <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-lg border border-rule bg-surface-2">
          <Image src={slide.imageUrl} alt="" fill sizes="144px" className="object-cover" />
        </div>

        <form action={action} className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
          <input
            suppressHydrationWarning
            name="captionEn"
            defaultValue={slide.captionEn ?? ""}
            placeholder={t("captionEnPlaceholder")}
            className={FIELD}
          />
          <input
            suppressHydrationWarning
            name="captionAr"
            dir="rtl"
            defaultValue={slide.captionAr ?? ""}
            placeholder={t("captionArPlaceholder")}
            className={FIELD}
          />
          <input
            suppressHydrationWarning
            name="sortOrder"
            type="number"
            defaultValue={slide.sortOrder}
            className={FIELD}
          />
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              suppressHydrationWarning
              type="checkbox"
              name="isActive"
              defaultChecked={slide.isActive}
              className="h-4 w-4 rounded border-rule text-accent"
            />
            {t("showInCarousel")}
          </label>
          <div className="sm:col-span-2">
            <SubmitButton icon={<Save className="h-3.5 w-3.5" aria-hidden="true" />}>
              {t("saveSlide")}
            </SubmitButton>
            <div className="mt-2">
              <FormStatus state={state} />
            </div>
          </div>
        </form>
      </div>

      {/* Its own form, so Enter in a caption can only ever save. */}
      <div className="mt-3 border-t border-rule pt-3">
        {confirming ? (
          <form action={runDelete} className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-soft">{t("confirmDeleteSlide")}</span>
            <SubmitButton
              variant="danger"
              icon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              {tf("remove")}
            </SubmitButton>
            <button
              suppressHydrationWarning
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full border border-rule px-4 py-1.5 text-xs font-medium text-ink-soft"
            >
              {t("cancel")}
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
            {tf("remove")}
          </button>
        )}
        <div className="mt-2">
          <FormStatus state={deleteState} />
        </div>
      </div>
    </div>
  );
}
