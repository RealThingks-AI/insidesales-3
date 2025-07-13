-- Update user_metadata for existing users to include their roles
-- Note: This requires direct database access to auth.users which may need service role

-- For now, let's just update the profiles table roles to match what we had before
-- The edge function will handle user_metadata updates going forward
UPDATE profiles SET role = 'admin' WHERE "Email ID" IN ('deepak.dongare@realthingks.com', 'peter.jakobsson@realthingks.com');
UPDATE profiles SET role = 'member' WHERE "Email ID" = 'ai@realthingks.com';