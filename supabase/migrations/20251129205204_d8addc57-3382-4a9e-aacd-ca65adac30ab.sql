-- Drop the existing unique constraint on dni (constraint, not index)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_dni_key;

-- Create a partial unique index that only enforces uniqueness for non-empty DNIs
CREATE UNIQUE INDEX profiles_dni_unique_nonempty ON public.profiles (dni) WHERE dni IS NOT NULL AND dni != '';

-- Update the handle_new_user function to handle OAuth users better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only insert if profile doesn't exist for this user
  INSERT INTO public.profiles (user_id, name, surname, dni, birth_date, height, weight, gender)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', COALESCE(NEW.raw_user_meta_data ->> 'name', '')),
    COALESCE(NEW.raw_user_meta_data ->> 'surname', ''),
    '',  -- Empty DNI for OAuth users, they will complete it in registration
    COALESCE((NEW.raw_user_meta_data ->> 'birth_date')::date, '2000-01-01'),
    COALESCE((NEW.raw_user_meta_data ->> 'height')::integer, 170),
    COALESCE((NEW.raw_user_meta_data ->> 'weight')::integer, 70),
    COALESCE(NEW.raw_user_meta_data ->> 'gender', 'male')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;