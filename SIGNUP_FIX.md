# Signup "Error sending confirmation email" — Fix

## Cause
`supabase.auth.signUp()` asks Supabase to send a confirmation email. With no
custom SMTP configured, Supabase's built-in mailer is rate-limited / restricted
and returns **"Error sending confirmation email"**, blocking signup.

## The fix (in code)
Self-signup now calls a new edge function, **`register`**, which creates the
account already **email-confirmed** via the admin API — no confirmation email
is sent at all — then the client signs in directly. If the function isn't
deployed or is unreachable, signup falls back to the original path, so nothing
breaks before you deploy.

### Deploy it
```bash
supabase functions deploy register
```
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — no
extra secrets needed. The function is called with the anon key, so leave JWT
verification on (default).

That's it — signups work immediately after deploy, with zero email dependency.

## Tradeoff & alternatives
- This path does **not** verify the user owns the email (low risk for a coaching
  app; acceptable to get signups flowing).
- If you later want real email verification, configure **custom SMTP** in
  Supabase (Auth → Settings → SMTP) — e.g. point it at Resend, which this app
  already uses (`RESEND_API_KEY`). Then the fallback `signUp` path will send
  confirmation emails reliably.
- Or simply disable "Confirm email" (Auth → Providers → Email) — the code
  already handles an immediate session.

Note: the coach **invite-client** function still uses Supabase's
`inviteUserByEmail`, which also depends on the mailer. If coach invites fail the
same way, configuring custom SMTP fixes both.
