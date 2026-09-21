// Retail staff sessions are independent of member/coach sessions.
export function isRetailLoginRoute(path, search = "") {
  const route = path.replace(/\/+$/, "");
  const params = new URLSearchParams(search);
  if (route === "/retailers" || route === "/retail/start") return true;
  return (
    route === "/retail" &&
    (params.has("staff") || (!params.has("store") && !params.has("invite")))
  );
}
export function isRetailAccount(user) {
  return user?.app_metadata?.account_type === "retailer";
}
