import { cache } from "react";
import { db } from "@/lib/db";

export async function getAllStandards() {
  return db.classificationStandard.findMany({
    orderBy: { establishmentType: "asc" },
  });
}

/** Cached per request: the standard pages read this from `generateMetadata`
 *  as well as from the page body. */
export const getStandardWithCriteria = cache(async (establishmentType: string) => {
  return db.classificationStandard.findUnique({
    where: { establishmentType: establishmentType as never },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: { criteria: { orderBy: { sortOrder: "asc" } } },
      },
      starBands: { orderBy: { minScore: "asc" } },
    },
  });
});

export async function getSessionWithDetails(sessionId: string) {
  return db.assessmentSession.findUnique({
    where: { id: sessionId },
    include: {
      restaurant: true,
      answers: true,
    },
  });
}
