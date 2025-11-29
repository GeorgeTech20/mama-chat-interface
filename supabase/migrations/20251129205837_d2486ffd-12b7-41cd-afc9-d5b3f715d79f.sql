-- Create a function to update profile that bypasses RLS
-- This is safe because we verify the user_id matches the authenticated user
CREATE OR REPLACE FUNCTION public.upsert_profile(
  p_user_id uuid,
  p_name text,
  p_surname text,
  p_dni text,
  p_birth_date date,
  p_height integer,
  p_weight integer,
  p_gender text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Verify the caller is the same as the user_id being updated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'User ID mismatch - you can only update your own profile';
  END IF;

  -- Perform the upsert
  INSERT INTO public.profiles (user_id, name, surname, dni, birth_date, height, weight, gender)
  VALUES (p_user_id, p_name, p_surname, p_dni, p_birth_date, p_height, p_weight, p_gender)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    name = EXCLUDED.name,
    surname = EXCLUDED.surname,
    dni = EXCLUDED.dni,
    birth_date = EXCLUDED.birth_date,
    height = EXCLUDED.height,
    weight = EXCLUDED.weight,
    gender = EXCLUDED.gender,
    updated_at = now()
  RETURNING to_json(profiles.*) INTO result;
  
  RETURN result;
END;
$$;