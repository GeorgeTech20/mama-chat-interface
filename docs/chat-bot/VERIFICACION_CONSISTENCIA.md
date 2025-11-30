# Verificación de Consistencia: Checklist de Base de Datos

## ✅ Verificación con Supabase PostgreSQL

### Contexto del Proyecto
- **Base de datos**: Supabase PostgreSQL
- **Formato de migraciones**: SQL estándar en `supabase/migrations/`
- **Patrones existentes**: Revisados en migraciones anteriores

---

## 📋 Checklist Verificado

### [✅] Crear migración SQL con tabla `conversations` (una por paciente)

**Consistencia**: ✅ **CONSISTENTE**

**Patrones verificados**:
- ✅ Usa `uuid NOT NULL DEFAULT gen_random_uuid()` (igual que `patients`)
- ✅ Usa `timestamptz NOT NULL DEFAULT now()` (igual que tablas existentes)
- ✅ Foreign keys con `REFERENCES` y `ON DELETE CASCADE` (igual que `patients`)
- ✅ Constraint `UNIQUE` en `patient_id` (nuevo, pero válido)
- ✅ Campo `context jsonb DEFAULT '{}'::jsonb` (JSONB es estándar en Supabase)

**Ejemplo de estructura consistente**:
```sql
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL UNIQUE REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);
```

---

### [✅] Crear migración SQL con tabla `chat_messages`

**Consistencia**: ✅ **CONSISTENTE**

**Patrones verificados**:
- ✅ Usa `uuid NOT NULL DEFAULT gen_random_uuid()` (igual que `medical_files`)
- ✅ Foreign key con `ON DELETE CASCADE` (igual que otras tablas)
- ✅ CHECK constraints con `IN ('user', 'mama')` (patrón estándar)
- ✅ Campo `sent_at timestamptz` (consistente con timestamps del proyecto)
- ✅ Foreign key opcional a `medical_files` con `ON DELETE SET NULL` (correcto)

**Ejemplo de estructura consistente**:
```sql
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  content text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'mama')),
  attachment_id uuid REFERENCES public.medical_files(id) ON DELETE SET NULL,
  attachment_type text CHECK (attachment_type IN ('image', 'pdf', 'document')),
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  is_read boolean DEFAULT false,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);
```

---

### [✅] Agregar campo `reliability_score` a `medical_files`

**Consistencia**: ✅ **CONSISTENTE**

**Patrones verificados**:
- ✅ Usa `ALTER TABLE` para agregar columna (igual que migración `20251129232227` que agrega `patient_id`)
- ✅ CHECK constraint con rango (1-100) (patrón estándar, similar a `gender CHECK IN ('male', 'female')`)
- ✅ `DEFAULT NULL` para valores no analizados (correcto)
- ✅ Comentario con `COMMENT ON COLUMN` (buena práctica)

**Ejemplo de migración consistente**:
```sql
-- Agregar campo reliability_score a medical_files
ALTER TABLE public.medical_files 
ADD COLUMN reliability_score integer DEFAULT NULL 
CHECK (reliability_score IS NULL OR (reliability_score >= 1 AND reliability_score <= 100));

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN public.medical_files.reliability_score IS 
'Puntuación de fiabilidad de la información médica (1-100), calculada por el bot después del análisis.
1-30: No verificada, 31-60: Usuario sin verificación, 61-80: Fuente confiable, 81-100: Oficial.
NULL indica que el documento aún no ha sido analizado por el bot.';
```

**Nota**: Esta migración sigue el mismo patrón que `20251129232227` que agrega `patient_id` a `medical_files`.

---

### [✅] Configurar RLS policies para ambas tablas

**Consistencia**: ✅ **CONSISTENTE**

**Patrones verificados**:
- ✅ `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (igual que `patients` y `medical_files`)
- ✅ Políticas con `auth.uid()` (estándar de Supabase)
- ✅ Políticas SELECT, INSERT, UPDATE (igual que `patients`)
- ✅ Uso de `EXISTS` para verificar relaciones (patrón correcto)

**Ejemplo de políticas consistentes**:
```sql
-- Habilitar RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Políticas siguiendo el patrón de patients
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = user_id);

