/* Display formatting for every food source (built-in, custom, scanned):
   names in Title Case (first letter of each word), brands in ALL CAPS. */

export function titleCaseName(name = '') {
  let s = String(name)
  // Barcode scans often arrive fully SHOUTING — convert those to lowercase
  // first so Title Case can apply. Mixed-case names are left as-typed so
  // acronyms like "BBQ Chips" survive.
  if (s.length > 3 && s === s.toUpperCase() && /[A-Z]/.test(s)) s = s.toLowerCase()
  return s.replace(/(^|[\s(/\-–])(\p{Ll})/gu, (m, p, c) => p + c.toUpperCase())
}

export function formatFood(f) {
  return { ...f, name: titleCaseName(f.name), brand: String(f.brand || '').toUpperCase() }
}
