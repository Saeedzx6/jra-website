"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/rbac";

/**
 * Indicative scoring bands (not an official regulatory benchmark — JRA has
 * no published sustainability standard equivalent to the classification
 * PDFs). Clearly labeled as a self-assessment indicator in the UI.
 */
function bandScore(value: number, bands: [number, number][]): number {
  for (const [threshold, score] of bands) {
    if (value <= threshold) return score;
  }
  return 10;
}

function computeScores(input: {
  energyKwhMonthly: number;
  waterM3Monthly: number;
  foodWasteKgWeekly: number;
  seats: number;
}) {
  const seats = Math.max(1, input.seats);
  const energyPerSeat = input.energyKwhMonthly / seats;
  const waterPerSeat = input.waterM3Monthly / seats;
  const foodWastePerSeat = input.foodWasteKgWeekly / seats;

  const energyScore = bandScore(energyPerSeat, [
    [50, 100],
    [100, 75],
    [150, 50],
    [200, 25],
  ]);
  const waterScore = bandScore(waterPerSeat, [
    [2, 100],
    [4, 75],
    [6, 50],
    [8, 25],
  ]);
  const wasteScore = bandScore(foodWastePerSeat, [
    [1, 100],
    [2, 75],
    [3, 50],
    [5, 25],
  ]);

  const overall = Math.round((energyScore + waterScore + wasteScore) / 3);
  return { energyScore, waterScore, wasteScore, overall };
}

export async function submitSustainabilityAssessment(restaurantId: string, formData: FormData) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const energyKwhMonthly = Number(formData.get("energyKwhMonthly") ?? 0);
  const waterM3Monthly = Number(formData.get("waterM3Monthly") ?? 0);
  const foodWasteKgWeekly = Number(formData.get("foodWasteKgWeekly") ?? 0);
  const seats = Number(formData.get("seats") ?? 1);

  const scores = computeScores({ energyKwhMonthly, waterM3Monthly, foodWasteKgWeekly, seats });

  const now = new Date();
  const assessment = await db.sustainabilityAssessment.create({
    data: {
      restaurantId,
      periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
      periodEnd: now,
      status: "SUBMITTED",
      inputs: {
        create: [
          { metricKey: "energy_kwh_monthly", value: energyKwhMonthly, unit: "kWh" },
          { metricKey: "water_m3_monthly", value: waterM3Monthly, unit: "m3" },
          { metricKey: "food_waste_kg_weekly", value: foodWasteKgWeekly, unit: "kg" },
          { metricKey: "seats", value: seats, unit: "seats" },
        ],
      },
      scores: {
        create: [
          { category: "energy", score: scores.energyScore },
          { category: "water", score: scores.waterScore },
          { category: "food_waste", score: scores.wasteScore },
          { category: "overall", score: scores.overall },
        ],
      },
    },
  });

  await db.restaurant.update({
    where: { id: restaurantId },
    data: { sustainabilityScore: scores.overall },
  });

  revalidatePath("/[locale]/portal/sustainability", "page");
  revalidatePath("/[locale]/restaurants/[slug]", "page");
  return { assessmentId: assessment.id, ...scores };
}
