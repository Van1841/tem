import { LeadModel } from "../models/Lead";
import { SearchHistoryModel } from "../models/SearchHistory";
import type { BusinessSearchInput } from "@workspace/api-zod";
import { connectMongo } from "./mongoService";
import { searchPlaces } from "./googlePlacesService";

// Places results filter karke Place ID ke unique upserts aur search stats save karta hai.
export async function runBusinessSearch(
  input: BusinessSearchInput,
): Promise<{
  totalProcessed: number;
  websiteListed: number;
  newLeads: number;
  duplicates: number;
  leads: Array<Record<string, unknown>>;
}> {
  await connectMongo();
  const found = await searchPlaces(input.category, input.location);
  const websiteListed = found.filter((place) => Boolean(place.website)).length;
  const eligible = found.filter((place) => !place.website);
  const uniquePlaces = new Map(eligible.map((place) => [place.placeId, place]));
  const candidates = [...uniquePlaces.values()];

  let newlySaved: Array<Record<string, unknown>> = [];
  if (candidates.length > 0) {
    const operations = candidates.map((place) => ({
      updateOne: {
        filter: { placeId: place.placeId },
        update: {
          $setOnInsert: {
            ...place,
            websiteStatus: "not_listed" as const,
            searchLocation: input.location.trim(),
          },
        },
        upsert: true,
      },
    }));
    const result = await LeadModel.bulkWrite(operations, { ordered: false });
    const insertedIndexes = Object.keys(result.upsertedIds).map(Number);
    const insertedPlaceIds = insertedIndexes
      .map((index) => candidates[index]?.placeId)
      .filter((placeId): placeId is string => Boolean(placeId));
    const inserted = await LeadModel.find({ placeId: { $in: insertedPlaceIds } });
    newlySaved = inserted.map((lead) => ({
      id: lead._id.toString(),
      placeId: lead.placeId,
      name: lead.name,
      category: lead.category,
      address: lead.address,
      location: lead.location,
      phone: lead.phone,
      rating: lead.rating,
      reviewCount: lead.reviewCount,
      website: lead.website,
      websiteStatus: lead.websiteStatus,
      googleMapsUrl: lead.googleMapsUrl,
      searchLocation: lead.searchLocation,
      createdAt: lead.createdAt.toISOString(),
    }));
  }

  const newLeads = newlySaved.length;
  const duplicates = eligible.length - newLeads;
  await SearchHistoryModel.create({
    location: input.location.trim(),
    category: input.category.trim(),
    totalProcessed: found.length,
    websiteListed,
    newLeads,
    duplicates,
  });

  return {
    totalProcessed: found.length,
    websiteListed,
    newLeads,
    duplicates,
    leads: newlySaved,
  };
}