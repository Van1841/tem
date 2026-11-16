import { Router, type IRouter } from "express";
import {
  GetPlaceSuggestionsQueryParams,
  GetPlaceSuggestionsResponse,
  GetSearchHistoryQueryParams,
  GetSearchHistoryResponse,
  SearchBusinessesBody,
  SearchBusinessesResponse,
} from "@workspace/api-zod";
import requireAuth from "../middlewares/requireAuth";
import { suggestCategories, suggestLocations } from "../services/googlePlacesService";
import { listSearchHistory } from "../services/leadService";
import { runBusinessSearch } from "../services/searchService";

const router: IRouter = Router();

// Searchable location aur category suggestions provide karta hai.
router.get("/places/suggestions", requireAuth, async (req, res): Promise<void> => {
  const params = GetPlaceSuggestionsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Type at least one character to see suggestions." });
    return;
  }

  const items =
    params.data.kind === "category"
      ? suggestCategories(params.data.query)
      : await suggestLocations(params.data.query);
  res.json(GetPlaceSuggestionsResponse.parse({ items }));
});

// Places search chala kar eligible leads aur counters save karta hai.
router.post("/search", requireAuth, async (req, res): Promise<void> => {
  const input = SearchBusinessesBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Enter a location and business category." });
    return;
  }

  const result = await runBusinessSearch({
    location: input.data.location.trim(),
    category: input.data.category.trim(),
  });
  res.json(SearchBusinessesResponse.parse(result));
});

// MongoDB me save hui recent search history return karta hai.
router.get("/searches", requireAuth, async (req, res): Promise<void> => {
  const params = GetSearchHistoryQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Search history limit is invalid." });
    return;
  }

  const result = await listSearchHistory(params.data.limit);
  res.json(GetSearchHistoryResponse.parse(result));
});

export default router;