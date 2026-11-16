import { Router, type IRouter } from "express";
import { GetSetupStatusResponse } from "@workspace/api-zod";
import { isDemoLoginEnabled } from "../services/authService";

const router: IRouter = Router();

// Sirf required env values ki presence batata hai, secret values kabhi nahi.
router.get("/setup/status", (_req, res): void => {
  res.json(
    GetSetupStatusResponse.parse({
      mongodbConfigured: Boolean(process.env.MONGODB_URI?.trim()),
      googlePlacesConfigured: Boolean(
        process.env.GOOGLE_PLACES_API_KEY?.trim(),
      ),
      demoLoginEnabled: isDemoLoginEnabled(),
    }),
  );
});

export default router;