/* Display formatting for every food source (built-in, custom, scanned):
   names in Title Case (first letter of each word), brands in ALL CAPS. */

export function titleCaseName(name = '') {
  // Uppercase the first letter of each word; leave the rest untouched so
  // acronyms like "BBQ" or "RXBAR" survive.
  return String(name).replace(/(^|[\s(/\-–])(\p{Ll})/gu, (m, p, c) => p + c.toUpperCase())
}

export function formatFood(f) {
  return { ...f, name: titleCaseName(f.name), brand: String(f.brand || '').toUpperCase() }
}
