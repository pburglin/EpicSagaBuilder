-- Add story_mechanics column to stories table
ALTER TABLE stories
ADD COLUMN story_mechanics TEXT;

-- Add story_context column to stories table
ALTER TABLE stories
ADD COLUMN story_context TEXT;