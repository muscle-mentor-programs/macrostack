export async function validEmailSignature(
  body,
  headers,
  secret,
  now = Date.now(),
) {
  const id = headers.get("svix-id"),
    stamp = headers.get("svix-timestamp"),
    signatures = headers.get("svix-signature") || "";
  if (
    !id ||
    !/^\d+$/.test(stamp || "") ||
    Math.abs(now / 1000 - Number(stamp)) > 300 ||
    !secret?.startsWith("whsec_")
  )
    return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      Uint8Array.from(atob(secret.slice(6)), (c) => c.charCodeAt(0)),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const hash = new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(`${id}.${stamp}.${body}`),
      ),
    );
    const expected = btoa(String.fromCharCode(...hash));
    return signatures.split(" ").some((part) => {
      const [version, sig] = part.split(",");
      if (version !== "v1" || sig?.length !== expected.length) return false;
      let diff = 0;
      for (let i = 0; i < expected.length; i++)
        diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
      return diff === 0;
    });
  } catch {
    return false;
  }
}
