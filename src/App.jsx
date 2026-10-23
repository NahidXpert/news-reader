import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import { readBookmarks, removeBookmark, saveBookmark } from "./bookmarks.js";

const categories = [
  ["general", "Top stories"],
  ["business", "Business"],
  ["technology", "Technology"],
  ["science", "Science"],
  ["sports", "Sports"],
  ["health", "Health"],
];

function formattedDate(value) {
  if (!value) return "Today";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function ArticleCard({ article, saved, onToggle, featured = false }) {
  return (
    <article className={`article-card${featured ? " article-card--featured" : ""}`}>
      <a className="article-image" href={article.url} target="_blank" rel="noreferrer" aria-label={`Read ${article.title} at ${article.sourceName}`}>
        {article.imageUrl ? <img src={article.imageUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} /> : <span className="image-placeholder">The Daily Briefing</span>}
        {featured && <span className="image-label">THE EDITOR'S PICK</span>}
      </a>
      <div className="article-content">
        <div className="article-meta"><span>{article.sourceName}</span><span className="meta-dot">·</span><time dateTime={article.publishedAt || undefined}>{formattedDate(article.publishedAt)}</time></div>
        <h2><a href={article.url} target="_blank" rel="noreferrer">{article.title}</a></h2>
        {article.description && <p>{article.description}</p>}
        <div className="article-actions">
          <a className="read-link" href={article.url} target="_blank" rel="noreferrer">Read story <span aria-hidden="true">↗</span></a>
          {onToggle && <button className={`save-button${saved ? " is-saved" : ""}`} onClick={() => onToggle(article)} aria-label={saved ? "Remove saved story" : "Save story"} title={saved ? "Remove saved story" : "Save story"}>{saved ? "♥" : "♡"}<span>{saved ? "Saved" : "Save"}</span></button>}
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [category, setCategory] = useState("general");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState("");
  const [savedArticles, setSavedArticles] = useState([]);
  const [savedView, setSavedView] = useState(false);
  const [toast, setToast] = useState("");
  const savedIds = useMemo(() => new Set(savedArticles.map((item) => item.url)), [savedArticles]);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    try {
      setSavedArticles(readBookmarks(window.localStorage));
    } catch (err) {
      setToast(err.message);
    }
  }, []);

  useEffect(() => {
    if (savedView) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setPage(1);
    api.news({ q: query, category, page: 1 }, controller.signal)
      .then((result) => { setArticles(result.articles); setTotal(result.totalResults); })
      .catch((err) => { if (err.name !== "AbortError") { setArticles([]); setTotal(0); setError(err.message); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [category, query, savedView, retryCount]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadMore = async () => {
    setLoadingMore(true);
    setError("");
    try {
      const nextPage = page + 1;
      const result = await api.news({ q: query, category, page: nextPage });
      setArticles((current) => [...current, ...result.articles]);
      setPage(nextPage);
      setTotal(result.totalResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleBookmark = useCallback((article) => {
    try {
      if (savedIds.has(article.url)) {
        setSavedArticles(removeBookmark(window.localStorage, article.url));
        setToast("Removed from your reading list");
      } else {
        setSavedArticles(saveBookmark(window.localStorage, article));
        setToast("Saved to your reading list");
      }
    } catch (err) {
      setToast(err.message);
    }
  }, [savedIds]);

  const visibleArticles = savedView ? savedArticles : articles;
  const featuredArticle = !savedView && !query && articles.length > 0 ? articles[0] : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setSavedView(false); setSearchInput(""); setQuery(""); setCategory("general"); }} aria-label="The Daily Briefing home">
          <span className="brand-mark">db<span>.</span></span><span className="brand-name">THE DAILY<br />BRIEFING</span>
        </a>
        <div className="header-tools">
          <label className="search-box"><span aria-hidden="true" className="search-icon">⌕</span><input value={searchInput} onChange={(event) => { setSearchInput(event.target.value); setSavedView(false); }} placeholder="Search the news…" aria-label="Search the news" />{searchInput && <button onClick={() => setSearchInput("")} aria-label="Clear search">×</button>}</label>
          <button className={`saved-nav${savedView ? " active" : ""}`} onClick={() => setSavedView((current) => !current)} aria-pressed={savedView}><span aria-hidden="true">♡</span><span>Saved</span>{savedArticles.length > 0 && <span className="saved-count">{savedArticles.length}</span>}</button>
        </div>
      </header>

      <main className="main-content">
        <section className="intro">
          <div className="intro-copy"><span className="eyebrow"><span className="live-dot" /> YOUR WORLD, IN FOCUS</span><h1>{savedView ? "Your reading list." : query ? "Stories worth searching for." : "The Daily Briefing."}</h1><p>{savedView ? "Good stories deserve a second look." : query ? `A closer look at “${query}”.` : "A little more signal. A lot less noise."}</p></div>
          <div className="date-stamp"><span>{new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date()).toUpperCase()} EDITION</span><strong>{new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date())}</strong></div>
        </section>

        {!savedView && <nav className="category-nav" aria-label="News categories">{categories.map(([id, label]) => <button key={id} className={category === id && !query ? "selected" : ""} aria-pressed={category === id && !query} onClick={() => { setCategory(id); setSearchInput(""); setQuery(""); }}>{label}</button>)}</nav>}

        <section className="news-section" aria-live="polite">
          {loading && !savedView ? <div className="article-grid">{Array.from({ length: 6 }, (_, index) => <div className="skeleton-card" key={index}><div className="skeleton-image" /><div className="skeleton-line short" /><div className="skeleton-line" /><div className="skeleton-line medium" /></div>)}</div>
            : error && !savedView && articles.length === 0 ? <div className="state-panel"><span className="state-icon">!</span><h2>We couldn’t load the news.</h2><p>{error}</p><button className="primary-button compact" onClick={() => setRetryCount((count) => count + 1)}>Try again</button></div>
            : visibleArticles.length === 0 ? <div className="state-panel"><span className="state-icon">{savedView ? "♡" : "⌕"}</span><h2>{savedView ? "Your reading list is a blank page." : query ? "No stories found just yet." : "Nothing to read here right now."}</h2><p>{savedView ? "Save a story that catches your eye and it’ll be waiting here." : "Try another search or check back in a little while."}</p>{savedView && <button className="primary-button compact" onClick={() => setSavedView(false)}>Explore today’s stories</button>}</div>
            : <>
                {featuredArticle && <div className="featured-heading"><span>THE BIG STORY</span><span className="section-rule" /></div>}
                <div className={`article-grid${featuredArticle ? " has-featured" : ""}`}>
                  {visibleArticles.map((article, index) => <ArticleCard key={article._id || article.url} article={article} saved={savedIds.has(article.url)} onToggle={!savedView ? toggleBookmark : () => toggleBookmark(article)} featured={Boolean(featuredArticle && index === 0)} />)}
                </div>
                {error && !savedView && <div className="inline-error" role="alert"><span>{error}</span><button onClick={loadMore}>Try loading more</button></div>}
                {!savedView && articles.length < total && <div className="load-more-wrap"><button className="load-more" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Loading stories…" : "Load more stories"}<span aria-hidden="true">↓</span></button></div>}
              </>}
        </section>
      </main>

      <footer className="site-footer"><span>THE DAILY BRIEFING</span><span>Independent reading starts with good sources.</span><span>Stories powered by TheNewsAPI</span></footer>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
