-- Crear tabla chat_messages
-- Almacena cada mensaje individual de la conversación

CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
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
  is_read boolean DEFAULT false,
  
  -- Timestamps
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);

-- Habilitar RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chat_messages
CREATE POLICY "Users can view messages from their conversations"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = chat_messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages to their conversations"
ON public.chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = chat_messages.conversation_id
    AND conversations.user_id = auth.uid()
  )
);

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

-- Índice compuesto para paginación eficiente
CREATE INDEX idx_chat_messages_conversation_id_sent_at 
ON public.chat_messages(conversation_id, sent_at DESC);

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


