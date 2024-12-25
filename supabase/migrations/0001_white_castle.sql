/*
  # Initial Schema Setup

  1. New Tables
    - users
      - id (uuid, primary key)
      - username (text, unique)
      - avatar_url (text)
      - created_at (timestamp)
    - stories
      - id (uuid, primary key)
      - title (text)
      - description (text)
      - status (text)
      - max_authors (integer)
      - current_authors (integer)
      - created_at (timestamp)
      - image_url (text)
      - character_classes (text[])
      - character_races (text[])
      - starting_scene (text)
      - main_quest (text)
    - characters
      - id (uuid, primary key)
      - name (text)
      - class (text)
      - race (text)
      - description (text)
      - image_url (text)
      - user_id (uuid, foreign key)
      - story_id (uuid, foreign key)
      - created_at (timestamp)
    - story_messages
      - id (uuid, primary key)
      - story_id (uuid, foreign key)
      - character_id (uuid, foreign key, nullable)
      - content (text)
      - type (text)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  username text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read any profile"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create stories table
CREATE TABLE stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  max_authors integer NOT NULL,
  current_authors integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  image_url text,
  character_classes text[] NOT NULL,
  character_races text[] NOT NULL,
  starting_scene text NOT NULL,
  main_quest text NOT NULL
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read stories"
  ON stories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create characters table
CREATE TABLE characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  class text NOT NULL,
  race text NOT NULL,
  description text NOT NULL,
  image_url text,
  user_id uuid REFERENCES users(id) NOT NULL,
  story_id uuid REFERENCES stories(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read characters"
  ON characters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own characters"
  ON characters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create story_messages table
CREATE TABLE story_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) NOT NULL,
  character_id uuid REFERENCES characters(id),
  content text NOT NULL,
  type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE story_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read story messages"
  ON story_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create messages"
  ON story_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);