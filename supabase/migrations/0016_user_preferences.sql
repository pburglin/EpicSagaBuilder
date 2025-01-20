-- Add user preference columns
ALTER TABLE users 
  ADD COLUMN show_images boolean NOT NULL DEFAULT false,
  ADD COLUMN enable_audio_narration boolean NOT NULL DEFAULT false;

CREATE POLICY "Users can create own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, created_at)
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1) || '-' || floor(random() * 900000 + 100000)::text,
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE POLICY "Allow profile creation via trigger"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);