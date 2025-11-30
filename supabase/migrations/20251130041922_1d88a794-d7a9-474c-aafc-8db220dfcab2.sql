-- Enable RLS on all backend tables
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flyway_schema_history ENABLE ROW LEVEL SECURITY;

-- Drop medical_documents if it exists and is unused (legacy table)
DROP TABLE IF EXISTS public.medical_documents;

-- Create restrictive policies for backend tables (block client access - backend handles its own auth)
-- These tables should only be accessed by the backend service, not Supabase client

-- appointments: deny all client access
CREATE POLICY "Backend only - appointments" ON public.appointments
  FOR ALL USING (false);

-- assessments: deny all client access
CREATE POLICY "Backend only - assessments" ON public.assessments
  FOR ALL USING (false);

-- conversations: deny all client access
CREATE POLICY "Backend only - conversations" ON public.conversations
  FOR ALL USING (false);

-- messages: deny all client access
CREATE POLICY "Backend only - messages" ON public.messages
  FOR ALL USING (false);

-- patients (backend table): deny all client access
CREATE POLICY "Backend only - patients" ON public.patients
  FOR ALL USING (false);

-- symptoms: deny all client access
CREATE POLICY "Backend only - symptoms" ON public.symptoms
  FOR ALL USING (false);

-- users (backend table): deny all client access
CREATE POLICY "Backend only - users" ON public.users
  FOR ALL USING (false);

-- flyway_schema_history: deny all client access
CREATE POLICY "Backend only - flyway" ON public.flyway_schema_history
  FOR ALL USING (false);