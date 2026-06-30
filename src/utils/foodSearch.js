/**
 * Food search utilities — multi-word relevance ranking + recency boost.
 *
 * Brand and product name are BOTH first-class search terms in the one search
 * bar. A query word matches against either field; brand matches score just
 * below the equivalent name match so "quest" surfaces all Quest products and
 * "chocolate quest" surfaces Quest's chocolate items.
 *
 * Scoring overview (higher = better match):
 *   Full-query bonuses:
 *   1000  exact name match
 *    700  exact brand match
 *    500  name starts with the full query
 *    400  brand starts with the full query
 *     30  name contains the full query (mid-string)
 *     25  brand contains the full query (mid-string)
 *
 *   Per-query-word bonuses (best single match per word):
 *    100  a name word exactly equals the word
 *     80  a brand word exactly equals the word
 *     50  a name word starts with the word
 *     45  a brand word starts with the word
 *     20  the word appears inside the name (substring)
 *     10  the word appears inside the brand (substring)
 *
 *   Recency boost (decays with days since last log): up to ~1200 + freq bonus.
 *
 * ALL query words must match somewhere (name OR brand) — AND logic.
 * With an empty query every food passes; recency score still sorts recent first.
 */

const tokenize = (s) => s.split(/[\s,./\-()]+/).filter(Boolean)

function scoreFoodItem(food, queryWords, fullQuery, recentScores) {
  const nameL    = (food.name  || '').toLowerCase()
  const brandL   = (food.brand || '').toLowerCase()
  const combined = brandL ? nameL + ' ' + brandL : nameL

  // ── Hard filter: every query word must appear in name OR brand ────────
  if (queryWords.length > 0) {
    for (const w of queryWords) {
      if (!combined.includes(w)) return -1
    }
  }

  let score = 0

  if (queryWords.length > 0) {
    // ── Full-query bonuses — name and brand each evaluated ──
    if (nameL === fullQuery) score += 1000
    else if (brandL === fullQuery) score += 700

    if (nameL.startsWith(fullQuery)) score += 500
    else if (brandL.startsWith(fullQuery)) score += 400
    else if (nameL.includes(fullQuery)) score += 30
    else if (brandL.includes(fullQuery)) score += 25

    // ── Per-word bonuses — name and brand both searched; best match wins ──
    const nameWords  = tokenize(nameL)
    const brandWords = tokenize(brandL)

    for (const qw of queryWords) {
      if (nameWords.includes(qw))                       score += 100  // name word exact
      else if (brandWords.includes(qw))                 score += 80   // brand word exact
      else if (nameWords.some((w) => w.startsWith(qw))) score += 50   // name word prefix
      else if (brandWords.some((w) => w.startsWith(qw)))score += 45   // brand word prefix
      else if (nameL.includes(qw))                      score += 20   // name substring
      else if (brandL.includes(qw))                     score += 10   // brand substring
    }
  }

  // ── Recency boost — Map<foodId, score> from getRecentFoodIds ─────────
  // Supports legacy Set for backward compat (flat +800 fallback).
  if (recentScores) {
    if (typeof recentScores.get === 'function') {
      score += recentScores.get(food.id) || 0
    } else if (typeof recentScores.has === 'function') {
      if (recentScores.has(food.id)) score += 800
    }
  }

  return score
}

/**
 * Filter and rank foods by relevance to `query` and recency.
 *
 * @param {object[]}      foods        - full list of food objects
 * @param {string}        query        - raw search string from the input
 * @param {Map|Set}       recentFoodIds - Map<foodId,score> from getRecentFoodIds,
 *                                       or legacy Set for backward compat
 * @returns {object[]} filtered and sorted food list (best match first)
 */
export function rankFoods(foods, query, recentFoodIds = new Map()) {
  const q          = query.trim().toLowerCase()
  const queryWords = q.split(/\s+/).filter(Boolean)

  const results = []
  for (const food of foods) {
    const score = scoreFoodItem(food, queryWords, q, recentFoodIds)
    if (score >= 0) results.push({ food, score })
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    // Tie-break: alphabetical by name
    return a.food.name.localeCompare(b.food.name)
  })

  return results.map(({ food }) => food)
}

/**
 * Build a Map<foodId, recencyScore> from a log object `{ 'yyyy-MM-dd': [entries] }`.
 *
 * Score reflects HOW RECENTLY the food was logged, not just whether it was:
 *   - logged today   → ~1200 pts
 *   - logged 7 days ago → ~920 pts
 *   - logged 30 days ago → ~0 pts
 * Plus a small frequency bonus (+30 per additional log, capped at +150).
 *
 * @param {object} log      - date-keyed log dict from the store
 * @param {number} daysBack - how many days to look back (default 30)
 * @returns {Map<string, number>}
 */
export function getRecentFoodIds(log = {}, daysBack = 30) {
  const foodData = new Map()  // foodId -> { mostRecentDaysAgo, count }
  const now = new Date()

  for (const [date, entries] of Object.entries(log)) {
    // Parse date as noon local time to avoid timezone off-by-one
    const daysSince = Math.floor(
      (now - new Date(date + 'T12:00:00')) / (1000 * 60 * 60 * 24)
    )
    if (daysSince > daysBack) continue

    for (const e of entries) {
      if (!e.foodId) continue
      const existing = foodData.get(e.foodId)
      if (!existing) {
        foodData.set(e.foodId, { mostRecentDaysAgo: daysSince, count: 1 })
      } else {
        foodData.set(e.foodId, {
          mostRecentDaysAgo: Math.min(existing.mostRecentDaysAgo, daysSince),
          count: existing.count + 1,
        })
      }
    }
  }

  // Convert to recency score Map
  const scores = new Map()
  for (const [id, { mostRecentDaysAgo, count }] of foodData) {
    // Linear decay: 1200 today → ~0 at daysBack
    const recency  = Math.max(0, Math.round(1200 - mostRecentDaysAgo * (1200 / daysBack)))
    // Frequency bonus: each extra log adds 30 pts (max +150)
    const freqBonus = Math.min(count - 1, 5) * 30
    scores.set(id, recency + freqBonus)
  }
  return scores
}

/**
 * Merge logs from multiple clients into a single recency Map.
 * Useful for the coach side where "recently used" means "logged by any client".
 *
 * @param {object[]} clients  - array of client objects with a `.log` property
 * @param {number}   daysBack
 * @returns {Map<string, number>}
 */
export function getRecentFoodIdsFromClients(clients = [], daysBack = 30) {
  const foodData = new Map()
  const now = new Date()

  for (const client of clients) {
    for (const [date, entries] of Object.entries(client.log || {})) {
      const daysSince = Math.floor(
        (now - new Date(date + 'T12:00:00')) / (1000 * 60 * 60 * 24)
      )
      if (daysSince > daysBack) continue

      for (const e of entries) {
        if (!e.foodId) continue
        const existing = foodData.get(e.foodId)
        if (!existing) {
          foodData.set(e.foodId, { mostRecentDaysAgo: daysSince, count: 1 })
        } else {
          foodData.set(e.foodId, {
            mostRecentDaysAgo: Math.min(existing.mostRecentDaysAgo, daysSince),
            count: existing.count + 1,
          })
        }
      }
    }
  }

  const scores = new Map()
  for (const [id, { mostRecentDaysAgo, count }] of foodData) {
    const recency   = Math.max(0, Math.round(1200 - mostRecentDaysAgo * (1200 / daysBack)))
    const freqBonus = Math.min(count - 1, 5) * 30
    scores.set(id, recency + freqBonus)
  }
  return scores
}
