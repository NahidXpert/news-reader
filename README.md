# The Daily Briefing

A responsive news reader for discovering stories, searching across publishers, and saving articles in this browser. The React/Vite client requests news through an Express API, which keeps the TheNewsAPI token server-side. Bookmarks are stored locally in the browser, so no database or user accounts are required.

## Features

- News feed with featured lead story, source attribution, summaries, publication dates, and publisher links
- Category filters, debounced keyword search, and pagination
- Loading skeletons, empty states, and clear API error messages
- Saved articles persist across refreshes in the same browser
- Responsive editorial layout, keyboard-visible focus, and reduced-motion support

## Stack and provider

```text
React + Vite -- /api (Vite proxy in development; Vercel Function in production) --> Express --> TheNewsAPI
     `-- browser localStorage: saved articles
```

The server calls TheNewsAPI's `/v1/news/all` endpoint for the feed and searches. It maps the provider's article fields to the frontend response shape; the API token is never sent to the browser. The separate `/v1/news/headlines` endpoint is not used because access to it is restricted on some plans. The `/all` endpoint supports category filtering, search, and pagination. The provider uses `tech` for the Technology category. Articles link to publishers; the app does not scrape pages or claim to show full article text. See [TheNewsAPI documentation](https://www.thenewsapi.com/documentation) for current endpoint and plan details.

## Requirements

- Node.js 20 or newer
- A TheNewsAPI token

## Local setup

1. Install dependencies:

   ```sh
   npm install
   ```

   In Windows PowerShell, use `npm.cmd` if script execution blocks `npm`.

2. Copy `.env.example` to `.env` and set `NEWS_API_KEY` to your TheNewsAPI token. In PowerShell, run `Copy-Item .env.example .env`. Keep `.env` private; do not commit it.
3. Start the API and client together:

   ```sh
   npm run dev
   ```

   In PowerShell, run `npm.cmd run dev`.

4. Open the Vite URL printed in the terminal (normally `http://localhost:5173`).

Vite proxies `/api` to `http://localhost:3000`. No MongoDB or account setup is needed. If the browser still shows the old provider error, stop the existing dev server and run `npm.cmd run dev` again so Node loads the current code and `.env`.

## API

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | API liveness |
| `GET` | `/api/news?q=&category=&page=` | Search or fetch a category from TheNewsAPI |

## Checks

```sh
npm test
npm run build
```

Manual checklist:

- [ ] Feed and categories load using the configured token.
- [ ] Search and pagination return stories.
- [ ] Invalid token, provider plan restrictions, and request limits show clear errors.
- [ ] Saved articles remain after refresh and can be removed.
- [ ] Layout and keyboard navigation work on mobile and desktop.
- [ ] Production build succeeds.

## Production deployment

### Deploy to Vercel

This project builds the Vite frontend as static files in `dist` and runs the Express API as a Vercel Node.js Function through `api/[...path].js`.

1. Import the GitHub repository into Vercel.
2. Set the project **Root Directory** to `FULL_STACK/new-reader` if the repository root contains the parent folder; otherwise select the folder containing this README and `package.json`.
3. Use the Vite framework preset. The repository's `vercel.json` specifies `npm run build` and `dist` as the output directory.
4. In **Project Settings → Environment Variables**, add `NEWS_API_KEY` with your TheNewsAPI token for Preview and Production (and Development if you use Vercel's local tooling). Do not add the token to frontend `VITE_*` variables.
5. Deploy. The Vercel URL serves the frontend, and `/api/news` and `/api/health` are handled by the Express function.

No `CLIENT_ORIGIN` variable is needed for the same-origin Vercel deployment. After changing an environment variable, redeploy for it to take effect. Vercel serves the built static frontend separately; do not use `npm start` as the Vercel build command.

For non-Vercel production hosting, build with `npm run build` and start with `NODE_ENV=production` and `NEWS_API_KEY` configured. Express serves the generated `dist` files locally. Set the token in the hosting provider's secret manager; never put it in frontend code or commit it. Deploy behind HTTPS.

## Limitations

- Saved stories are local to one browser profile/device. Clearing browser site data removes them; they do not sync between devices.
- Only article metadata supplied by TheNewsAPI is shown; full article text remains with the publisher.
- Coverage, quotas, and endpoint access depend on TheNewsAPI's current plan.
