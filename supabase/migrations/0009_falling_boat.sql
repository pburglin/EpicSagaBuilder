/*
  # Add theme preference to users table

  1. Changes
    - Add theme_preference column to users table
    - Set default theme to 'light'
    - Add check constraint for valid themes

  2. Notes
    - Existing users will have 'light' theme by default
    - Valid themes are 'light' and 'dark'
*/

ALTER TABLE users
ADD COLUMN IF NOT EXISTS theme_preference text NOT NULL DEFAULT 'light';

ALTER TABLE users
ADD CONSTRAINT valid_theme_preference 
CHECK (theme_preference IN ('light', 'dark'));