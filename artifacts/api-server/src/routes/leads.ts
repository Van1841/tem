import { Router, type IRouter } from "express";
import {
  GetDashboardSummaryResponse,
  GetLeadsQueryParams,
  GetLeadsResponse,
} from "@workspace/api-zod";
import requireAuth from "../middlewares/requireAuth";
import { getDashboardSummary, listLeads } from "../services/leadService";

const router: IRouter = Router();

// Saved MongoDB leads ko filter aur page karke return karta hai.
router.get("/leads", requireAuth, async (req, res): Promise<void> => {
  const params = GetLeadsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Lead filters are invalid." });
    return;
  }

  const result = await listLeads(
    params.data.query,
    params.data.page,
    params.data.pageSize,
  );
  res.json(GetLeadsResponse.parse(result));
});

// Dashboard ke totals aur latest search provide karta hai.
router.get(
  "/dashboard/summary",
  requireAuth,
  async (_req, res): Promise<void> => {
    const result = await getDashboardSummary();
    res.json(GetDashboardSummaryResponse.parse(result));
  },
);

export default router;