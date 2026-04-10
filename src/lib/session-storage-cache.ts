/**
 * LRU-bounded sessionStorage helpers.
 * Tracks insertion order via a meta key and evicts the oldest entry when the
 * cache exceeds MAX_CACHE_ENTRIES.
 */

const CACHE_META_KEY = "search-results:__meta__";
const MAX_CACHE_ENTRIES = 10;

interface CacheMeta {
  keys: string[];
}

function readMeta(): CacheMeta {
  try {
    const raw = sessionStorage.getItem(CACHE_META_KEY);
    return raw ? (JSON.parse(raw) as CacheMeta) : { keys: [] };
  } catch {
    return { keys: [] };
  }
}

function writeMeta(meta: CacheMeta): void {
  sessionStorage.setItem(CACHE_META_KEY, JSON.stringify(meta));
}

/**
 * Retrieve a value from sessionStorage, promoting the key to the most-recently-used
 * position if it exists.
 */
export function getItem<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const meta = readMeta();
    const idx = meta.keys.indexOf(key);
    if (idx !== -1) {
      meta.keys.splice(idx, 1);
      meta.keys.push(key);
      writeMeta(meta);
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Store a value in sessionStorage. If the cache is at capacity, the oldest entry
 * is evicted before the new entry is added.
 */
export function setItem<T>(key: string, value: T): void {
  try {
    const meta = readMeta();
    const idx = meta.keys.indexOf(key);
    if (idx !== -1) {
      meta.keys.splice(idx, 1);
    }
    if (meta.keys.length >= MAX_CACHE_ENTRIES) {
      const oldest = meta.keys.shift();
      if (oldest) sessionStorage.removeItem(oldest);
    }
    meta.keys.push(key);
    writeMeta(meta);
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — silent fail */
  }
}

/**
 * Remove a key from sessionStorage and from the LRU tracking list.
 */
export function removeItem(key: string): void {
  try {
    sessionStorage.removeItem(key);
    const meta = readMeta();
    const idx = meta.keys.indexOf(key);
    if (idx !== -1) {
      meta.keys.splice(idx, 1);
      writeMeta(meta);
    }
  } catch {
    /* silent */
  }
}
