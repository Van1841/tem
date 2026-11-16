import type { RequestHandler } from "express";
import { findSession } from "../services/authService";

// Protected API routes ke liye cookie session verify karta hai.
const requireAuth: RequestHandler = (req, res, next) => {
  const user = findSession(req.cookies?.webwin_session);
  if (!user) {
    res.status(401).json({ error: "Please log in to continue." });
    return;
  }

  res.locals.user = user;
  next();
};

export default requireAuth;