type Entry = { at: number; value: unknown };

const g = globalThis as unknown as { __memo?: Map<string, Entry>; __flight?: Map<string, Promise<unknown>>; __memoGen?: number };
const store = (g.__memo ??= new Map<string, Entry>());
const flight = (g.__flight ??= new Map<string, Promise<unknown>>());

/**
 * Tiny in-memory TTL cache for read-mostly catalog data (categories, locations, settings...).
 * Concurrent callers share one in-flight load. Admin changes call bustCache() so edits show up straight away.
 */
export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const pending = flight.get(key);
  if (pending) return pending as Promise<T>;
  if (store.size > 400) store.clear();
  const generation = g.__memoGen ?? 0;
  const promise = load()
    .then((value) => {
      if ((g.__memoGen ?? 0) === generation) store.set(key, { at: Date.now(), value });
      return value;
    })
    .finally(() => flight.delete(key));
  flight.set(key, promise);
  return promise;
}

export function bustCache() {
  g.__memoGen = (g.__memoGen ?? 0) + 1;
  store.clear();
}
