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
4. **Soporte para archivos adjuntos** en mensajes (por ahora solo imágenes, luego se agregarán más tipos de archivos)
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
  -- Por ahora solo se aceptan imágenes, luego se agregarán más tipos (pdf, document, etc.)
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
- `attachment_type`: Tipo de archivo adjunto (por ahora solo 'image', luego se agregarán 'pdf', 'document', etc.)
- `message_type`: Tipo de mensaje (text, file, system)
  - `'system'`: Mensaje automático del sistema (ej: mensaje de bienvenida del bot)
  - `'text'`: Mensaje de texto normal
  - `'file'`: Mensaje con archivo adjunto
- `is_read`: Para futuras notificaciones
- `sent_at`: Cuándo se envió el mensaje

**Nota sobre tipos de archivo**:
- **Fase inicial (prototipo)**: Solo se aceptan imágenes (JPG, PNG, WebP)
- **Fases futuras**: Se agregarán PDFs y otros tipos de documentos médicos
- La estructura de la base de datos ya está preparada para soportar múltiples tipos

**Nota sobre mensaje inicial**:
- Cuando se crea una conversación (primer mensaje del usuario), el sistema crea automáticamente un mensaje de bienvenida del bot
- Este mensaje tiene `message_type = 'system'` y `sender = 'mama'`
- El contenido es: "¡Hola! Soy Mama, tu asistente de salud. 💜\n\nEstoy aquí para ayudarte. Cuéntame, ¿qué síntomas estás experimentando hoy?"

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

// Estructura JSON de respuesta del bot "Mama"
export interface BotResponse {
  // Respuesta de texto para el usuario
  message: string;
  
  // Metadatos del análisis (si hay archivo adjunto)
  analysis?: {
    file_id: string; // ID del medical_file analizado
    reliability_score: number; // 1-100, calculado por el bot
    document_type?: 'certificate' | 'lab_result' | 'prescription' | 'medical_record' | 'other';
    extracted_data?: Record<string, any>; // Datos extraídos del documento (opcional)
  };
  
