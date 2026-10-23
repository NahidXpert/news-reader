const storageKey = "daily-briefing.saved-articles";

export function readBookmarks(storage) {
  const saved = storage.getItem(storageKey);
  if (saved === null) return [];

  let articles;
  try {
    articles = JSON.parse(saved);
  } catch {
    throw new Error("Saved stories could not be read. Clear this site's saved data and try again.");
  }

  if (!Array.isArray(articles) || articles.some((article) =>
    !article || typeof article.url !== "string" || typeof article.title !== "string",
  )) {
    throw new Error("Saved stories have an invalid format. Clear this site's saved data and try again.");
  }
  return articles;
}

export function saveBookmark(storage, article) {
  const articles = readBookmarks(storage);
  if (articles.some((saved) => saved.url === article.url)) return articles;
  const updated = [article, ...articles];
  storage.setItem(storageKey, JSON.stringify(updated));
  return updated;
}

export function removeBookmark(storage, url) {
  const updated = readBookmarks(storage).filter((article) => article.url !== url);
  storage.setItem(storageKey, JSON.stringify(updated));
  return updated;
}
