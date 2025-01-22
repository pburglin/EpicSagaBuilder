-- Add created_by column to stories table
ALTER TABLE stories
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
