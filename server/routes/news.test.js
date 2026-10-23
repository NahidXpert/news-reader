import assert from "node:assert/strict";
import { test } from "node:test";
import { mapProviderArticle, providerErrorMessage } from "./news.js";

test("explains invalid TheNewsAPI tokens and how to fix them", () => {
  assert.match(providerErrorMessage(401), /NEWS_API_KEY/);
  assert.match(providerErrorMessage(401), /restart the API server/);
});

test("explains subscription restrictions, quotas, and rejected search parameters", () => {
  assert.match(providerErrorMessage(403), /plan/);
  assert.match(providerErrorMessage(429), /request limit/);
  assert.match(providerErrorMessage(400), /request parameters/);
});

test("uses a temporary outage message for provider server errors", () => {
  assert.match(providerErrorMessage(500), /temporarily unavailable/);
});

test("maps TheNewsAPI article fields to the frontend contract", () => {
  assert.deepEqual(mapProviderArticle({
    title: "Example story",
    description: "A short summary",
    image_url: "https://example.com/image.jpg",
    url: "https://example.com/story",
    source: "example.com",
    published_at: "2026-10-23T12:00:00.000000Z",
  }), {
    title: "Example story",
    description: "A short summary",
    imageUrl: "https://example.com/image.jpg",
    url: "https://example.com/story",
    sourceName: "example.com",
    publishedAt: "2026-10-23T12:00:00.000000Z",
  });
});
