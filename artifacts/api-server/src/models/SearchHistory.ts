import { Schema, model, models, type Model } from "mongoose";

export interface SearchHistoryRecord {
  location: string;
  category: string;
  searchedAt: Date;
  totalProcessed: number;
  websiteListed: number;
  newLeads: number;
  duplicates: number;
}

const searchHistorySchema = new Schema<SearchHistoryRecord>(
  {
    location: { type: String, required: true },
    category: { type: String, required: true },
    searchedAt: { type: Date, required: true, default: Date.now },
    totalProcessed: { type: Number, required: true, default: 0 },
    websiteListed: { type: Number, required: true, default: 0 },
    newLeads: { type: Number, required: true, default: 0 },
    duplicates: { type: Number, required: true, default: 0 },
  },
  { timestamps: false },
);

searchHistorySchema.index({ searchedAt: -1 });

// Search ke filters aur counts future reporting ke liye store karta hai.
export const SearchHistoryModel =
  (models.SearchHistory as Model<SearchHistoryRecord> | undefined) ??
  model<SearchHistoryRecord>("SearchHistory", searchHistorySchema);