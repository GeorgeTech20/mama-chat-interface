import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Message } from '@/types/health';
import { cn } from '@/lib/utils';
import mamaAvatar from '@/assets/mama-avatar.png';

const initialMessages: Message[] = [
  {
    id: '1',
    content: '¡Hola! Soy Mama, tu asistente de salud. ¿En qué puedo ayudarte hoy?',
    sender: 'mama',
    timestamp: new Date(),
  },
];

const mamaResponses = [
  "Entiendo cómo te sientes. ¿Podrías contarme más sobre tus síntomas?",
  "Es importante cuidar tu salud. Te recomiendo consultar con un especialista si los síntomas persisten.",
  "Recuerda mantener una buena hidratación y descanso. ¿Hay algo más en lo que pueda ayudarte?",
  "Puedo ayudarte a encontrar un doctor especializado. ¿Qué tipo de consulta necesitas?",
  "Tu bienestar es mi prioridad. ¿Has considerado agendar una cita con uno de nuestros doctores?",
];

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate Mama response
    setTimeout(() => {
      const randomResponse = mamaResponses[Math.floor(Math.random() * mamaResponses.length)];
      const mamaMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
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
            <p className="text-xs text-green-500">En línea</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-36 space-y-4">
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
              <p className="text-sm">{message.content}</p>
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

      {/* Input */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md px-4 py-3 bg-background border-t border-border">
        <div className="flex items-center gap-2">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Smile className="w-6 h-6" />
          </button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-card border-border rounded-full py-5"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
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
