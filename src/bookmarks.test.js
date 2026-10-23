import assert from "node:assert/strict";
import { test } from "node:test";
import { readBookmarks, removeBookmark, saveBookmark } from "./bookmarks.js";

function createStorage(initial = null) {
  let value = initial;
  return {
    getItem() { return value; },
    setItem(_key, next) { value = next; },
  };
}

const article = { url: "https://example.com/story", title: "A story", sourceName: "Example" };

test("saves bookmarks and reads them back after a reload", () => {
  const storage = createStorage();
  saveBookmark(storage, article);
  assert.deepEqual(readBookmarks(storage), [article]);
});

test("does not store duplicate article URLs", () => {
  const storage = createStorage();
  saveBookmark(storage, article);
  saveBookmark(storage, article);
  assert.deepEqual(readBookmarks(storage), [article]);
});

test("removes a saved article by its URL", () => {
  const storage = createStorage();
  saveBookmark(storage, article);
  assert.deepEqual(removeBookmark(storage, article.url), []);
  assert.deepEqual(readBookmarks(storage), []);
});

test("reports malformed saved data instead of silently discarding it", () => {
  assert.throws(() => readBookmarks(createStorage("{")), /could not be read/);
  assert.throws(() => readBookmarks(createStorage(JSON.stringify({ title: "Not an array" }))), /invalid format/);
});
