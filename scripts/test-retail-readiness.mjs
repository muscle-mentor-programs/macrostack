import assert from "node:assert/strict";
import { createRequestCache } from "../src/retail/requestCache.mjs";
import { starterTemplates } from "../src/retail/starterTemplates.mjs";
let clock = 0,
  calls = 0;
const cache = createRequestCache({ ttl: 10, now: () => clock }),
  load = async () => ++calls;
const concurrent = await Promise.all([
  cache.get("user-a:store-a", load),
  cache.get("user-a:store-a", load),
]);
assert.deepEqual(concurrent, [1, 1]);
assert.equal(await cache.get("user-a:store-a", load), 1);
assert.equal(
  await cache.get("user-b:store-a", load),
  2,
  "users never share cache entries",
);
assert.equal(
  await cache.get("user-a:store-b", load),
  3,
  "stores never share cache entries",
);
assert.equal(
  await cache.get("user-a:store-a", load, true),
  4,
  "mutation refresh bypasses cached results",
);
clock = 11;
assert.equal(
  await cache.get("user-a:store-a", load),
  5,
  "expired data is reloaded",
);
await assert.rejects(
  () =>
    cache.get("failure", async () => {
      throw Error("offline");
    }),
  /offline/,
);
assert.equal(
  await cache.get("failure", async () => "recovered"),
  "recovered",
  "failed requests are not cached",
);
let release;
const waiting = cache.get(
  "race",
  () =>
    new Promise((r) => {
      release = r;
    }),
);
await Promise.resolve();
assert.equal(await cache.get("race", async () => "new", true), "new");
release("old");
await waiting;
assert.equal(
  await cache.get("race", load),
  "new",
  "old responses cannot replace post-mutation data",
);
assert.equal(
  new Set(starterTemplates.map((t) => t.key)).size,
  starterTemplates.length,
);
for (const t of starterTemplates) {
  assert.ok(t.content.body.startsWith("DRAFT"));
  assert.notEqual(t.published, true);
  assert.ok(
    ["consultation", "nutrition", "followup", "product"].includes(t.category),
  );
}
console.log(
  "PASS retail readiness: deduplication, scoped cache, mutation freshness, failure recovery and draft-only starter resources",
);
