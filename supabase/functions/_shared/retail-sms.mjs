export async function validTwilioSignature(url, params, signature, secret) {
  if (!signature || !secret) return false;
  let data = url;
  for (const key of [...new Set(params.keys())].sort())
    for (const value of [...new Set(params.getAll(key))].sort())
      data += key + value;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)),
  );
  const expected = btoa(String.fromCharCode(...bytes));
  if (signature.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++)
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
