// Retail staff sessions are independent of member/coach sessions.
export function isRetailLoginRoute(path, search = "") {
  const route = path.replace(/\/+$/, "");
  const params = new URLSearchParams(search);
  if (route === "/retail/showcase") return true;
  if (route === "/retailers" || route === "/retail/start") return true;
  return (
    route === "/retail" &&
    (params.has("staff") || (!params.has("store") && !params.has("invite")))
  );
}
export function isRetailAccount(user) {
  return user?.app_metadata?.account_type === "retailer";
}

export function isVerifiedRetailAccount(user) {
  return isRetailAccount(user) && Boolean(user.email_confirmed_at) && user.app_metadata.retail_verified_email === user.email;
}
