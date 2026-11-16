import { HttpError } from "./httpError";

const PLACES_ROOT = "https://places.googleapis.com/v1";
const PLACE_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.primaryTypeDisplayName",
  "places.types",
  "places.formattedAddress",
  "places.location",
  "places.nationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.googleMapsUri",
  "nextPageToken",
].join(",");

interface GoogleText {
  text?: string;
}

interface GooglePlace {
  id?: string;
  displayName?: GoogleText;
  primaryTypeDisplayName?: GoogleText;
  types?: string[];
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  googleMapsUri?: string;
}

interface PlacesSearchResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
}

interface AutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: GoogleText;
    };
  }>;
}

export interface NormalizedPlace {
  placeId: string;
  name: string;
  category: string;
  address: string;
  location: { latitude: number | null; longitude: number | null };
  phone: string | null;
  rating: number | null;
  reviewCount: number | null;
  website: string | null;
  googleMapsUrl: string | null;
}

const categorySuggestions = [
  "Accountant",
  "Auto repair shop",
  "Bakery",
  "Beauty salon",
  "Cafe",
  "Dentist",
  "Doctor",
  "Electrician",
  "Florist",
  "Gym",
  "Hotel",
  "Lawyer",
  "Marketing agency",
  "Moving company",
  "Pet groomer",
  "Photographer",
  "Plumber",
  "Real estate agency",
  "Restaurant",
  "Veterinarian",
];

// Google Places API key ko sirf backend request headers me use karta hai.
function apiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) {
    throw new HttpError(
      503,
      "Google Places is not set up yet. Add GOOGLE_PLACES_API_KEY in the project Secrets.",
    );
  }
  return key;
}

// Google Places HTTP failures ko safe, actionable errors me badalta hai.
async function placesRequest<T>(
  path: string,
  body: Record<string, unknown>,
  fieldMask?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey(),
  };
  if (fieldMask) headers["X-Goog-FieldMask"] = fieldMask;

  let response: Response;
  try {
    response = await fetch(`${PLACES_ROOT}/${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new HttpError(
      502,
      "Google Places could not be reached. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new HttpError(
        429,
        "Google Places request limit reached. Wait a moment and try again.",
      );
    }
    throw new HttpError(
      502,
      "Google Places request failed. Check that Places API (New) is enabled and the key is permitted to use it.",
    );
  }

  return (await response.json()) as T;
}

// Google Places Text Search se limited pages laakar normalized business data deta hai.
export async function searchPlaces(
  category: string,
  location: string,
): Promise<NormalizedPlace[]> {
  const places: GooglePlace[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < 3; page += 1) {
    if (pageToken) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    const body: Record<string, unknown> = {
      textQuery: `${category} in ${location}`,
      pageSize: 20,
      ...(pageToken ? { pageToken } : {}),
    };
    const response = await placesRequest<PlacesSearchResponse>(
      "places:searchText",
      body,
      PLACE_FIELD_MASK,
    );
    places.push(...(response.places ?? []));
    pageToken = response.nextPageToken;
    if (!pageToken) break;
  }

  return places
    .filter((place): place is GooglePlace & { id: string } => Boolean(place.id))
    .map((place) => ({
      placeId: place.id,
      name: place.displayName?.text?.trim() || "Unnamed business",
      category:
        place.primaryTypeDisplayName?.text ||
        place.types?.[0]?.replaceAll("_", " ") ||
        category,
      address: place.formattedAddress || "",
      location: {
        latitude: place.location?.latitude ?? null,
        longitude: place.location?.longitude ?? null,
      },
      phone: place.nationalPhoneNumber || null,
      rating: place.rating ?? null,
      reviewCount: place.userRatingCount ?? null,
      website: place.websiteUri?.trim() || null,
      googleMapsUrl: place.googleMapsUri || null,
    }));
}

// Location input ke liye Google Places Autocomplete suggestions return karta hai.
export async function suggestLocations(query: string): Promise<
  Array<{ value: string; label: string }>
> {
  const response = await placesRequest<AutocompleteResponse>(
    "places:autocomplete",
    {
      input: query,
      includedPrimaryTypes: [
        "locality",
        "administrative_area_level_1",
        "country",
      ],
    },
  );

  const unique = new Map<string, { value: string; label: string }>();
  for (const suggestion of response.suggestions ?? []) {
    const label = suggestion.placePrediction?.text?.text?.trim();
    if (label && !unique.has(label)) unique.set(label, { value: label, label });
  }

  return [...unique.values()].slice(0, 6);
}

// Category autocomplete ko lightweight local suggestions se chalata hai.
export function suggestCategories(
  query: string,
): Array<{ value: string; label: string }> {
  const normalized = query.trim().toLowerCase();
  return categorySuggestions
    .filter((category) => category.toLowerCase().includes(normalized))
    .slice(0, 8)
    .map((category) => ({ value: category, label: category }));
}