-- StrainSpotter Feedback Viewer
-- Run this in Supabase SQL Editor to view all feedback

-- View all feedback with user information
SELECT 
  m.id,
  m.content,
  m.created_at,
  m.user_id,
  u.email as user_email,
  u.username,
  CASE 
    WHEN m.user_id IS NULL THEN 'Anonymous'
    ELSE COALESCE(u.username, u.email, 'Unknown User')
  END as submitted_by
FROM messages m
LEFT JOIN profiles u ON m.user_id = u.id
WHERE m.group_id = (
  SELECT id FROM groups WHERE name = 'Feedback'
)
ORDER BY m.created_at DESC;

-- Count total feedback submissions
SELECT COUNT(*) as total_feedback
FROM messages
WHERE group_id = (SELECT id FROM groups WHERE name = 'Feedback');

-- Count feedback by user
SELECT 
  CASE 
    WHEN m.user_id IS NULL THEN 'Anonymous'
    ELSE COALESCE(u.username, u.email, 'Unknown User')
  END as user,
  COUNT(*) as feedback_count
FROM messages m
LEFT JOIN profiles u ON m.user_id = u.id
WHERE m.group_id = (SELECT id FROM groups WHERE name = 'Feedback')
GROUP BY m.user_id, u.username, u.email
ORDER BY feedback_count DESC;

-- View recent feedback (last 24 hours)
SELECT 
  m.id,
  m.content,
  m.created_at,
  CASE 
    WHEN m.user_id IS NULL THEN 'Anonymous'
    ELSE COALESCE(u.username, u.email, 'Unknown User')
  END as submitted_by
FROM messages m
LEFT JOIN profiles u ON m.user_id = u.id
WHERE m.group_id = (SELECT id FROM groups WHERE name = 'Feedback')
  AND m.created_at > NOW() - INTERVAL '24 hours'
ORDER BY m.created_at DESC;

-- Search feedback by keyword
-- Replace 'scanner' with your search term
SELECT 
  m.id,
  m.content,
  m.created_at,
  CASE 
    WHEN m.user_id IS NULL THEN 'Anonymous'
    ELSE COALESCE(u.username, u.email, 'Unknown User')
  END as submitted_by
FROM messages m
LEFT JOIN profiles u ON m.user_id = u.id
WHERE m.group_id = (SELECT id FROM groups WHERE name = 'Feedback')
  AND m.content ILIKE '%scanner%'
ORDER BY m.created_at DESC;

-- Create Feedback group if it doesn't exist
INSERT INTO groups (name, description, is_public)
VALUES ('Feedback', 'User feedback and suggestions', false)
ON CONFLICT (name) DO NOTHING;

