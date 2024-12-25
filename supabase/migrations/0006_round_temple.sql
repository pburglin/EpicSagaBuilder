/*
  # Add complete story function

  1. Changes
    - Add RPC function to complete stories
    - Function updates story status to 'completed'
    - Function is security definer to ensure proper permissions

  2. Security
    - Grant execute permission to authenticated users
*/

-- Create function to complete story
CREATE OR REPLACE FUNCTION complete_story(story_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stories
  SET status = 'completed'
  WHERE id = story_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_story(uuid) TO authenticated;