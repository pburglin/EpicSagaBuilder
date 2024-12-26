/*
  # Add delete policy for story messages

  1. Security
    - Add RLS policy to allow authenticated users to delete story messages
    - Only allow deletion of messages from stories the user is participating in
*/

-- Create policy for deleting story messages
CREATE POLICY "Users can delete messages from their stories"
  ON story_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM characters c
      WHERE c.story_id = story_messages.story_id
      AND c.user_id = auth.uid()
      AND c.status = 'active'
    )
  );