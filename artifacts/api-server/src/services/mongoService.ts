import mongoose from "mongoose";
import { HttpError } from "./httpError";

let connectionAttempt: Promise<typeof mongoose> | null = null;

// MongoDB URI ko lazily connect karta hai aur connection errors safe rakhta hai.
export async function connectMongo(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new HttpError(
      503,
      "MongoDB is not set up yet. Add MONGODB_URI in the project Secrets, then restart the app.",
    );
  }

  if (mongoose.connection.readyState === 1) return mongoose;

  if (!connectionAttempt) {
    connectionAttempt = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000 })
      .catch((error: unknown) => {
        connectionAttempt = null;
        throw new HttpError(
          503,
          "MongoDB could not connect. Check the MongoDB URI and Atlas network access.",
        );
      });
  }

  return connectionAttempt;
}