"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function upsertBenchmark(formData: FormData) {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) throw new Error("Forbidden");

  const metricKey = String(formData.get("metricKey") ?? "").trim();
  const sectorAvg = Number(formData.get("sectorAvg") ?? 0);
  const unit = String(formData.get("unit") ?? "").trim();
  if (!metricKey) return;

  await db.sustainabilityBenchmark.upsert({
    where: { metricKey },
    update: { sectorAvg, unit },
    create: { metricKey, sectorAvg, unit },
  });

  revalidatePath("/[locale]/admin/sustainability", "page");
}

export async function deleteBenchmark(metricKey: string) {
  const session = await requireRole(["ADMIN", "EDITOR"]);
  if (!session) throw new Error("Forbidden");
  await db.sustainabilityBenchmark.delete({ where: { metricKey } });
  revalidatePath("/[locale]/admin/sustainability", "page");
}
