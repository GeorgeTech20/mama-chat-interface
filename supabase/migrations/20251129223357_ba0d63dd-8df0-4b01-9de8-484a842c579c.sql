-- Crear tabla patients para datos médicos y administrativos
CREATE TABLE public.patients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dni text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date NOT NULL,
  height integer,
  weight integer,
  gender text CHECK (gender IN ('male', 'female')),
  phone text,
  email text,
  user_creator uuid,
  user_owner uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT patients_pkey PRIMARY KEY (id)
);

-- Agregar columnas a profiles para referencias a pacientes
ALTER TABLE public.profiles
  ADD COLUMN patient_main uuid,
  ADD COLUMN patient_active uuid,
  ADD COLUMN phone text;

-- Agregar foreign keys después de crear la tabla patients
ALTER TABLE public.patients
  ADD CONSTRAINT fk_user_creator FOREIGN KEY (user_creator) REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_user_owner FOREIGN KEY (user_owner) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT fk_patient_main FOREIGN KEY (patient_main) REFERENCES public.patients(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_patient_active FOREIGN KEY (patient_active) REFERENCES public.patients(id) ON DELETE SET NULL;

-- Habilitar RLS en patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para patients
CREATE POLICY "Users can view patients they own or created"
ON public.patients
FOR SELECT
USING (auth.uid() = user_owner OR auth.uid() = user_creator);

CREATE POLICY "Users can insert patients"
ON public.patients
FOR INSERT
WITH CHECK (auth.uid() = user_creator);

CREATE POLICY "Users can update patients they own"
ON public.patients
FOR UPDATE
USING (auth.uid() = user_owner OR auth.uid() = user_creator);

CREATE POLICY "Users can delete patients they created (not main)"
ON public.patients
FOR DELETE
USING (auth.uid() = user_creator AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE patient_main = patients.id
));

-- Trigger para updated_at en patients
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Función para crear paciente principal al registrarse
CREATE OR REPLACE FUNCTION public.create_main_patient(
  p_user_id uuid,
  p_dni text,
  p_first_name text,
  p_last_name text,
  p_birth_date date,
  p_height integer,
  p_weight integer,
  p_gender text,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_existing_patient_id uuid;
  result json;
BEGIN
  -- Verificar autenticación
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'User ID mismatch';
  END IF;

  -- Verificar si ya existe un paciente con ese DNI
  SELECT id INTO v_existing_patient_id FROM public.patients WHERE dni = p_dni;
  
  IF v_existing_patient_id IS NOT NULL THEN
    -- Si existe, actualizar el user_owner al nuevo usuario
    UPDATE public.patients 
    SET user_owner = p_user_id,
        first_name = p_first_name,
        last_name = p_last_name,
        birth_date = p_birth_date,
        height = p_height,
        weight = p_weight,
        gender = p_gender,
        phone = COALESCE(p_phone, phone),
        email = COALESCE(p_email, email)
    WHERE id = v_existing_patient_id;
    
    v_patient_id := v_existing_patient_id;
  ELSE
    -- Crear nuevo paciente
    INSERT INTO public.patients (dni, first_name, last_name, birth_date, height, weight, gender, phone, email, user_creator, user_owner)
    VALUES (p_dni, p_first_name, p_last_name, p_birth_date, p_height, p_weight, p_gender, p_phone, p_email, p_user_id, p_user_id)
    RETURNING id INTO v_patient_id;
  END IF;

  -- Actualizar el perfil con las referencias al paciente
  UPDATE public.profiles
  SET patient_main = v_patient_id,
      patient_active = v_patient_id,
      phone = COALESCE(p_phone, profiles.phone)
  WHERE user_id = p_user_id;

  SELECT to_json(patients.*) INTO result FROM public.patients WHERE id = v_patient_id;
  RETURN result;
END;
$$;

-- Función para agregar familiar
CREATE OR REPLACE FUNCTION public.add_family_patient(
  p_dni text,
  p_first_name text,
  p_last_name text,
  p_birth_date date,
  p_height integer DEFAULT NULL,
  p_weight integer DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_relationship text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_existing_patient_id uuid;
  v_user_id uuid;
  result json;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verificar si ya existe un paciente con ese DNI
  SELECT id INTO v_existing_patient_id FROM public.patients WHERE dni = p_dni;
  
  IF v_existing_patient_id IS NOT NULL THEN
    -- Si existe y el usuario no es owner/creator, no puede agregarlo
    IF NOT EXISTS (
      SELECT 1 FROM public.patients 
      WHERE id = v_existing_patient_id 
      AND (user_owner = v_user_id OR user_creator = v_user_id OR user_owner IS NULL)
    ) THEN
      RAISE EXCEPTION 'Patient with this DNI already exists and belongs to another user';
    END IF;
    
    v_patient_id := v_existing_patient_id;
  ELSE
    -- Crear nuevo paciente familiar
    INSERT INTO public.patients (dni, first_name, last_name, birth_date, height, weight, gender, user_creator, user_owner)
    VALUES (p_dni, p_first_name, p_last_name, p_birth_date, p_height, p_weight, p_gender, v_user_id, v_user_id)
    RETURNING id INTO v_patient_id;
  END IF;

  SELECT to_json(patients.*) INTO result FROM public.patients WHERE id = v_patient_id;
  RETURN result;
END;
$$;