-- 1. Agregar patient_id a medical_files para asociar archivos a pacientes específicos
ALTER TABLE public.medical_files 
ADD COLUMN patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;

-- 2. Crear índice para mejorar rendimiento de consultas por paciente
CREATE INDEX idx_medical_files_patient_id ON public.medical_files(patient_id);

-- 3. Crear paciente Jorge (el usuario principal)
INSERT INTO public.patients (
  dni, 
  first_name, 
  last_name, 
  birth_date, 
  height, 
  weight, 
  gender, 
  phone,
  user_creator, 
  user_owner
)
SELECT 
  p.dni,
  p.name,
  p.surname,
  p.birth_date,
  p.height,
  p.weight,
  p.gender,
  p.phone,
  p.user_id,
  p.user_id
FROM public.profiles p
WHERE p.user_id = (SELECT id FROM auth.users WHERE email = 'giorgifrancknr@gmail.com')
AND NOT EXISTS (
  SELECT 1 FROM public.patients pt WHERE pt.dni = p.dni
);

-- 4. Actualizar profile de Jorge con su patient_main y patient_active correctos
UPDATE public.profiles 
SET 
  patient_main = (
    SELECT pt.id FROM public.patients pt 
    JOIN public.profiles pr ON pt.dni = pr.dni 
    WHERE pr.user_id = profiles.user_id
  ),
  patient_active = (
    SELECT pt.id FROM public.patients pt 
    JOIN public.profiles pr ON pt.dni = pr.dni 
    WHERE pr.user_id = profiles.user_id
  )
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'giorgifrancknr@gmail.com');

-- 5. Actualizar RLS de medical_files para incluir acceso por patient_id
DROP POLICY IF EXISTS "Users can view their own files" ON public.medical_files;
DROP POLICY IF EXISTS "Users can insert their own files" ON public.medical_files;
DROP POLICY IF EXISTS "Users can delete their own files" ON public.medical_files;

-- Política de SELECT: ver archivos propios o de pacientes que posee/creó
CREATE POLICY "Users can view files of their patients"
ON public.medical_files FOR SELECT
USING (
  auth.uid() = user_id 
  OR patient_id IN (
    SELECT id FROM public.patients 
    WHERE user_owner = auth.uid() OR user_creator = auth.uid()
  )
);

-- Política de INSERT: insertar archivos para sí mismo o pacientes que posee
CREATE POLICY "Users can insert files for their patients"
ON public.medical_files FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  OR patient_id IN (
    SELECT id FROM public.patients 
    WHERE user_owner = auth.uid() OR user_creator = auth.uid()
  )
);

-- Política de DELETE: eliminar archivos propios o de pacientes que posee
CREATE POLICY "Users can delete files of their patients"
ON public.medical_files FOR DELETE
USING (
  auth.uid() = user_id 
  OR patient_id IN (
    SELECT id FROM public.patients 
    WHERE user_owner = auth.uid() OR user_creator = auth.uid()
  )
);