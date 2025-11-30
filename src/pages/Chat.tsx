import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Message, BotResponse } from '@/types/health';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useActivePatient } from '@/hooks/useActivePatient';
import { useConversation } from '@/hooks/useConversation';
import { useChatMessages } from '@/hooks/useChatMessages';
import mamaAvatar from '@/assets/mama-avatar.png';

interface ConversationState {
  step: number;
  symptoms: string[];
  duration: string;
  severity: string;
}

// Mensaje inicial ya se crea automáticamente en useConversation

const symptomQuestions = [
  {
    keywords: ['dolor', 'cabeza', 'cefalea'],
    followUp: '¿Hace cuánto tiempo tienes este dolor de cabeza? ¿Es constante o intermitente?',
    recommendation: 'Para el dolor de cabeza te recomiendo:\n\n• Descansar en un lugar oscuro y silencioso\n• Tomar abundante agua\n• Aplicar compresas frías en la frente\n• Si persiste más de 24 horas, consulta con un médico\n\n¿Tienes algún otro síntoma?',
  },
  {
    keywords: ['fiebre', 'temperatura', 'caliente'],
    followUp: '¿Has medido tu temperatura? ¿Tienes otros síntomas como escalofríos o sudoración?',
    recommendation: 'Para la fiebre te recomiendo:\n\n• Mantente hidratado con agua y líquidos\n• Usa ropa ligera\n• Descansa lo suficiente\n• Si la fiebre supera 38.5°C o dura más de 3 días, consulta a un médico\n\n¿Hay algo más que te preocupe?',
  },
  {
    keywords: ['estómago', 'náuseas', 'vómito', 'diarrea', 'digestión'],
    followUp: '¿Desde cuándo tienes estas molestias estomacales? ¿Has comido algo diferente recientemente?',
    recommendation: 'Para las molestias estomacales te recomiendo:\n\n• Dieta blanda (arroz, pollo, plátano)\n• Evita alimentos grasos y picantes\n• Toma líquidos en pequeños sorbos\n• Si hay sangre o los síntomas persisten, busca atención médica\n\n¿Cómo te sientes ahora?',
  },
  {
    keywords: ['cansancio', 'fatiga', 'sueño', 'agotado'],
    followUp: '¿Cuántas horas estás durmiendo? ¿Este cansancio es reciente o llevas tiempo sintiéndote así?',
    recommendation: 'Para combatir el cansancio te recomiendo:\n\n• Dormir 7-8 horas diarias\n• Hacer ejercicio ligero regularmente\n• Alimentación balanceada\n• Reducir el estrés con técnicas de relajación\n\n¿Te gustaría agendar una cita con un especialista?',
  },
  {
    keywords: ['tos', 'gripe', 'resfriado', 'congestión', 'nariz'],
    followUp: '¿La tos es seca o con flema? ¿Tienes otros síntomas como congestión nasal?',
    recommendation: 'Para los síntomas de gripe te recomiendo:\n\n• Descanso absoluto\n• Líquidos calientes (té, sopas)\n• Miel con limón para la garganta\n• Vapor de agua para la congestión\n• Si hay dificultad para respirar, consulta inmediatamente\n\n¿Necesitas más ayuda?',
  },
];

const defaultResponses = [
  'Entiendo. ¿Podrías darme más detalles sobre cómo te sientes? Por ejemplo, ¿dónde sientes las molestias?',
  'Gracias por compartir eso conmigo. ¿Hace cuánto tiempo comenzaste a sentirte así?',
  'Es importante que me cuentes más. ¿El malestar es constante o aparece en ciertos momentos?',
  '¿Hay algo que haga que te sientas mejor o peor? Cuéntame más para poder ayudarte mejor.',
];

