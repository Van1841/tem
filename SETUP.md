# WebWin setup

WebWin keeps both integration credentials on the API server. Never put a MongoDB URI or Google API key in React/Vite client variables such as `VITE_*`. Replit's official [Secrets guide](https://docs.replit.com/core-concepts/project-editor/app-setup/secrets) explains how to add them without committing them to source.

## 1. Add secrets in Replit

Open the project **Secrets** panel and add:

| Secret | Value |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `GOOGLE_PLACES_API_KEY` | A Google Cloud API key allowed to call Places API (New) |

After adding or changing either secret, restart the API Server workflow. `.env.example` contains blank placeholders only.

## 2. MongoDB Atlas

1. Create or choose a MongoDB Atlas project and cluster.
2. Create a database user with a strong password and access limited to the WebWin database.
3. In **Network Access**, allow the application's outbound connection. Prefer a trusted fixed egress IP if your hosting setup provides one; avoid broad `0.0.0.0/0` access unless you understand the exposure.
4. Choose **Connect → Drivers**, select Node.js, and copy the connection string.
5. Replace `<password>` with the database user's password and set a database name, for example `webwin`.
6. Save the full string as `MONGODB_URI` in Replit Secrets. Do not put it in chat, source files, or commits.

## 3. Google Places API (New)

1. In Google Cloud Console, create or select a project and attach billing as Google Maps Platform requires.
2. Enable **Places API (New)** for that project.
3. Create an API key and restrict it to **Places API (New)**. Keep it server-side; WebWin sends requests from Express and does not expose it to the browser.
4. Save the key as `GOOGLE_PLACES_API_KEY` in Replit Secrets.
5. Restart the API Server workflow, then use a location and business category to run a search.

## Demo login

The local development server accepts these demo accounts when `NODE_ENV` is not `production`:

- Admin: `admin@webwin.demo` / `WebWinAdmin2026!`
- Sales: `sales@webwin.demo` / `WebWinSales2026!`

Production has no demo-account fallback. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SALES_EMAIL`, and `SALES_PASSWORD` as Replit Secrets before enabling production login.

## Run locally

Start the managed **API Server** and **WebWin** workflows from the project. Saved leads and search history are stored in the MongoDB database configured by `MONGODB_URI`.

Businesses without a `websiteUri` are marked **Website not listed**. That only means Google Places did not provide a website; it does not prove the business has no website.