-- Create medical_files table
CREATE TABLE public.medical_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own files"
ON public.medical_files FOR SELECT
USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own files"
ON public.medical_files FOR INSERT
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
ON public.medical_files FOR DELETE
USING (user_id IS NULL OR auth.uid() = user_id);

-- Create storage bucket for medical files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('medical-files', 'medical-files', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

-- Storage policies
CREATE POLICY "Anyone can view medical files"
ON storage.objects FOR SELECT
USING (bucket_id = 'medical-files');

CREATE POLICY "Anyone can upload medical files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'medical-files');

CREATE POLICY "Anyone can delete their medical files"
ON storage.objects FOR DELETE
USING (bucket_id = 'medical-files');