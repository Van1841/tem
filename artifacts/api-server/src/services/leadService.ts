import { LeadModel, type LeadDocument } from "../models/Lead";
import { SearchHistoryModel } from "../models/SearchHistory";
import { connectMongo } from "./mongoService";

// MongoDB lead document ko public API shape me normalize karta hai.
function serializeLead(lead: LeadDocument): Record<string, unknown> {
  return {
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
  };
}

// Filter aur pagination ke saath saved leads MongoDB se fetch karta hai.
export async function listLeads(
  query: string | undefined,
  page: number,
  pageSize: number,
): Promise<{
  items: Array<Record<string, unknown>>;
  total: number;
  page: number;
  pageSize: number;
}> {
  await connectMongo();
  const searchFilter = query?.trim()
    ? {
        $or: [
          { name: { $regex: escapeRegex(query.trim()), $options: "i" } },
          { category: { $regex: escapeRegex(query.trim()), $options: "i" } },
          { address: { $regex: escapeRegex(query.trim()), $options: "i" } },
          {
            searchLocation: {
              $regex: escapeRegex(query.trim()),
              $options: "i",
            },
          },
        ],
      }
    : {};

  const [documents, total] = await Promise.all([
    LeadModel.find(searchFilter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    LeadModel.countDocuments(searchFilter),
  ]);

  return {
    items: documents.map(serializeLead),
    total,
    page,
    pageSize,
  };
}

// Latest searches aur unke counters history se read karta hai.
export async function listSearchHistory(limit: number): Promise<{
  items: Array<Record<string, unknown>>;
}> {
  await connectMongo();
  const items = await SearchHistoryModel.find()
    .sort({ searchedAt: -1 })
    .limit(limit);

  return {
    items: items.map((search) => ({
      id: search._id.toString(),
      location: search.location,
      category: search.category,
      searchedAt: search.searchedAt.toISOString(),
      totalProcessed: search.totalProcessed,
      websiteListed: search.websiteListed,
      newLeads: search.newLeads,
      duplicates: search.duplicates,
    })),
  };
}

// Dashboard totals ko live MongoDB records se calculate karta hai.
export async function getDashboardSummary(): Promise<{
  totalLeads: number;
  searchesToday: number;
  latestSearch: Record<string, unknown> | null;
}> {
  await connectMongo();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [totalLeads, searchesToday, latest] = await Promise.all([
    LeadModel.countDocuments(),
    SearchHistoryModel.countDocuments({ searchedAt: { $gte: today } }),
    SearchHistoryModel.findOne().sort({ searchedAt: -1 }),
  ]);

  return {
    totalLeads,
    searchesToday,
    latestSearch: latest
      ? {
          id: latest._id.toString(),
          location: latest.location,
          category: latest.category,
          searchedAt: latest.searchedAt.toISOString(),
          totalProcessed: latest.totalProcessed,
          websiteListed: latest.websiteListed,
          newLeads: latest.newLeads,
          duplicates: latest.duplicates,
        }
      : null,
  };
}

// Mongo regex me user input ko literal rakhta hai.
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}