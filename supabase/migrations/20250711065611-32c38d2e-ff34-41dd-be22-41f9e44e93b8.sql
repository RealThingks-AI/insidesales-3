-- Check if ai@realthingks.com has a profile, if not create one
INSERT INTO profiles (id, full_name, "Email ID", role)
SELECT 
    u.id,
    'AI User',
    'ai@realthingks.com',
    'member'
FROM auth.users u
WHERE u.email = 'ai@realthingks.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = u.id
);