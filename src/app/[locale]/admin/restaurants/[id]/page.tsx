import { notFound } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { updateRestaurant, uploadRestaurantImage } from "@/lib/actions/admin";
import { RestaurantPhotoManager } from "@/components/admin/restaurant-photos";
import { DeleteRestaurantButton } from "@/components/admin/delete-restaurant-button";
import { PinDropMap } from "@/components/admin/pin-drop-map";

export default async function AdminEditRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const restaurant = await db.restaurant.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      governorate: { select: { nameEn: true } },
    },
  });
  if (!restaurant) notFound();

  const ta = await getTranslations("admin.common");
  const tr = await getTranslations("admin.restaurants");
  const tm = await getTranslations("admin.map");
  const tStatus = await getTranslations("admin.restaurants.statusOptions");

  const action = updateRestaurant.bind(null, id);
  const uploadAction = uploadRestaurantImage.bind(null, id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">{tr("editRestaurant")}</h1>
        <DeleteRestaurantButton id={restaurant.id} name={restaurant.name} redirectToList />
      </div>

      <section className="mt-6 max-w-2xl rounded-2xl border border-rule bg-surface p-5">
        <h2 className="font-display text-base font-semibold text-ink">{tr("photos")}</h2>
        <div className="mt-4">
          <RestaurantPhotoManager restaurantId={restaurant.id} images={restaurant.images} />
        </div>
        <form action={uploadAction} className="mt-4 flex items-center gap-2">
          <input suppressHydrationWarning
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp"
            required
            className="flex-1 text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-accent-strong"
          />
          <button suppressHydrationWarning className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white">
            <ImagePlus className="h-3.5 w-3.5" /> {ta("upload")}
          </button>
        </form>
      </section>

      <section className="mt-6 max-w-2xl rounded-2xl border border-rule bg-surface p-5">
        <h2 className="font-display text-base font-semibold text-ink">{tm("sectionTitle")}</h2>
        <div className="mt-4">
          <PinDropMap
            restaurantId={restaurant.id}
            latitude={restaurant.latitude}
            longitude={restaurant.longitude}
            governorateName={restaurant.governorate?.nameEn ?? null}
          />
        </div>
      </section>

      <form action={action} className="mt-6 max-w-xl space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">{ta("name")}</label>
          <input suppressHydrationWarning
            name="name"
            defaultValue={restaurant.name}
            className="w-full rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">
            {tr("shortDescription")}
          </label>
          <textarea suppressHydrationWarning
            name="shortDescription"
            defaultValue={restaurant.shortDescription ?? ""}
            rows={3}
            className="w-full rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">{ta("status")}</label>
          <select suppressHydrationWarning
            name="status"
            defaultValue={restaurant.status}
            className="rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          >
            <option value="DRAFT">{tStatus("DRAFT")}</option>
            <option value="PUBLISHED">{tStatus("PUBLISHED")}</option>
            <option value="ARCHIVED">{tStatus("ARCHIVED")}</option>
          </select>
        </div>
        <button suppressHydrationWarning
          type="submit"
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          {ta("saveChanges")}
        </button>
      </form>
    </div>
  );
}
