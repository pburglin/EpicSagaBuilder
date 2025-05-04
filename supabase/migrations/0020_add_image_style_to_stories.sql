-- Add image_style column to stories table
ALTER TABLE public.stories
ADD COLUMN image_style text DEFAULT 'anime style';

-- Optional: Add a comment to the column for clarity
COMMENT ON COLUMN public.stories.image_style IS 'Specifies the desired visual style for generated story scene images.';