import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, Message } from '@/types/health';
import { toast } from 'sonner';

const MESSAGES_PER_PAGE = 21;

/**
 * Hook para manejar mensajes del chat con paginación
 * Carga los últimos 21 mensajes inicialmente y permite cargar más al hacer scroll
 */
export const useChatMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Convertir ChatMessage a Message (para compatibilidad con componente actual)
  const convertToMessage = (chatMessage: ChatMessage): Message => {
    return {
      id: chatMessage.id,
      content: chatMessage.content,
      sender: chatMessage.sender,
      timestamp: new Date(chatMessage.sent_at),
      attachment_id: chatMessage.attachment_id || undefined,
      attachment_type: chatMessage.attachment_type || undefined,
    };
  };

  // Cargar mensajes iniciales (últimos 21)
  const loadInitialMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (fetchError) throw fetchError;

      if (!data) {
        setMessages([]);
        setHasMore(false);
        return;
      }

      // Convertir y revertir para mostrar más antiguos primero
      const convertedMessages = data.map(convertToMessage).reverse();
      setMessages(convertedMessages);
      setHasMore(data.length === MESSAGES_PER_PAGE);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      console.error('Error loading messages:', error);
      setError(error);
      toast.error('Error al cargar los mensajes');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Cargar más mensajes (paginación hacia arriba - mensajes más antiguos)
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !hasMore || loadingMore) return;

    try {
      setLoadingMore(true);

      // Obtener el mensaje más antiguo actual
      const oldestMessage = messages[0];
      if (!oldestMessage) {
        setHasMore(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .lt('sent_at', oldestMessage.timestamp.toISOString())
        .order('sent_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      // Convertir y agregar al inicio
      const convertedMessages = data.map(convertToMessage).reverse();
      setMessages((prev) => [...convertedMessages, ...prev]);
      setHasMore(data.length === MESSAGES_PER_PAGE);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      console.error('Error loading more messages:', error);
      toast.error('Error al cargar más mensajes');
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, messages, hasMore, loadingMore]);

  // Agregar nuevo mensaje (para mensajes en tiempo real)
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, convertToMessage(message)]);
  }, []);

  // Cargar mensajes iniciales cuando cambia la conversación
  useEffect(() => {
    loadInitialMessages();
  }, [loadInitialMessages]);

  // Suscripción a nuevos mensajes en tiempo real
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat_messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          // Solo agregar si no existe ya (evitar duplicados)
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, convertToMessage(newMessage)];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, addMessage]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMoreMessages,
    addMessage,
    refresh: loadInitialMessages,
  };
};


