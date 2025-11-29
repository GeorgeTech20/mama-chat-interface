import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Paperclip, Image, FileText, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Message } from '@/types/health';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import mamaAvatar from '@/assets/mama-avatar.png';

interface ConversationState {
  step: number;
  symptoms: string[];
  duration: string;
  severity: string;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    content: '¡Hola! Soy Mama, tu asistente de salud. 💜\n\nEstoy aquí para ayudarte. Cuéntame, ¿qué síntomas estás experimentando hoy?\n\nTambién puedes subir fotos o documentos médicos usando el botón 📎',
    sender: 'mama',
    timestamp: new Date(),
  },
];

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
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo no puede superar 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setShowAttachMenu(false);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('medical-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('medical-files')
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase.from('medical_files').insert({
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        user_id: null,
      });

      if (dbError) throw dbError;

      // Add to uploaded files preview
      const newFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        url: urlData.publicUrl,
      };
      setUploadedFiles(prev => [...prev, newFile]);

      toast({
        title: "Archivo subido",
        description: "El archivo se ha guardado en tu biblioteca médica",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error al subir",
        description: "No se pudo subir el archivo. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const generateResponse = (userMessage: string, hasFiles: boolean): string => {
    if (hasFiles) {
      return '¡Gracias por compartir tus documentos médicos! 📄\n\nLos he guardado en tu biblioteca médica para que puedas acceder a ellos cuando los necesites.\n\n¿Hay algo específico sobre estos documentos que te gustaría preguntarme?';
    }

    const lowerMessage = userMessage.toLowerCase();
    
    for (const symptom of symptomQuestions) {
      if (symptom.keywords.some(keyword => lowerMessage.includes(keyword))) {
        if (conversationContext.includes(symptom.keywords[0])) {
          return symptom.recommendation;
        } else {
          setConversationContext(prev => [...prev, symptom.keywords[0]]);
          return symptom.followUp;
        }
      }
    }

    if (lowerMessage.includes('gracias') || lowerMessage.includes('thank')) {
      return '¡De nada! Recuerda que estoy aquí para ayudarte. Si tienes más preguntas sobre tu salud, no dudes en consultarme. 💜\n\n¿Hay algo más en lo que pueda ayudarte?';
    }

    if (lowerMessage.includes('cita') || lowerMessage.includes('doctor') || lowerMessage.includes('médico')) {
      return '¡Claro! Puedo ayudarte a encontrar un especialista. En la sección de citas podrás ver los profesionales disponibles.\n\n¿Te gustaría que te recomiende alguno según tus síntomas?';
    }

    if (lowerMessage.includes('hola') || lowerMessage.includes('buenos') || lowerMessage.includes('buenas')) {
      return '¡Hola! ¿Cómo te encuentras hoy? Cuéntame si tienes algún síntoma o malestar que te preocupe. Estoy aquí para ayudarte. 💜';
    }

    if (lowerMessage.includes('archivo') || lowerMessage.includes('documento') || lowerMessage.includes('foto') || lowerMessage.includes('subir')) {
      return '¡Claro! Puedes subir fotos y documentos médicos usando el botón 📎 junto al campo de texto. Se guardarán en tu biblioteca médica para que puedas acceder a ellos cuando lo necesites.';
    }

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSend = () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return;

    const hasFiles = uploadedFiles.length > 0;
    const messageContent = inputValue.trim() || (hasFiles ? `📎 ${uploadedFiles.length} archivo(s) adjunto(s)` : '');

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setUploadedFiles([]);
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(currentInput, hasFiles);
      const mamaMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'mama',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, mamaMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <MobileLayout>
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-4 bg-gradient-to-r from-primary to-chart-2 text-primary-foreground">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-primary-foreground/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <img src={mamaAvatar} alt="Mama" className="w-12 h-12 rounded-full border-2 border-primary-foreground/30" />
          <div>
            <h1 className="font-bold text-lg">Mama</h1>
            <p className="text-xs text-primary-foreground/80">En línea • Tu asistente de salud</p>
          </div>
        </div>
      </header>

      {/* Quick Symptom Buttons */}
      <div className="px-4 py-3 bg-card/50 border-b border-border overflow-x-auto">
        <div className="flex gap-2">
          {['Dolor de cabeza', 'Fiebre', 'Tos', 'Cansancio', 'Estómago'].map((symptom) => (
            <button
              key={symptom}
              onClick={() => {
                setInputValue(`Tengo ${symptom.toLowerCase()}`);
              }}
              className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium whitespace-nowrap hover:bg-primary/20 transition-colors"
            >
              {symptom}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-40 space-y-4">
        {messages.map((message) => (
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
        ))}
        
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

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="relative flex-shrink-0">
                {file.type.startsWith('image/') ? (
                  <img src={file.url} alt={file.name} className="w-16 h-16 object-cover rounded-lg border border-border" />
                ) : (
                  <div className="w-16 h-16 bg-card border border-border rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                )}
                <button
                  onClick={() => removeUploadedFile(file.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attach Menu */}
      {showAttachMenu && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 hover:bg-accent rounded-xl transition-colors"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Image className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Foto</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 hover:bg-accent rounded-xl transition-colors"
              >
                <div className="w-12 h-12 bg-chart-2/10 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-chart-2" />
                </div>
                <span className="text-sm font-medium text-foreground">Documento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'image')}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'document')}
      />

      {/* Input */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md px-4 py-3 bg-background border-t border-border">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            disabled={isUploading}
            className={cn(
              "p-2 rounded-full transition-colors",
              showAttachMenu ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
            ) : (
              <Paperclip className="w-6 h-6" />
            )}
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
            disabled={!inputValue.trim() && uploadedFiles.length === 0}
            className="p-3 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default Chat;