  // Contexto de la conversación (para mantener estado)
  context_update?: {
    symptoms?: string[];
    severity?: 'leve' | 'moderado' | 'grave';
    duration?: string;
    [key: string]: any; // Otros campos de contexto
  };
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
- [ ] **Implementar lógica de detección del primer mensaje**: Verificar si existe conversación, si no existe crearla
- [ ] **Crear mensaje inicial del bot automáticamente** cuando se crea la conversación (mensaje de bienvenida)
- [ ] Cargar conversación activa al iniciar (o verificar si existe)
- [ ] Cargar últimos 21 mensajes al iniciar (incluyendo mensaje de bienvenida si es nueva conversación)
- [ ] Implementar scroll infinito para cargar más mensajes
- [ ] Guardar mensajes en tiempo real
- [ ] **Soporte para archivos adjuntos (solo imágenes por ahora)**: JPG, PNG, WebP
- [ ] **Definir estructura JSON de respuesta del bot** (ver sección "Estructura JSON")
- [ ] **Implementar procesamiento de respuesta JSON** para extraer datos
- [ ] **Actualizar `medical_files.reliability_score`** desde JSON de respuesta
- [ ] **Actualizar `chat_messages`** desde JSON de respuesta
- [ ] **Actualizar `conversations.context`** desde JSON de respuesta (si aplica)
- [ ] Por ahora: Respuestas genéricas del bot (análisis real se implementará después)
- [ ] **Futuro**: Agregar soporte para PDFs y otros tipos de documentos

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
Agregar un campo que mida el nivel de confiabilidad de la información médica contenida en el documento. Este valor será calculado automáticamente por el bot "Mama" después de analizar el documento.

### Escala de Fiabilidad (1-100)
- **1-30**: Información no verificada, comentario casual del usuario, datos sin fuente médica
- **31-60**: Información proporcionada por el usuario sin verificación médica formal
- **61-80**: Documento médico de fuente confiable (clínica, laboratorio reconocido)
- **81-100**: Documento oficial, certificado médico, resultado de examen de institución reconocida

### Características Importantes
- **Cálculo automático**: El bot "Mama" analiza el documento y asigna el `reliability_score`
- **Post-análisis**: El valor se completa **después** de que el bot analiza el documento
- **Ponderación**: El bot puede resolver/calcular este valor en su respuesta basándose en:
  - Tipo de documento (certificado, examen, receta, etc.)
  - Fuente del documento (institución reconocida, clínica, etc.)
  - Contenido y estructura del documento
  - Verificabilidad de la información

### Migración SQL

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

-- Crear índice para consultas por fiabilidad
CREATE INDEX idx_medical_files_reliability_score ON public.medical_files(reliability_score DESC);
```

### Flujo de Procesamiento

#### Flujo Inicial (Primer Mensaje del Usuario)

1. **Usuario envía primer mensaje** → El sistema detecta que no existe conversación
2. **Crear conversación automáticamente** → Se crea `conversations` para el paciente activo
3. **Guardar mensaje del usuario** → Se guarda en `chat_messages` con `sender = 'user'`
4. **Crear mensaje inicial del bot** → Se crea automáticamente el mensaje de bienvenida de "Mama"
5. **Bot genera respuesta JSON** → Respuesta al mensaje del usuario
6. **Guardar respuesta del bot** → Se guarda en `chat_messages` con `sender = 'mama'`

#### Flujo con Archivo Adjunto

1. **Usuario sube archivo** → Se guarda en `medical_files` con `reliability_score` = `NULL`
2. **Bot "Mama" genera respuesta JSON** → Incluye `reliability_score` calculado (por ahora genérico, después con análisis real)
3. **Frontend recibe respuesta JSON** → Extrae datos estructurados
4. **Actualizar `medical_files.reliability_score`** → Con el valor del JSON (`analysis.reliability_score`)
5. **Guardar mensaje del bot** → En `chat_messages` con el contenido del JSON (`message`)
6. **Actualizar contexto** → Si existe `context_update` en el JSON, actualizar `conversations.context`

### Lógica de Detección del Primer Mensaje

El sistema debe reconocer internamente si es el primer mensaje:

```typescript
async function sendMessage(
  content: string,
  patientId: string,
  userId: string,
  attachmentId?: string
): Promise<void> {
  // 1. Verificar si existe conversación para este paciente
  let conversation = await getConversationByPatientId(patientId);
  
  // 2. Si no existe, crear conversación (PRIMER MENSAJE)
  if (!conversation) {
    conversation = await createConversation(patientId, userId);
    
    // 3. Crear mensaje inicial del bot automáticamente
    const welcomeMessage: ChatMessage = {
      conversation_id: conversation.id,
      content: '¡Hola! Soy Mama, tu asistente de salud. 💜\n\nEstoy aquí para ayudarte. Cuéntame, ¿qué síntomas estás experimentando hoy?',
      sender: 'mama',
      message_type: 'system',
      sent_at: new Date().toISOString()
    };
    
    await supabase
      .from('chat_messages')
      .insert(welcomeMessage);
  }
  
  // 4. Guardar mensaje del usuario
  const userMessage: ChatMessage = {
    conversation_id: conversation.id,
    content,
    sender: 'user',
    attachment_id: attachmentId || null,
    attachment_type: attachmentId ? 'image' : null,
    message_type: attachmentId ? 'file' : 'text',
    sent_at: new Date().toISOString()
  };
  
  await supabase
    .from('chat_messages')
    .insert(userMessage);
  
  // 5. Generar respuesta del bot (genérica por ahora)
  const botResponse = await generateBotResponse(content, attachmentId);
  
  // 6. Procesar respuesta JSON y guardar
  await processBotResponse(botResponse, conversation.id);
}
```

### Función Helper para Obtener/Crear Conversación

```typescript
async function getOrCreateConversation(
  patientId: string,
  userId: string
): Promise<Conversation> {
  // Intentar obtener conversación existente
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('patient_id', patientId)
    .eq('user_id', userId)
    .single();
  
  if (existing) {
    return existing;
  }
  
  // Si no existe, crear nueva conversación
  const { data: newConversation, error } = await supabase
    .from('conversations')
    .insert({
      patient_id: patientId,
      user_id: userId,
      context: {},
      started_at: new Date().toISOString(),
      last_message_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return newConversation;
}
```

### Ejemplos de Uso

```typescript
// Usuario dice "Mi tipo de sangre es B" (comentario casual)
// Bot analiza → reliability_score: 25

// Usuario sube un examen de laboratorio de clínica reconocida
// Bot analiza → reliability_score: 75

// Usuario sube un certificado médico oficial con sello
// Bot analiza → reliability_score: 95

// Documento aún no analizado
reliability_score: null
```

### Estructura JSON de Respuesta del Bot

**⚠️ IMPORTANTE**: La respuesta del bot debe ser en formato JSON para poder extraer datos estructurados.

#### Formato de Respuesta JSON

```typescript
interface BotResponse {
  // Respuesta de texto para el usuario
  message: string;
  
  // Metadatos del análisis (si hay archivo adjunto)
  analysis?: {
    file_id: string; // ID del medical_file analizado
    reliability_score: number; // 1-100, calculado por el bot
    document_type?: string; // 'certificate', 'lab_result', 'prescription', etc.
    extracted_data?: {
      // Datos extraídos del documento (opcional, para futuro)
      blood_type?: string;
      diagnosis?: string;
      medications?: string[];
      // ... otros campos según el tipo de documento
    };
  };
  
  // Contexto de la conversación (para mantener estado)
  context_update?: {
    symptoms?: string[];
    severity?: string;
    duration?: string;
    // ... otros campos de contexto
  };
}
```

#### Ejemplo de Respuesta JSON

```json
{
  "message": "He analizado tu examen de laboratorio. Los resultados muestran valores normales. El documento tiene una fiabilidad del 85% ya que proviene de una clínica reconocida.",
  "analysis": {
    "file_id": "123e4567-e89b-12d3-a456-426614174000",
    "reliability_score": 85,
    "document_type": "lab_result",
    "extracted_data": {
      "blood_type": "B+",
      "glucose": "95 mg/dL"
    }
  },
  "context_update": {
    "symptoms": ["fatiga"],
    "severity": "leve"
  }
}
```

### Procesamiento de la Respuesta JSON

#### Flujo de Procesamiento

1. **Usuario envía mensaje con archivo** → Se guarda en `medical_files` con `reliability_score = NULL`
2. **Bot procesa y genera respuesta JSON** → Incluye `reliability_score` calculado
3. **Frontend recibe respuesta JSON** → Extrae datos estructurados
4. **Actualizar `medical_files.reliability_score`** → Con el valor del JSON
5. **Actualizar mensaje del bot** → Guardar en `chat_messages`
6. **Mostrar respuesta al usuario** → Usar `message` del JSON

#### Código de Procesamiento (Frontend)

```typescript
interface BotResponse {
  message: string;
  analysis?: {
    file_id: string;
    reliability_score: number;
    document_type?: string;
    extracted_data?: Record<string, any>;
  };
  context_update?: Record<string, any>;
}

async function processBotResponse(
  responseJson: BotResponse,
  conversationId: string
): Promise<void> {
  // 1. Actualizar reliability_score del archivo si existe
  if (responseJson.analysis?.file_id && responseJson.analysis?.reliability_score) {
    await supabase
      .from('medical_files')
      .update({ 
        reliability_score: responseJson.analysis.reliability_score 
      })
      .eq('id', responseJson.analysis.file_id);
  }

  // 2. Guardar mensaje del bot en chat_messages
  const botMessage = {
    conversation_id: conversationId,
    content: responseJson.message,
    sender: 'mama',
    message_type: responseJson.analysis ? 'file' : 'text',
    attachment_id: responseJson.analysis?.file_id || null,
    sent_at: new Date().toISOString()
  };

  await supabase
    .from('chat_messages')
    .insert(botMessage);

  // 3. Actualizar contexto de la conversación si existe
  if (responseJson.context_update) {
    const { data: conversation } = await supabase
      .from('conversations')
      .select('context')
      .eq('id', conversationId)
      .single();

    const updatedContext = {
      ...(conversation?.context || {}),
      ...responseJson.context_update
    };

    await supabase
      .from('conversations')
      .update({ context: updatedContext })
      .eq('id', conversationId);
  }
}
```

### Actualización en el Componente Chat

**Por ahora (sin análisis real)**:
- El bot genera respuestas genéricas
- La respuesta sigue siendo JSON pero con valores por defecto
- `reliability_score` puede ser un valor genérico (ej: 50) o null

**En el futuro (con análisis real)**:
- El bot analiza el documento con GPT-4o VLM
- Calcula `reliability_score` basándose en el análisis
- Extrae datos estructurados del documento
- Retorna todo en formato JSON

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
  reliability_score: number | null; // 1-100, null si aún no ha sido analizado
  created_at: string;
}
```

### Función del Bot para Calcular Reliability Score

El bot "Mama" debe implementar una función que:
1. Analice el documento (imagen o PDF)
2. Identifique el tipo de documento
3. Evalúe la fuente y veracidad
4. Asigne un score de 1-100
5. Actualice la base de datos

```typescript
// Ejemplo de función que el bot debe implementar
async function calculateReliabilityScore(
  file: MedicalFile,
  analysisResult: DocumentAnalysis
): Promise<number> {
  let score = 50; // Base
  
  // Factores que aumentan el score
  if (analysisResult.hasOfficialSeal) score += 30;
  if (analysisResult.isFromRecognizedInstitution) score += 20;
  if (analysisResult.hasDoctorSignature) score += 15;
  if (analysisResult.isLaboratoryResult) score += 10;
  
  // Factores que disminuyen el score
  if (analysisResult.isCasualComment) score = 25;
  if (analysisResult.isUnverified) score = 15;
  
  // Asegurar que esté en el rango 1-100
  return Math.max(1, Math.min(100, score));
}
```

---

## 📚 Referencias

- Estructura existente: `supabase/migrations/20251129223357_*.sql`
- Tabla `patients`: Ya existe con UUID y relaciones
- Tabla `medical_files`: Ya existe para archivos adjuntos (tiene `patient_id`)
- RLS patterns: Seguir el mismo patrón de las tablas existentes

