import { Router } from "express";
import { z } from "zod";

export const newsRouter = Router();
const categories = ["general", "business", "technology", "science", "sports", "health"];
const providerCategories = {
  general: "general",
  business: "business",
  technology: "tech",
  science: "science",
  sports: "sports",
  health: "health",
};
const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.enum(categories).default("general"),
  page: z.coerce.number().int().min(1).max(100).default(1),
});

export function providerErrorMessage(status) {
  if (status === 401) {
    return "TheNewsAPI rejected the token. Check NEWS_API_KEY in your .env file, then restart the API server.";
  }
  if (status === 403) return "TheNewsAPI denied this request. Check that your plan allows this endpoint.";
  if (status === 429) return "TheNewsAPI request limit has been reached. Check your plan and try again later.";
  if (status >= 500) return "TheNewsAPI is temporarily unavailable. Please try again shortly.";
  return "TheNewsAPI could not complete the request. Check your token and request parameters.";
}

export function mapProviderArticle(article) {
  return {
    title: article.title,
    description: article.description || "",
    imageUrl: article.image_url || "",
    url: article.url,
    sourceName: article.source || "News source",
    publishedAt: article.published_at || null,
  };
}

newsRouter.get("/", async (req, res) => {
  if (!process.env.NEWS_API_KEY) {
    return res.status(503).json({ error: "News is unavailable until your TheNewsAPI token is set as NEWS_API_KEY." });
  }
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid news search or category." });
  const { q, category, page } = parsed.data;
  const endpoint = new URL("https://api.thenewsapi.com/v1/news/all");
  endpoint.searchParams.set("api_token", process.env.NEWS_API_KEY);
  endpoint.searchParams.set("limit", "12");
  endpoint.searchParams.set("page", String(page));
  endpoint.searchParams.set("locale", "us");
  endpoint.searchParams.set("language", "en");
  endpoint.searchParams.set("sort", q ? "relevance_score" : "published_at");
  if (q) {
    endpoint.searchParams.set("search", q);
  } else {
    endpoint.searchParams.set("categories", providerCategories[category]);
  }

  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      console.error("TheNewsAPI request rejected:", { status: response.status, code: data.error?.code || "unknown" });
      return res.status(status).json({ error: providerErrorMessage(response.status) });
    }
    const articles = (data.data || [])
      .filter((article) => article.title && article.url && article.title !== "[Removed]")
      .map(mapProviderArticle);
    res.json({ articles, totalResults: data.meta?.found || 0, page, pageSize: 12 });
  } catch (error) {
    console.error("News provider request failed:", error);
    const timedOut = error.name === "TimeoutError";
    res.status(timedOut ? 504 : 502).json({ error: timedOut ? "The news provider took too long to respond." : "Unable to reach the news provider. Please try again." });
  }
});
