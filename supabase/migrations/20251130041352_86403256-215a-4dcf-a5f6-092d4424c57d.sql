-- Create profiles table linking Supabase Auth to backend
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  backend_user_id bigint, -- Reference to backend users table for sync
  name text NOT NULL DEFAULT '',
  surname text NOT NULL DEFAULT '',
  dni text NOT NULL DEFAULT '',
  birth_date date NOT NULL DEFAULT '2000-01-01',
  height integer NOT NULL DEFAULT 170,
  weight integer NOT NULL DEFAULT 70,
  gender text NOT NULL DEFAULT 'male' CHECK (gender IN ('male', 'female')),
  phone text,
  patient_main uuid,
  patient_active uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Create patients table with UUID (for frontend) but compatible with backend bigint refs
CREATE TABLE IF NOT EXISTS public.patients_app (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  backend_patient_id bigint, -- Reference to backend patients table for sync
  dni text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date NOT NULL,
  height integer,
  weight integer,
  gender text CHECK (gender IN ('male', 'female')),
  phone text,
  email text,
  user_creator uuid REFERENCES auth.users(id),
  user_owner uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT patients_app_pkey PRIMARY KEY (id),
  CONSTRAINT patients_app_dni_key UNIQUE (dni)
);

-- Add foreign keys to profiles for patients
ALTER TABLE public.profiles 
  ADD CONSTRAINT fk_patient_main FOREIGN KEY (patient_main) REFERENCES public.patients_app(id),
  ADD CONSTRAINT fk_patient_active FOREIGN KEY (patient_active) REFERENCES public.patients_app(id);

-- Create medical_files table
CREATE TABLE IF NOT EXISTS public.medical_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  patient_id uuid REFERENCES public.patients_app(id),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT medical_files_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients_app ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for patients_app
CREATE POLICY "Users can view own patients" ON public.patients_app
  FOR SELECT USING (auth.uid() = user_owner OR auth.uid() = user_creator);

CREATE POLICY "Users can insert own patients" ON public.patients_app
  FOR INSERT WITH CHECK (auth.uid() = user_creator);

CREATE POLICY "Users can update own patients" ON public.patients_app
  FOR UPDATE USING (auth.uid() = user_owner);

CREATE POLICY "Users can delete own patients" ON public.patients_app
  FOR DELETE USING (auth.uid() = user_owner);

-- RLS Policies for medical_files
CREATE POLICY "Users can view own files" ON public.medical_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files" ON public.medical_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON public.medical_files
  FOR DELETE USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, surname, dni, birth_date, height, weight, gender)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', COALESCE(NEW.raw_user_meta_data ->> 'name', '')),
    COALESCE(NEW.raw_user_meta_data ->> 'surname', ''),
    '',
    COALESCE((NEW.raw_user_meta_data ->> 'birth_date')::date, '2000-01-01'),
    COALESCE((NEW.raw_user_meta_data ->> 'height')::integer, 170),
    COALESCE((NEW.raw_user_meta_data ->> 'weight')::integer, 70),
    COALESCE(NEW.raw_user_meta_data ->> 'gender', 'male')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_app_updated_at
  BEFORE UPDATE ON public.patients_app
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to upsert profile
CREATE OR REPLACE FUNCTION public.upsert_profile(
  p_user_id uuid, p_name text, p_surname text, p_dni text, 
  p_birth_date date, p_height integer, p_weight integer, p_gender text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF auth.uid() != p_user_id THEN RAISE EXCEPTION 'User ID mismatch'; END IF;

  INSERT INTO public.profiles (user_id, name, surname, dni, birth_date, height, weight, gender)
  VALUES (p_user_id, p_name, p_surname, p_dni, p_birth_date, p_height, p_weight, p_gender)
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name, surname = EXCLUDED.surname, dni = EXCLUDED.dni,
    birth_date = EXCLUDED.birth_date, height = EXCLUDED.height, weight = EXCLUDED.weight,
    gender = EXCLUDED.gender, updated_at = now()
  RETURNING to_json(profiles.*) INTO result;
  
  RETURN result;
END;
$$;

-- Function to create main patient
CREATE OR REPLACE FUNCTION public.create_main_patient(
  p_user_id uuid, p_dni text, p_first_name text, p_last_name text,
  p_birth_date date, p_height integer, p_weight integer, p_gender text,
  p_phone text DEFAULT NULL, p_email text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_existing_patient_id uuid;
  result json;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF auth.uid() != p_user_id THEN RAISE EXCEPTION 'User ID mismatch'; END IF;

  SELECT id INTO v_existing_patient_id FROM public.patients_app WHERE dni = p_dni;
  
  IF v_existing_patient_id IS NOT NULL THEN
    UPDATE public.patients_app SET
      user_owner = p_user_id, first_name = p_first_name, last_name = p_last_name,
      birth_date = p_birth_date, height = p_height, weight = p_weight, gender = p_gender,
      phone = COALESCE(p_phone, phone), email = COALESCE(p_email, email)
    WHERE id = v_existing_patient_id;
    v_patient_id := v_existing_patient_id;
  ELSE
    INSERT INTO public.patients_app (dni, first_name, last_name, birth_date, height, weight, gender, phone, email, user_creator, user_owner)
    VALUES (p_dni, p_first_name, p_last_name, p_birth_date, p_height, p_weight, p_gender, p_phone, p_email, p_user_id, p_user_id)
    RETURNING id INTO v_patient_id;
  END IF;

  UPDATE public.profiles SET patient_main = v_patient_id, patient_active = v_patient_id,
    phone = COALESCE(p_phone, profiles.phone)
  WHERE user_id = p_user_id;

  SELECT to_json(patients_app.*) INTO result FROM public.patients_app WHERE id = v_patient_id;
  RETURN result;
END;
$$;

-- Function to add family patient
CREATE OR REPLACE FUNCTION public.add_family_patient(
  p_dni text, p_first_name text, p_last_name text, p_birth_date date,
  p_height integer DEFAULT NULL, p_weight integer DEFAULT NULL,
  p_gender text DEFAULT NULL, p_relationship text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_existing_patient_id uuid;
  v_user_id uuid;
  result json;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT id INTO v_existing_patient_id FROM public.patients_app WHERE dni = p_dni;
  
  IF v_existing_patient_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.patients_app 
      WHERE id = v_existing_patient_id 
      AND (user_owner = v_user_id OR user_creator = v_user_id OR user_owner IS NULL)
    ) THEN
      RAISE EXCEPTION 'Patient with this DNI already exists and belongs to another user';
    END IF;
    v_patient_id := v_existing_patient_id;
  ELSE
    INSERT INTO public.patients_app (dni, first_name, last_name, birth_date, height, weight, gender, user_creator, user_owner)
    VALUES (p_dni, p_first_name, p_last_name, p_birth_date, p_height, p_weight, p_gender, v_user_id, v_user_id)
    RETURNING id INTO v_patient_id;
  END IF;

  SELECT to_json(patients_app.*) INTO result FROM public.patients_app WHERE id = v_patient_id;
  RETURN result;
END;
$$;