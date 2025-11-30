-- Agregar campo avatar_url a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN avatar_url text DEFAULT NULL;

COMMENT ON COLUMN public.profiles.avatar_url IS 
'URL del avatar del usuario. Puede ser de OAuth provider o subido manualmente.';

-- Crear bucket de storage para avatars si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para avatars
CREATE POLICY "Users can view all avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Actualizar función handle_new_user para capturar avatar de OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, surname, dni, birth_date, height, weight, gender, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', COALESCE(NEW.raw_user_meta_data ->> 'name', '')),
    COALESCE(NEW.raw_user_meta_data ->> 'surname', ''),
    '',
    COALESCE((NEW.raw_user_meta_data ->> 'birth_date')::date, '2000-01-01'),
    COALESCE((NEW.raw_user_meta_data ->> 'height')::integer, 170),
    COALESCE((NEW.raw_user_meta_data ->> 'weight')::integer, 70),
    COALESCE(NEW.raw_user_meta_data ->> 'gender', 'male'),
    -- Capturar avatar de Google OAuth
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

