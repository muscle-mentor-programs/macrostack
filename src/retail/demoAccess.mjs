export const RETAIL_DEMO_EMAIL = "demo@getmacrostack.com";
export const RETAIL_DEMO_SESSION = "macrostack-retail-demo-session";
const RETAIL_DEMO_PASSWORD = "msdemo";

export function isRetailDemoEmail(email) {
  return String(email || "").trim().toLowerCase() === RETAIL_DEMO_EMAIL;
}

export function demoCredentialResult(email, password) {
  if (!isRetailDemoEmail(email)) return "not-demo";
  return password === RETAIL_DEMO_PASSWORD ? "valid" : "invalid";
}

export function hasRetailDemoSession(storage) {
  try { return storage?.getItem(RETAIL_DEMO_SESSION) === "1"; }
  catch { return false; }
}

export function startRetailDemoSession(storage) {
  storage.setItem(RETAIL_DEMO_SESSION, "1");
}

export function endRetailDemoSession(storage) {
  try { storage?.removeItem(RETAIL_DEMO_SESSION); }
  catch { /* A private browser can still leave the demo by navigating away. */ }
}
