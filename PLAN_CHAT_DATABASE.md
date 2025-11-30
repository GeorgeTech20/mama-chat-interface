# Plan: Estructura de Base de Datos para Chat con Bot "Mama"

## 📋 Contexto Actual

- ✅ Tabla `patients` ya existe con UUID, relación con `profiles`
- ✅ Tabla `medical_files` para archivos médicos
- ✅ RLS (Row Level Security) habilitado en todas las tablas
- ❌ Chat actual: Solo en memoria, sin persistencia

## 🎯 Objetivos

1. **Una sola conversación activa** por paciente (prototipo simplificado)
2. **Paginación de mensajes**: Cargar 21 mensajes previos inicialmente, cargar más al hacer scroll
3. **Persistir mensajes** entre paciente y bot "Mama"
4. **Soporte para archivos adjuntos** en mensajes
5. **Campo de fiabilidad** en `medical_files` para medir confiabilidad de información médica
6. **Seguridad** con RLS (solo el usuario puede ver sus conversaciones)

---

## 📊 Propuesta de Esquema

### Tabla 1: `conversations` (Conversaciones) - UNA SOLA POR PACIENTE

**Propósito**: Una sola conversación activa por paciente con el bot "Mama".

```sql
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL UNIQUE REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contexto de la conversación (JSONB para flexibilidad)
  context jsonb DEFAULT '{}'::jsonb, -- Para guardar síntomas, estado, etc.
  
  -- Timestamps
  started_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Campos importantes**:
- `id`: UUID único de la conversación
- `patient_id`: Relación UNIQUE con la tabla `patients` (una conversación por paciente)
- `user_id`: Usuario autenticado (dueño de la conversación)
- `context`: JSONB para contexto adicional (síntomas detectados, estado de la conversación, etc.)
- `started_at`: Cuándo comenzó la conversación
- `last_message_at`: Último mensaje (para ordenar y paginar)

---

### Tabla 2: `chat_messages` (Mensajes del Chat)

**Propósito**: Almacena cada mensaje individual de la conversación.

```sql
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  
  -- Contenido del mensaje
  content text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'mama')),
  
  -- Archivos adjuntos (opcional)
  attachment_id uuid REFERENCES public.medical_files(id) ON DELETE SET NULL,
  attachment_type text CHECK (attachment_type IN ('image', 'pdf', 'document')),
  
  -- Metadatos
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  is_read boolean DEFAULT false, -- Para futuras notificaciones
  
  -- Timestamps
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Campos importantes**:
- `id`: UUID único del mensaje
- `conversation_id`: Relación con la conversación
- `content`: Texto del mensaje
- `sender`: Quién envió ('user' o 'mama')
- `attachment_id`: Referencia a `medical_files` si hay archivo adjunto
- `message_type`: Tipo de mensaje (text, file, system)
- `is_read`: Para futuras notificaciones
- `sent_at`: Cuándo se envió el mensaje

---

## 🔒 Seguridad (RLS Policies)

### Políticas para `conversations`:

```sql
-- Habilitar RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propias conversaciones
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = user_id);

-- Los usuarios solo pueden crear conversaciones para sí mismos
CREATE POLICY "Users can insert their own conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Los usuarios solo pueden actualizar sus propias conversaciones
CREATE POLICY "Users can update their own conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = user_id);
```

### Políticas para `chat_messages`:

```sql
-- Habilitar RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver mensajes de sus conversaciones
CREATE POLICY "Users can view messages from their conversations"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = chat_messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

-- Los usuarios solo pueden insertar mensajes en sus conversaciones
CREATE POLICY "Users can insert messages to their conversations"
ON public.chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = chat_messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

-- Los usuarios pueden actualizar sus propios mensajes (solo user, no mama)
CREATE POLICY "Users can update their own messages"
ON public.chat_messages FOR UPDATE
USING (
  sender = 'user' AND
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = chat_messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);
```

