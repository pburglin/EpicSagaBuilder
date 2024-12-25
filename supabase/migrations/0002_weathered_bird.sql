/*
  # Fix user profile policies

  1. Changes
    - Update RLS policies for users table
    - Add policy for inserting user profiles
    - Add policy for users to update their own profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read any profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);