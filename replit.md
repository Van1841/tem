# WebWin

Sales teams use WebWin to discover businesses Google Places does not provide a listed website for, save potential leads to MongoDB, and review search results.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server on its configured `PORT`
- `pnpm --filter @workspace/webwin run dev` — run the WebWin frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required secrets: `MONGODB_URI`, `GOOGLE_PLACES_API_KEY`
- Optional login secrets: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SALES_EMAIL`, `SALES_PASSWORD`
- See `SETUP.md` for MongoDB Atlas, Google Places, and demo login instructions.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: MongoDB + Mongoose
- Validation: Zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (ESM bundle)

## Where things live

- `artifacts/api-server/src/routes/` — API endpoints
- `artifacts/api-server/src/services/` — authentication, MongoDB, Google Places, and lead/search logic
- `artifacts/api-server/src/models/` — Mongoose schemas
- `artifacts/webwin/src/` — React dashboard and login
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `SETUP.md` — external service connection instructions

## Architecture decisions

- MongoDB is the application data store; the workspace PostgreSQL scaffold is not used for WebWin data.
- Google Places credentials are used only by the API server, never by browser code.
- A missing Google Places website field is labeled “Website not listed”; it is not proof a business has no website.
- Demo credentials are available only outside production.

## Product

V1 supports admin and sales login, business discovery through Google Places, Place ID deduplication, MongoDB-backed leads and search statistics, and setup guidance.

## User preferences

- Keep MongoDB URI and Google Places API key blank until the user adds them through Replit Secrets.
- Do not add features outside WebWin V1.

## Gotchas

- Restart the API Server workflow after adding or changing MongoDB or Google Places secrets.
- Google Places searches can consume API quota; each request is capped at three result pages.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
