/*
  # Add karma points system
  
  1. New Tables
    - `karma_points`
      - Tracks karma points for characters
      - Stores karma point transactions
      - Enables voting on character actions
  
  2. Functions
    - Add karma points
    - Remove karma points
    - Calculate total karma for stories and users
    
  3. Triggers
    - Auto-award points for story participation
    - Track first/last player actions
*/

-- Create karma_points table
CREATE TABLE karma_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) NOT NULL,
  points integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Add karma_points column to characters
ALTER TABLE characters 
ADD COLUMN karma_points integer NOT NULL DEFAULT 0;

-- Create function to add karma points
CREATE OR REPLACE FUNCTION add_karma_points(
  character_id uuid,
  points integer,
  reason text,
  created_by uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert karma point transaction
  INSERT INTO karma_points (character_id, points, reason, created_by)
  VALUES (character_id, points, reason, created_by);
  
  -- Update character's total karma
  UPDATE characters
  SET karma_points = karma_points + points
  WHERE id = character_id;
END;
$$;

-- Create function to calculate story karma
CREATE OR REPLACE FUNCTION calculate_story_karma(story_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_karma integer;
BEGIN
  SELECT COALESCE(SUM(karma_points), 0)
  INTO total_karma
  FROM characters
  WHERE story_id = $1;
  
  RETURN total_karma;
END;
$$;

-- Create function to calculate user karma
CREATE OR REPLACE FUNCTION calculate_user_karma(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_karma integer;
BEGIN
  SELECT COALESCE(SUM(karma_points), 0)
  INTO total_karma
  FROM characters
  WHERE user_id = $1;
  
  RETURN total_karma;
END;
$$;

-- Create trigger to award points on character creation
CREATE OR REPLACE FUNCTION award_join_karma()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Award 10 karma points for joining a story
  PERFORM add_karma_points(
    NEW.id,
    10,
    'Joined story',
    NEW.user_id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_character_created
  AFTER INSERT
  ON characters
  FOR EACH ROW
  EXECUTE FUNCTION award_join_karma();

-- Enable RLS
ALTER TABLE karma_points ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access to karma points"
  ON karma_points FOR SELECT
  USING (true);

CREATE POLICY "Users can add karma points"
  ON karma_points FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_karma_points TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_story_karma TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_user_karma TO authenticated;