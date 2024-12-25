/*
  # Create Story Management Functions
  
  1. New Functions
    - increment_story_authors: Safely increments the current_authors count
    - decrement_story_authors: Safely decrements the current_authors count
  
  2. Security
    - Functions are accessible to authenticated users only
*/

-- Function to increment story authors count
CREATE OR REPLACE FUNCTION increment_story_authors(story_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stories
  SET current_authors = current_authors + 1
  WHERE id = story_id;
END;
$$;

-- Function to decrement story authors count
CREATE OR REPLACE FUNCTION decrement_story_authors(story_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stories
  SET current_authors = GREATEST(0, current_authors - 1)
  WHERE id = story_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_story_authors(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_story_authors(uuid) TO authenticated;