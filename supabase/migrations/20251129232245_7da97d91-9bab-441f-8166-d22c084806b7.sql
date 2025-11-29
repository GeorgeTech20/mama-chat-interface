-- Habilitar RLS en medical_files (las políticas ya existen pero RLS estaba deshabilitado)
ALTER TABLE public.medical_files ENABLE ROW LEVEL SECURITY;