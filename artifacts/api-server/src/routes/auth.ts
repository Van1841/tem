import { Router, type IRouter } from "express";
import {
  GetCurrentUserResponse,
  LoginBody,
  LoginResponse,
} from "@workspace/api-zod";
import requireAuth from "../middlewares/requireAuth";
import {
  authenticate,
  createSession,
  deleteSession,
} from "../services/authService";

const router: IRouter = Router();
const sessionCookie = "webwin_session";

// Demo ya environment credentials se secure cookie session start karta hai.
router.post("/auth/login", (req, res): void => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid email and password." });
    return;
  }

  const user = authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    res.status(401).json({ error: "Email or password is incorrect." });
    return;
  }

  const id = createSession(user);
  res.cookie(sessionCookie, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  });
  res.json(LoginResponse.parse(user));
});

// Active session ka role aur email frontend ko deta hai.
router.get("/auth/me", requireAuth, (_req, res): void => {
  res.json(GetCurrentUserResponse.parse(res.locals.user));
});

// Current cookie ko expire karke session invalidate karta hai.
router.post("/auth/logout", (req, res): void => {
  deleteSession(req.cookies?.[sessionCookie]);
  res.clearCookie(sessionCookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  res.json({ success: true });
});

export default router;