# Setup Grayson's Account

The Supabase SMTP is not configured, which prevents automatic account creation via the API.
Follow these steps to manually create Grayson's account:

## Step 1 — Create the auth account

1. Open the [Supabase Dashboard](https://supabase.com/dashboard/project/ryvsbidtwhxfmashwsqt)
2. Go to **Authentication → Users**
3. Click **"Add user"** → **"Create new user"**
4. Fill in:
   - **Email:** `graysonhales0@gmail.com`
   - **Password:** `Mannabran1!`
   - Check **"Auto Confirm User"** (bypasses email confirmation)
5. Click **Create User**

## Step 2 — Run the migration SQL

1. In the Supabase dashboard, go to **SQL Editor**
2. Open `supabase/migrations/20260510_coach_profile.sql` and paste its contents
3. Click **Run**

This will:
- Add coach profile fields (bio, specialties, credentials, website) to the profiles table
- Update the `get_my_profile` RPC to return the new fields
- Add a `get_coach_profile` RPC for clients to view their coach's profile
- Link Grayson's clients row to Coach Branden's profile

## Verification

After completing the steps above:
- Grayson can log in at [getmacrostack.com](https://getmacrostack.com) using Client Edition
- They will appear in Branden's client list automatically
- The "Your Coach" section will show in Grayson's dashboard once the coach profile is set up
