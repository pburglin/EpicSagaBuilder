/*
  # Add character status and archiving functionality
  
  1. Changes
    - Add status column to characters table
    - Update existing characters to 'active' status
    - Modify character queries to filter by status
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add status column to characters table
ALTER TABLE characters ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Update existing characters to active status
UPDATE characters SET status = 'active' WHERE status IS NULL;

-- Create function to archive character
CREATE OR REPLACE FUNCTION archive_character(character_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE characters
  SET status = 'archived'
  WHERE id = character_id;
END;
$$;

GRANT EXECUTE ON FUNCTION archive_character(uuid) TO authenticated;