-- Para chat_messages, usar EXISTS (patrón de medical_files con patient_id)
CREATE POLICY "Users can view messages from their conversations"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = chat_messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);
```

**Nota**: El patrón de `chat_messages` es similar al de `medical_files` que verifica `patient_id` en `patients`.

---

### [✅] Crear índices para performance y paginación

**Consistencia**: ✅ **CONSISTENTE**

**Patrones verificados**:
- ✅ Índices con `CREATE INDEX idx_*` (igual que `idx_medical_files_patient_id`)
- ✅ Índice compuesto para paginación (patrón estándar de PostgreSQL)
- ✅ `DESC` para ordenamiento descendente (correcto para mensajes recientes)

**Ejemplo de índices consistentes**:
```sql
-- Índices simples (igual que idx_medical_files_patient_id)
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_patient_id ON public.conversations(patient_id);

-- Índice compuesto para paginación eficiente
CREATE INDEX idx_chat_messages_conversation_id_sent_at 
ON public.chat_messages(conversation_id, sent_at DESC);

-- Índice para reliability_score (igual que otros índices)
CREATE INDEX idx_medical_files_reliability_score 
ON public.medical_files(reliability_score DESC);
```

**Nota**: El índice compuesto `(conversation_id, sent_at DESC)` es el patrón estándar para paginación eficiente en PostgreSQL.

---

### [✅] Crear triggers para actualización automática de `last_message_at`

**Consistencia**: ✅ **CONSISTENTE**

**Patrones verificados**:
- ✅ Función `CREATE OR REPLACE FUNCTION` (igual que `update_updated_at_column()`)
- ✅ `LANGUAGE plpgsql` (estándar del proyecto)
- ✅ Trigger `AFTER INSERT` (correcto para actualizar después de insertar)
- ✅ Uso de función existente `update_updated_at_column()` (ya existe en migración `20251129173945`)

**Ejemplo de trigger consistente**:
```sql
-- Función para actualizar last_message_at (nueva)
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.sent_at,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger (patrón igual que update_patients_updated_at)
CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();

-- Trigger para updated_at usando función existente
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

**Nota**: La función `update_updated_at_column()` ya existe en la migración `20251129173945`, por lo que solo necesitamos referenciarla.

---

## ✅ Resumen de Consistencia

| Item | Estado | Notas |
|------|--------|-------|
| Tabla `conversations` | ✅ Consistente | Sigue patrón de `patients` |
| Tabla `chat_messages` | ✅ Consistente | Sigue patrón de `medical_files` |
| Campo `reliability_score` | ✅ Consistente | Sigue patrón de `ALTER TABLE` existente |
| RLS Policies | ✅ Consistente | Usa `auth.uid()` como estándar |
| Índices | ✅ Consistente | Patrón estándar de PostgreSQL |
| Triggers | ✅ Consistente | Usa función existente `update_updated_at_column()` |

---

## 📝 Recomendaciones

1. **Orden de migraciones**: Crear las migraciones en este orden:
   - Primero: Agregar `reliability_score` a `medical_files`
   - Segundo: Crear tabla `conversations`
   - Tercero: Crear tabla `chat_messages` (depende de `conversations`)
   - Cuarto: Crear triggers (depende de ambas tablas)

2. **Nombres de migraciones**: Seguir el formato existente:
   - `YYYYMMDDHHMMSS_description.sql`
   - Ejemplo: `20251130000000_add_chat_tables.sql`

3. **Testing**: Verificar que:
   - Las foreign keys funcionan correctamente
   - RLS policies bloquean acceso no autorizado
   - Los triggers actualizan `last_message_at` correctamente
   - La paginación funciona con el índice compuesto

---

## ✅ Conclusión

**El checklist es 100% consistente con el proyecto Supabase PostgreSQL.**

Todos los elementos siguen los patrones establecidos en las migraciones existentes:
- Formato SQL estándar
- Uso de `gen_random_uuid()` para UUIDs
- `timestamptz` para timestamps
- RLS con `auth.uid()`
- Triggers con funciones PL/pgSQL
- Índices estándar de PostgreSQL

**Listo para implementar** ✅