---

## 📈 Índices para Performance y Paginación

```sql
-- Índices para búsquedas rápidas
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_patient_id ON public.conversations(patient_id);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

-- Índices para mensajes (optimizados para paginación)
CREATE INDEX idx_chat_messages_conversation_id_sent_at ON public.chat_messages(conversation_id, sent_at DESC);
-- Este índice compuesto permite consultas eficientes de paginación
```

### Estrategia de Paginación

**Carga inicial**: Últimos 21 mensajes (más recientes)
```sql
SELECT * FROM chat_messages 
WHERE conversation_id = $1 
ORDER BY sent_at DESC 
LIMIT 21;
```

**Carga al hacer scroll (mensajes más antiguos)**:
```sql
SELECT * FROM chat_messages 
WHERE conversation_id = $1 
AND sent_at < $2  -- sent_at del mensaje más antiguo cargado
ORDER BY sent_at DESC 
LIMIT 21;
```

---

## 🔄 Triggers y Funciones

### Trigger para actualizar `last_message_at` en conversaciones:

```sql
-- Función para actualizar last_message_at cuando se inserta un mensaje
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

-- Trigger que se ejecuta al insertar un mensaje
CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();
```

### Trigger para `updated_at` en conversaciones:

```sql
-- Usar la función existente update_updated_at_column()
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

---

## 📝 Tipos TypeScript

### Actualizar `src/types/health.ts`:

```typescript
export interface Conversation {
  id: string;
  patient_id: string;
  user_id: string;
  title: string | null;
  status: 'active' | 'archived' | 'closed';
  started_at: string;
  last_message_at: string;
  archived_at: string | null;
  closed_at: string | null;
  context: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  content: string;
  sender: 'user' | 'mama';
  attachment_id: string | null;
  attachment_type: 'image' | 'pdf' | 'document' | null;
  message_type: 'text' | 'file' | 'system';
  is_read: boolean;
  sent_at: string;
  created_at: string;
}

