-- Add meeting_id column to store the Microsoft Graph event ID for Teams meeting deletion
ALTER TABLE meetings ADD COLUMN meeting_id TEXT;