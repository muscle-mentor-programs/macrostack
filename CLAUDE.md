# MacroStack — working notes for Claude

## Database migrations
Branden applies ALL migrations manually via the Supabase dashboard SQL editor
(project `ryvsbidtwhxfmashwsqt`). Never run `supabase db push` — earlier
migrations aren't tracked in the CLI migration table and push will conflict.

**Whenever you create or change a migration:**
1. Write it to `supabase/migrations/*.sql` as usual (repo record).
2. ALWAYS paste the complete SQL in your chat reply as a copy-paste-ready
   ```sql block (one block per migration, numbered if several) with a short
   "run this in the Supabase SQL editor" instruction. Never just link the file.

## Deploys
- Vercel does NOT auto-deploy on push (commit author email isn't a Vercel team
  member). Deploy with: `npx vercel --prod --yes` from `macrostack/`.
- Supabase edge functions: `supabase functions deploy <name> --use-api`
  (the `--use-api` flag avoids the Docker requirement).
