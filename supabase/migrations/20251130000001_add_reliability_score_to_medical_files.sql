-- Agregar campo reliability_score a medical_files
-- Este campo mide la confiabilidad de la información médica (1-100)
-- NULL indica que el documento aún no ha sido analizado por el bot

ALTER TABLE public.medical_files 
ADD COLUMN reliability_score integer DEFAULT NULL 
CHECK (reliability_score IS NULL OR (reliability_score >= 1 AND reliability_score <= 100));

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN public.medical_files.reliability_score IS 
'Puntuación de fiabilidad de la información médica (1-100), calculada por el bot después del análisis.
1-30: No verificada, 31-60: Usuario sin verificación, 61-80: Fuente confiable, 81-100: Oficial.
NULL indica que el documento aún no ha sido analizado por el bot.';

-- Crear índice para consultas por fiabilidad
CREATE INDEX idx_medical_files_reliability_score ON public.medical_files(reliability_score DESC);


