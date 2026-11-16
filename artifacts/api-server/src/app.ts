import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { HttpError } from "./services/httpError";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", router);

// Unexpected errors ko log karta hai par internal details client ko nahi bhejta.
app.use(
  (
    error: unknown,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ): void => {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ error: error.publicMessage });
      return;
    }

    req.log.error({ err: error }, "API request failed");
    res.status(500).json({
      error: "We could not complete that request. Please try again.",
    });
  },
);

export default app;
