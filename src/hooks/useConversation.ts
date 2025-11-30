import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActivePatient } from './useActivePatient';
import { supabase } from '@/integrations/supabase/client';
import { Conversation } from '@/types/health';
import { toast } from 'sonner';

const WELCOME_MESSAGE = '¡Hola! Soy Mama, tu asistente de salud. 💜\n\nEstoy aquí para ayudarte. Cuéntame, ¿qué síntomas estás experimentando hoy?';

/**
 * Hook para obtener o crear la conversación activa del paciente
 * Si no existe conversación, la crea automáticamente con el mensaje de bienvenida
 */
export const useConversation = () => {
  const { user } = useAuth();
  const { activePatient } = useActivePatient();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const getOrCreateConversation = async () => {
      if (!user || !activePatient) {
        setConversation(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Intentar obtener conversación existente
        const { data: existing, error: fetchError } = await supabase
          .from('conversations')
          .select('*')
          .eq('patient_id', activePatient.id)
          .eq('user_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, que es esperado si no existe
          throw fetchError;
        }

        if (existing) {
          setConversation(existing);
          setLoading(false);
          return;
        }

        // Si no existe, crear nueva conversación
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            patient_id: activePatient.id,
            user_id: user.id,
            context: {},
            started_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) throw createError;

        if (!newConversation) {
          throw new Error('No se pudo crear la conversación');
        }

        // Crear mensaje de bienvenida automáticamente
        const { error: messageError } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: newConversation.id,
            content: WELCOME_MESSAGE,
            sender: 'mama',
            message_type: 'system',
            sent_at: new Date().toISOString(),
          });

        if (messageError) {
          console.error('Error creating welcome message:', messageError);
          // No lanzamos error aquí, la conversación ya está creada
        }

        setConversation(newConversation);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error desconocido');
        console.error('Error in useConversation:', error);
        setError(error);
        toast.error('Error al cargar la conversación');
      } finally {
        setLoading(false);
      }
    };

    getOrCreateConversation();
  }, [user?.id, activePatient?.id]);

  return { conversation, loading, error };
};


