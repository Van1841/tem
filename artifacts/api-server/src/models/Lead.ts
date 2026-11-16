import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
} from "mongoose";

export interface LeadRecord {
  placeId: string;
  name: string;
  category: string;
  address: string;
  location: {
    latitude: number | null;
    longitude: number | null;
  };
  phone: string | null;
  rating: number | null;
  reviewCount: number | null;
  website: string | null;
  websiteStatus: "not_listed";
  googleMapsUrl: string | null;
  searchLocation: string;
  createdAt: Date;
  updatedAt: Date;
}

export type LeadDocument = HydratedDocument<LeadRecord>;

const coordinatesSchema = new Schema(
  {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  { _id: false },
);

const leadSchema = new Schema<LeadRecord>(
  {
    placeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    address: { type: String, required: true },
    location: { type: coordinatesSchema, required: true },
    phone: { type: String, default: null },
    rating: { type: Number, default: null },
    reviewCount: { type: Number, default: null },
    website: { type: String, default: null },
    websiteStatus: { type: String, enum: ["not_listed"], default: "not_listed" },
    googleMapsUrl: { type: String, default: null },
    searchLocation: { type: String, required: true },
  },
  { timestamps: true },
);

leadSchema.index({ createdAt: -1 });

// Place ID par unique index se repeated businesses save nahi hote.
export const LeadModel =
  (models.Lead as Model<LeadRecord> | undefined) ??
  model<LeadRecord>("Lead", leadSchema);