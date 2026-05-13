-- ─────────────────────────────────────────────────────────────────────────────
-- Client profile pictures
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add avatar_url column to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT NULL;

-- 2. Create a public "avatars" storage bucket (5 MB limit, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies
-- Any authenticated user can upload/replace avatars
CREATE POLICY IF NOT EXISTS "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Authenticated users can update avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');

-- Public read (bucket is already public, but explicit policy is safer)
CREATE POLICY IF NOT EXISTS "Avatars are publicly accessible"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');
