-- Add user preference columns
ALTER TABLE users 
  ADD COLUMN show_images boolean NOT NULL DEFAULT false,
  ADD COLUMN enable_audio_narration boolean NOT NULL DEFAULT false;