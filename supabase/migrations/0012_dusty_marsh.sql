/*
  # Add round completion karma system
  
  1. New Tables
    - `story_rounds`
      - Tracks round actions and completion
      - Records first and last players
  
  2. Functions
    - Award karma for round completion
    - Track player action order
*/

-- Create story_rounds table
CREATE TABLE story_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) NOT NULL,
  round_number integer NOT NULL,
  first_character_id uuid REFERENCES characters(id),
  last_character_id uuid REFERENCES characters(id),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create function to start new round
CREATE OR REPLACE FUNCTION start_story_round(story_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_round_number integer;
  new_round_id uuid;
BEGIN
  -- Get current round number
  SELECT COALESCE(MAX(round_number), 0) + 1
  INTO current_round_number
  FROM story_rounds
  WHERE story_id = $1;
  
  -- Create new round
  INSERT INTO story_rounds (story_id, round_number)
  VALUES ($1, current_round_number)
  RETURNING id INTO new_round_id;
  
  RETURN new_round_id;
END;
$$;

-- Create function to record player action
CREATE OR REPLACE FUNCTION record_player_action(
  round_id uuid,
  character_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_characters integer;
  round_record story_rounds;
BEGIN
  -- Get round info
  SELECT * INTO round_record
  FROM story_rounds
  WHERE id = round_id;
  
  -- Get number of active characters
  SELECT COUNT(*)
  INTO active_characters
  FROM characters
  WHERE story_id = round_record.story_id
  AND status = 'active';
  
  -- Record first player if not set
  IF round_record.first_character_id IS NULL THEN
    UPDATE story_rounds
    SET first_character_id = character_id
    WHERE id = round_id;
    
    -- Award karma point to first player
    PERFORM add_karma_points(
      character_id,
      1,
      'First to act in round',
      NULL
    );
  END IF;
  
  -- Record last player
  UPDATE story_rounds
  SET last_character_id = character_id
  WHERE id = round_id;
  
  -- If more than one player, deduct point from last player
  IF active_characters > 1 AND round_record.completed_at IS NULL THEN
    PERFORM add_karma_points(
      character_id,
      -1,
      'Last to act in round',
      NULL
    );
  END IF;
END;
$$;

-- Enable RLS
ALTER TABLE story_rounds ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access to story rounds"
  ON story_rounds FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert story rounds"
  ON story_rounds FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update story rounds"
  ON story_rounds FOR UPDATE
  TO authenticated
  USING (true);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION start_story_round TO authenticated;
GRANT EXECUTE ON FUNCTION record_player_action TO authenticated;