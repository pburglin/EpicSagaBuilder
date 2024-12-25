/*
  # Add public access to stories

  1. Changes
    - Add public access policies for stories table
    - Add public access policies for characters table
    - Add public access policies for story_messages table

  2. Security
    - Allow anonymous users to read stories and related data
    - Maintain existing authenticated user policies
*/

-- Allow public access to stories
CREATE POLICY "Allow public read access to stories"
  ON stories FOR SELECT
  TO anon
  USING (true);

-- Allow public access to characters
CREATE POLICY "Allow public read access to characters"
  ON characters FOR SELECT
  TO anon
  USING (true);

-- Allow public access to story messages
CREATE POLICY "Allow public read access to story messages"
  ON story_messages FOR SELECT
  TO anon
  USING (true);