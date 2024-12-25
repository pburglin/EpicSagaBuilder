/*
  # Fix anonymous access to stories

  1. Changes
    - Drop existing policies if they exist
    - Add new policies for anonymous access if they don't exist
    - Ensure all tables have proper public read access
*/

DO $$ 
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'stories' 
    AND policyname = 'Anyone can read stories'
  ) THEN
    DROP POLICY "Anyone can read stories" ON stories;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'characters' 
    AND policyname = 'Anyone can read characters'
  ) THEN
    DROP POLICY "Anyone can read characters" ON characters;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'story_messages' 
    AND policyname = 'Anyone can read story messages'
  ) THEN
    DROP POLICY "Anyone can read story messages" ON story_messages;
  END IF;

  -- Create new policies with proper names
  CREATE POLICY "Public read access to stories"
    ON stories FOR SELECT
    USING (true);

  CREATE POLICY "Public read access to characters"
    ON characters FOR SELECT
    USING (true);

  CREATE POLICY "Public read access to story messages"
    ON story_messages FOR SELECT
    USING (true);
END $$;