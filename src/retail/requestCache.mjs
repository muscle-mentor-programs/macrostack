// Per-workspace cache: never shared between mounted users or persisted to disk.
export function createRequestCache({ ttl = 15000, now = Date.now } = {}) {
  const entries = new Map();
  return {
    get(key, loader, refresh = false) {
      const old = entries.get(key);
      if (old && !refresh && (old.pending || old.expires > now()))
        return old.promise;
      const entry = { pending: true, expires: 0 };
      entry.promise = Promise.resolve()
        .then(loader)
        .then(
          (value) => {
            entry.pending = false;
            entry.expires = now() + ttl;
            return value;
          },
          (error) => {
            if (entries.get(key) === entry) entries.delete(key);
            throw error;
          },
        );
      entries.set(key, entry);
      if (entries.size > 8) entries.delete(entries.keys().next().value);
      return entry.promise;
    },
  };
}