const Chat = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { activePatient } = useActivePatient();
  const { conversation, loading: conversationLoading } = useConversation();
  const { messages, loading: messagesLoading, loadingMore, loadMoreMessages, hasMore } = useChatMessages(conversation?.id || null);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll automático solo cuando se agregan nuevos mensajes (no al cargar más)
  useEffect(() => {
    // Solo hacer scroll si estamos cerca del final
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      if (isNearBottom) {
        scrollToBottom();
      }
    }
  }, [messages.length]); // Solo cuando cambia la cantidad de mensajes

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Por ahora solo se aceptan imágenes
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Por ahora solo se permiten imágenes (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El tamaño máximo es 10MB');
      return;
    }

    setAttachedFile(file);
  };

  const uploadFile = async (file: File, description?: string): Promise<string | null> => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('medical-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Generate a description from user context if provided
      const fileDescription = description?.trim() 
        ? description.trim()
        : `Archivo subido: ${file.name}`;

      const { data: fileData, error: dbError } = await supabase
        .from('medical_files')
        .insert({
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          description: fileDescription,
          user_id: user?.id || null,
          patient_id: activePatient?.id || profile?.patient_active || null,
          reliability_score: null, // Se actualizará después del análisis del bot
        })
        .select('id')
        .single();

      if (dbError) throw dbError;

      toast.success('Archivo guardado en tu historia clínica');
      return fileData?.id || null;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir el archivo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const generateBotResponse = (userMessage: string, fileId?: string | null): BotResponse => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for symptom keywords
    for (const symptom of symptomQuestions) {
      if (symptom.keywords.some(keyword => lowerMessage.includes(keyword))) {
        // Check if we've already asked follow-up for this symptom
        if (conversationContext.includes(symptom.keywords[0])) {
          return {
            message: symptom.recommendation,
            context_update: {
              symptoms: [...conversationContext, symptom.keywords[0]],
            },
          };
        } else {
          setConversationContext(prev => [...prev, symptom.keywords[0]]);
          return {
            message: symptom.followUp,
            context_update: {
              symptoms: [...conversationContext, symptom.keywords[0]],
            },
          };
        }
      }
    }

    // Check for general responses
    if (lowerMessage.includes('gracias') || lowerMessage.includes('thank')) {
      return {
        message: '¡De nada! Recuerda que estoy aquí para ayudarte. Si tienes más preguntas sobre tu salud, no dudes en consultarme. 💜\n\n¿Hay algo más en lo que pueda ayudarte?',
      };
    }

    if (lowerMessage.includes('cita') || lowerMessage.includes('doctor') || lowerMessage.includes('médico')) {
      return {
        message: '¡Claro! Puedo ayudarte a encontrar un especialista. En la sección de "Doctores Populares" encontrarás varios profesionales disponibles.\n\n¿Te gustaría que te recomiende alguno en particular según tus síntomas?',
      };
    }

    if (lowerMessage.includes('hola') || lowerMessage.includes('buenos') || lowerMessage.includes('buenas')) {
      return {
        message: '¡Hola! ¿Cómo te encuentras hoy? Cuéntame si tienes algún síntoma o malestar que te preocupe. Estoy aquí para ayudarte. 💜',
      };
    }

    // Si hay archivo adjunto, generar respuesta con análisis (por ahora genérico)
    if (fileId) {
      return {
        message: '¡Perfecto! He recibido tu archivo. Lo he guardado en tu Historia Clínica Digital. 📁\n\nPor ahora estoy procesando la información. Pronto podré analizar documentos médicos de manera más detallada.\n\n¿Hay algo más en lo que pueda ayudarte?',
        analysis: {
          file_id: fileId,
          reliability_score: 50, // Valor genérico por ahora
          document_type: 'other',
        },
      };
    }

    // Default response - ask more questions
    return {
      message: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
    };
  };

  const processBotResponse = async (responseJson: BotResponse, conversationId: string) => {
    try {
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
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          content: responseJson.message,
          sender: 'mama',
          message_type: responseJson.analysis ? 'file' : 'text',
          attachment_id: responseJson.analysis?.file_id || null,
          sent_at: new Date().toISOString(),
        });

      if (messageError) throw messageError;

      // 3. Actualizar contexto de la conversación si existe
      if (responseJson.context_update && conversation) {
        const updatedContext = {
          ...(conversation.context || {}),
          ...responseJson.context_update,
        };

        await supabase
          .from('conversations')
          .update({ context: updatedContext })
          .eq('id', conversationId);
      }
    } catch (error) {
      console.error('Error processing bot response:', error);
      toast.error('Error al procesar la respuesta del bot');
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() && !attachedFile) return;
    if (!conversation) {
      toast.error('No se pudo cargar la conversación');
      return;
    }

    const currentInput = inputValue.trim();
    let uploadedFileId: string | null = null;

    // Handle file upload if attached
    if (attachedFile) {
      const userContext = currentInput || undefined;
      uploadedFileId = await uploadFile(attachedFile, userContext);
      
      if (!uploadedFileId) {
        return; // Error ya fue manejado en uploadFile
      }

      // Guardar mensaje del usuario con archivo
      if (currentInput) {
        const { error: textMessageError } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversation.id,
            content: currentInput,
            sender: 'user',
            message_type: 'text',
            sent_at: new Date().toISOString(),
          });

        if (textMessageError) {
          console.error('Error saving user text message:', textMessageError);
        }
      }

      // Guardar mensaje del usuario con archivo adjunto
      const { error: fileMessageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          content: `📎 Archivo adjunto: ${attachedFile.name}`,
          sender: 'user',
          message_type: 'file',
          attachment_id: uploadedFileId,
          attachment_type: 'image',
          sent_at: new Date().toISOString(),
        });

      if (fileMessageError) {
        console.error('Error saving file message:', fileMessageError);
        toast.error('Error al guardar el mensaje');
        return;
      }

      setAttachedFile(null);
      setInputValue('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Generar respuesta del bot
      setIsTyping(true);
      setTimeout(async () => {
        const botResponse = generateBotResponse(currentInput || 'Archivo adjunto', uploadedFileId);
        await processBotResponse(botResponse, conversation.id);
        setIsTyping(false);
      }, 1000);
      return;
    }

    // Guardar mensaje del usuario (solo texto)
    const { error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversation.id,
        content: currentInput,
        sender: 'user',
        message_type: 'text',
        sent_at: new Date().toISOString(),
      });

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
      toast.error('Error al guardar el mensaje');
      return;
    }

    setInputValue('');
    setIsTyping(true);

    // Generar y guardar respuesta del bot
    setTimeout(async () => {
      const botResponse = generateBotResponse(currentInput);
      await processBotResponse(botResponse, conversation.id);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <MobileLayout>
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-4 bg-card border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-accent rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-3">
          <img src={mamaAvatar} alt="Mama" className="w-10 h-10 rounded-full" />
          <div>
            <h1 className="font-semibold text-foreground">Mama</h1>
            <p className="text-xs text-green-500">En línea • Asistente de salud</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 pb-36 space-y-4"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          // Cargar más mensajes cuando se hace scroll hacia arriba (primeros 100px)
          if (target.scrollTop < 100 && hasMore && !loadingMore && !messagesLoading) {
            loadMoreMessages();
          }
        }}
      >
        {(conversationLoading || messagesLoading) && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Cargando conversación...</div>
          </div>
        ) : (
          messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-2",
              message.sender === 'user' ? "justify-end" : "justify-start"
            )}
          >
            {message.sender === 'mama' && (
              <img src={mamaAvatar} alt="Mama" className="w-8 h-8 rounded-full self-end" />
            )}
            <div
              className={cn(
                "max-w-[75%] px-4 py-3 rounded-2xl",
                message.sender === 'user'
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border text-foreground rounded-bl-sm"
              )}
            >
              <p className="text-sm whitespace-pre-line">{message.content}</p>
              <p
                className={cn(
                  "text-xs mt-1",
                  message.sender === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))
        )}
        
        {isTyping && (
          <div className="flex gap-2 justify-start">
            <img src={mamaAvatar} alt="Mama" className="w-8 h-8 rounded-full self-end" />
            <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md px-4 py-3 bg-background border-t border-border">
        {/* Attached file preview */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-primary/10 rounded-lg">
            {attachedFile.type.includes('pdf') ? (
              <FileText className="w-5 h-5 text-primary" />
            ) : (
              <ImageIcon className="w-5 h-5 text-primary" />
            )}
            <span className="text-sm text-foreground truncate flex-1">{attachedFile.name}</span>
            <button
              onClick={() => {
                setAttachedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 hover:bg-primary/20 rounded-full"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Paperclip className="w-6 h-6" />
          </button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe tus síntomas..."
            className="flex-1 bg-card border-border rounded-full py-5"
          />
          <button
            onClick={handleSend}
            disabled={(!inputValue.trim() && !attachedFile) || isUploading}
            className="p-3 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default Chat;
