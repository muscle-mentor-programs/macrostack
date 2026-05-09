/**
 * Food search utilities — multi-word relevance ranking + recency boost.
 *
 * Scoring overview (higher = better match):
 *   1000  exact name match
 *    500  name starts with the full query string
 *    100  a word in the name exactly equals a query word
 *     50  a word in the name starts with a query word
 *     30  name contains the full query string (not at start)
 *     20  name contains a query word (mid-word / substring)
 *      5  only the brand field matches a query word
 *    800  recency boost — food was logged in the last `daysBack` days
 *
 * ALL query words must match somewhere (name OR brand) — AND logic.
 * With an empty query every food passes; recency boost still sorts recent first.
 */

function scoreFoodItem(food, queryWords, fullQuery, recentSet) {
  const nameL    = (food.name  || '').toLowerCase()
  const brandL   = (food.brand || '').toLowerCase()
  const combined = brandL ? nameL + ' ' + brandL : nameL

  // ── Hard filter: every query word must appear somewhere ───────────────
  if (queryWords.length > 0) {
    for (const w of queryWords) {
      if (!combined.includes(w)) return -1
    }
  }

  let score = 0

  if (queryWords.length > 0) {
    // Exact name
    if (nameL === fullQuery) score += 1000

    // Name starts with full query (highest prefix bonus)
    if (nameL.startsWith(fullQuery)) {
      score += 500
    } else if (nameL.includes(fullQuery)) {
      // Full query is a substring, just not at the front
      score += 30
    }

    // Word-level bonuses — tokenise name on common delimiters
    const nameWords = nameL.split(/[\s,./\-()]+/).filter(Boolean)

    for (const qw of queryWords) {
      if (nameWords.includes(qw)) {
        // A name word exactly equals this query word
        score += 100
      } else if (nameWords.some((nw) => nw.startsWith(qw))) {
        // A name word starts with this query word
        score += 50
      } else if (nameL.includes(qw)) {
        // Query word appears inside the name (mid-word substring)
        score += 20
      } else if (brandL.includes(qw)) {
        // Only the brand field matched — lower priority
        score += 5
      }
    }
  }

  // ── Recency boost (applied even when query is empty) ──────────────────
  if (recentSet.has(food.id)) score += 800

  return score
}

/**
 * Filter and rank foods by relevance to `query` and recency.
 *
 * @param {object[]} foods         - full list of food objects
 * @param {string}   query         - raw search string from the input
 * @param {Set}      recentFoodIds - Set of foodId strings logged recently
 * @returns {object[]} filtered and sorted food list (best match first)
 */
export function rankFoods(foods, query, recentFoodIds = new Set()) {
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
 * Build a Set of recently-used food IDs from a log object `{ 'yyyy-MM-dd': [entries] }`.
 *
 * @param {object} log     - date-keyed log dict from the store
 * @param {number} daysBack - how many days to look back (default 30)
 * @returns {Set<string>}
 */
export function getRecentFoodIds(log = {}, daysBack = 30) {
  const ids       = new Set()
  const cutoff    = new Date()
  cutoff.setDate(cutoff.getDate() - daysBack)
  const cutoffStr = cutoff.toISOString().slice(0, 10) // 'yyyy-MM-dd'

  for (const [date, entries] of Object.entries(log)) {
    if (date >= cutoffStr) {
      for (const e of entries) {
        if (e.foodId) ids.add(e.foodId)
      }
    }
  }
  return ids
}

/**
 * Merge logs from multiple clients into a single recency Set.
 * Useful for the coach side where "recently used" means "logged by any client".
 *
 * @param {object[]} clients  - array of client objects with a `.log` property
 * @param {number}   daysBack
 * @returns {Set<string>}
 */
export function getRecentFoodIdsFromClients(clients = [], daysBack = 30) {
  const ids       = new Set()
  const cutoff    = new Date()
  cutoff.setDate(cutoff.getDate() - daysBack)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  for (const client of clients) {
    for (const [date, entries] of Object.entries(client.log || {})) {
      if (date >= cutoffStr) {
        for (const e of entries) {
          if (e.foodId) ids.add(e.foodId)
        }
      }
    }
  }
  return ids
}
