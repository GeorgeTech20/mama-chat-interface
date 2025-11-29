-- Add unique constraint on user_id for profiles (needed for trigger)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only insert if profile doesn't exist for this user
  INSERT INTO public.profiles (user_id, name, surname, dni, birth_date, height, weight, gender)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'surname', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'dni', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'birth_date')::date, '2000-01-01'),
    COALESCE((NEW.raw_user_meta_data ->> 'height')::integer, 170),
    COALESCE((NEW.raw_user_meta_data ->> 'weight')::integer, 70),
    COALESCE(NEW.raw_user_meta_data ->> 'gender', 'male')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for profiles to allow authenticated users to view/update their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow public registration" ON public.profiles;

-- New policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);