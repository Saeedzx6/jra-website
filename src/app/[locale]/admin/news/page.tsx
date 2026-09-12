import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { NewsGalleryManager } from "@/components/admin/news-gallery";
import { NewsCreateForm, NewsEditForm, type NewsLabels } from "@/components/admin/news-form";

export default async function AdminNewsPage() {
  const articles = await db.newsArticle.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      translations: { where: { locale: "en" } },
      gallery: { orderBy: { id: "asc" } },
    },
  });

  const tn = await getTranslations("admin.nav");
  const ta = await getTranslations("admin.common");
  const tnews = await getTranslations("admin.news");
  const tStatus = await getTranslations("admin.news.statusOptions");
  const tmedia = await getTranslations("admin.media");

  const labels: NewsLabels = {
    title: ta("titlePlaceholder"),
    body: ta("bodyHtmlPlaceholder"),
    draft: tStatus("DRAFT"),
    published: tStatus("PUBLISHED"),
    create: ta("create"),
    save: ta("save"),
    remove: tnews("remove"),
    confirmRemove: tnews("confirmRemove"),
    cancel: tnews("cancel"),
    coverOnCreate: tnews("coverOnCreate"),
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tn("news")}</h1>

      <details className="mt-6 rounded-2xl border border-rule bg-surface p-5">
        <summary className="cursor-pointer font-medium text-ink">{tnews("newArticle")}</summary>
        <NewsCreateForm labels={labels} />
      </details>

      {/* One card per article rather than a divided list: each row now carries
          an edit form, a delete, a cover and a gallery, which a table row of
          text cannot hold legibly. */}
      <div className="mt-6 space-y-4">
        {articles.map((a) => {
          const tr = a.translations[0];
          return (
            <div key={a.id} className="rounded-2xl border border-rule bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink">{tr?.title ?? a.slug}</span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    a.status === "PUBLISHED"
                      ? "bg-olive-soft text-olive-text"
                      : "bg-brass-soft text-brass-text"
                  }`}
                >
                  {tStatus(a.status)}
                </span>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-accent">{ta("edit")}</summary>
                <NewsEditForm
                  article={{
                    id: a.id,
                    title: tr?.title ?? "",
                    bodyHtml: tr?.bodyHtml ?? "",
                    status: a.status,
                  }}
                  labels={labels}
                />
              </details>

              <div className="mt-4 space-y-3">
                <CoverImageField
                  target="news"
                  id={a.id}
                  currentUrl={a.coverImageUrl}
                  label={tmedia("coverImage")}
                  hint={tmedia("coverHintWide")}
                />
                <NewsGalleryManager
                  articleId={a.id}
                  items={a.gallery}
                  labels={{
                    heading: tmedia("galleryHeading"),
                    add: tmedia("galleryAdd"),
                    caption: tmedia("galleryCaption"),
                    empty: tmedia("galleryEmpty"),
                  }}
                />
              </div>
            </div>
          );
        })}
        {articles.length === 0 ? (
          <p className="rounded-2xl border border-rule bg-surface p-5 text-sm text-ink-soft">
            {tnews("empty")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
