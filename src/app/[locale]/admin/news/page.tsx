import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { upsertNewsArticle } from "@/lib/actions/admin";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { NewsGalleryManager } from "@/components/admin/news-gallery";

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

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tn("news")}</h1>

      <details className="mt-6 rounded-2xl border border-rule bg-surface p-5">
        <summary className="cursor-pointer font-medium text-ink">{tnews("newArticle")}</summary>
        <form action={upsertNewsArticle} className="mt-4 space-y-3">
          <input suppressHydrationWarning
            name="title"
            required
            placeholder={ta("titlePlaceholder")}
            className="w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <textarea suppressHydrationWarning
            name="bodyHtml"
            required
            rows={5}
            placeholder={ta("bodyHtmlPlaceholder")}
            className="w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <select suppressHydrationWarning
            name="status"
            defaultValue="DRAFT"
            className="rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm"
          >
            <option value="DRAFT">{tStatus("DRAFT")}</option>
            <option value="PUBLISHED">{tStatus("PUBLISHED")}</option>
          </select>
          <button suppressHydrationWarning className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white">
            {ta("create")}
          </button>
        </form>
      </details>

      <div className="mt-6 divide-y divide-rule rounded-2xl border border-rule bg-surface">
        {articles.map((a) => (
          <div key={a.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-ink">
                {a.translations[0]?.title ?? a.slug}
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  a.status === "PUBLISHED" ? "bg-olive-soft text-olive-text" : "bg-brass-soft text-brass-text"
                }`}
              >
                {tStatus(a.status)}
              </span>
            </div>
            <div className="mt-3 space-y-3">
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
        ))}
      </div>
    </div>
  );
}
