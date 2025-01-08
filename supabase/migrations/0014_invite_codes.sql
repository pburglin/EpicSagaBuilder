/*
  # Add invite code system
  
  1. New Table
    - user_invites
      - Stores unique invite codes
      - Tracks which user used each code
      - Prevents code reuse
*/

CREATE TABLE user_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  used_by uuid REFERENCES users(id),
  used_at timestamptz
);

-- Enable RLS
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read invites" 
  ON user_invites FOR SELECT 
  USING (true);

CREATE POLICY "Admin can manage invites"
  ON user_invites FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Allow registered users to update used_by and used_at in user_invites" ON user_invites
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (used_by = auth.uid() OR used_at IS NULL);