// Mantener el tipo Message para compatibilidad con el componente actual
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'mama';
  timestamp: Date;
  attachment_id?: string;
  attachment_type?: 'image' | 'pdf' | 'document';
}
```

---

## 🚀 Flujo de Implementación

### Fase 1: Migración de Base de Datos
1. ✅ Crear tabla `conversations`
2. ✅ Crear tabla `chat_messages`
3. ✅ Configurar RLS policies
4. ✅ Crear índices
5. ✅ Crear triggers y funciones

### Fase 2: Actualizar Tipos TypeScript
1. ✅ Agregar tipos `Conversation` y `ChatMessage`
2. ✅ Mantener compatibilidad con tipo `Message` existente

### Fase 3: Integración en Componente Chat
1. ✅ Crear hook `useConversation` para manejar conversaciones
2. ✅ Crear hook `useChatMessages` para cargar/guardar mensajes
3. ✅ Actualizar componente `Chat.tsx` para usar persistencia
4. ✅ Cargar conversación activa al iniciar
5. ✅ Guardar mensajes en tiempo real

### Fase 4: Funcionalidades Adicionales
1. ⏳ Lista de conversaciones anteriores
2. ⏳ Búsqueda en conversaciones
3. ⏳ Archivar conversaciones
4. ⏳ Notificaciones de mensajes no leídos

---

## 📋 Checklist de Implementación

### Fase 1: Base de Datos
- [ ] Crear migración SQL con tabla `conversations` (una por paciente)
- [ ] Crear migración SQL con tabla `chat_messages`
- [ ] Agregar campo `reliability_score` a `medical_files`
- [ ] Configurar RLS policies para ambas tablas
- [ ] Crear índices para performance y paginación
- [ ] Crear triggers para actualización automática de `last_message_at`

### Fase 2: Tipos y Hooks
- [ ] Actualizar tipos TypeScript (`Conversation`, `ChatMessage`)
- [ ] Actualizar tipo `MedicalFile` con `reliability_score`
- [ ] Crear hook `useConversation` para manejar conversación activa
- [ ] Crear hook `useChatMessages` con paginación (21 mensajes por carga)

### Fase 3: Integración en Chat
- [ ] Integrar persistencia en componente `Chat.tsx`
- [ ] Cargar conversación activa al iniciar (o crear si no existe)
- [ ] Cargar últimos 21 mensajes al iniciar
- [ ] Implementar scroll infinito para cargar más mensajes
- [ ] Guardar mensajes en tiempo real
- [ ] Integrar `reliability_score` al subir archivos

### Fase 4: Testing
- [ ] Probar carga de conversación existente
- [ ] Probar creación de nueva conversación
- [ ] Probar guardado de nuevos mensajes
- [ ] Probar paginación (scroll para cargar más mensajes)
- [ ] Probar archivos adjuntos con `reliability_score`

---

## 🔍 Consideraciones Adicionales

### Escalabilidad y Paginación
- **Una conversación por paciente**: Simplifica el modelo para el prototipo
- **Paginación eficiente**: Cargar 21 mensajes inicialmente, más al hacer scroll
- Índice compuesto en `(conversation_id, sent_at DESC)` permite consultas rápidas
- Los mensajes se cargan de más recientes a más antiguos
- Considerar límite máximo de mensajes cargados en memoria (ej: 100-200)

### Privacidad
- RLS garantiza que solo el usuario vea sus conversaciones
- Los mensajes del bot "mama" también están protegidos por RLS
- Considerar encriptación de mensajes sensibles en el futuro

### Performance
- Índices en campos de búsqueda frecuente
- Trigger para actualizar `last_message_at` automáticamente
- Considerar caché de conversaciones activas en el cliente

---

## 📊 Actualización: Campo de Fiabilidad en `medical_files`

### Propósito
Agregar un campo que mida el nivel de confiabilidad de la información médica contenida en el documento.

### Escala de Fiabilidad (0-10)
- **0-3**: Información no verificada, comentario casual del usuario
- **4-6**: Información proporcionada por el usuario sin verificación médica
- **7-8**: Documento médico de fuente confiable (clínica, laboratorio reconocido)
- **9-10**: Documento oficial, certificado médico, resultado de examen de institución reconocida

### Migración SQL

```sql
-- Agregar campo reliability_score a medical_files
ALTER TABLE public.medical_files 
ADD COLUMN reliability_score integer DEFAULT 5 
CHECK (reliability_score >= 0 AND reliability_score <= 10);

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN public.medical_files.reliability_score IS 
'Puntuación de fiabilidad de la información médica (0-10). 
0-3: No verificada, 4-6: Usuario sin verificación, 7-8: Fuente confiable, 9-10: Oficial';

-- Crear índice para consultas por fiabilidad
CREATE INDEX idx_medical_files_reliability_score ON public.medical_files(reliability_score DESC);
```

### Ejemplos de Uso

```typescript
// Usuario dice "Mi tipo de sangre es B" (comentario casual)
reliability_score: 5

// Usuario sube un examen de laboratorio de clínica reconocida
reliability_score: 8

// Usuario sube un certificado médico oficial
reliability_score: 10
```

### Actualización en TypeScript

```typescript
// Actualizar tipo en src/integrations/supabase/types.ts
export interface MedicalFile {
  id: string;
  user_id: string | null;
  patient_id: string | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description: string | null;
  reliability_score: number; // 0-10
  created_at: string;
}
```

---

## 📚 Referencias

- Estructura existente: `supabase/migrations/20251129223357_*.sql`
- Tabla `patients`: Ya existe con UUID y relaciones
- Tabla `medical_files`: Ya existe para archivos adjuntos (tiene `patient_id`)
- RLS patterns: Seguir el mismo patrón de las tablas existentes

