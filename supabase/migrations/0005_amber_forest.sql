/*
  # Add story status column

  1. Changes
    - Add status column to stories table with default value 'active'
    - Update existing stories to have 'active' status if null
    - Add check constraint to ensure valid status values

  2. Security
    - No changes to RLS policies needed
*/

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'status'
  ) THEN
    ALTER TABLE stories ADD COLUMN status text NOT NULL DEFAULT 'active';
  END IF;
END $$;

-- Update any existing stories to have 'active' status if null
UPDATE stories SET status = 'active' WHERE status IS NULL;

-- Add check constraint for valid status values
ALTER TABLE stories ADD CONSTRAINT stories_status_check 
  CHECK (status IN ('active', 'completed'));