import { Bell, MessageCircleHeart } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import BottomNav from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import mamaAvatar from '@/assets/mama-avatar.png';

const Home = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <div className="px-4 pt-6 pb-24 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)]">
        {/* Header */}
        <header className="w-full flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm text-muted-foreground">¡Bienvenido!</p>
              <h1 className="font-semibold text-foreground">Tu asistente de salud</h1>
            </div>
          </div>
          <button className="p-2 bg-card border border-border rounded-full relative hover:bg-accent transition-colors">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>
        </header>

        {/* Greeting */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground leading-tight">
            ¿Cómo te sientes hoy?
          </h2>
          <p className="text-muted-foreground mt-2">Cuéntale a Mama tus síntomas</p>
        </div>

        {/* Mama Chat CTA - Centrado y prominente */}
        <button
          onClick={() => navigate('/chat')}
          className="w-full max-w-sm p-8 bg-gradient-to-br from-primary via-primary to-chart-2 rounded-3xl flex flex-col items-center gap-5 text-center shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="relative">
            <img 
              src={mamaAvatar} 
              alt="Mama" 
              className="w-28 h-28 rounded-full border-4 border-primary-foreground/30 shadow-lg" 
            />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-400 rounded-full flex items-center justify-center border-2 border-primary animate-pulse">
              <MessageCircleHeart className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-primary-foreground">Habla con Mama</h3>
            <p className="text-sm text-primary-foreground/80 mt-2">
              Tu asistente de salud personal
            </p>
          </div>
          <div className="px-6 py-3 bg-primary-foreground/20 rounded-full">
            <span className="text-sm font-semibold text-primary-foreground">
              💬 Cuéntame tus síntomas
            </span>
          </div>
        </button>

        {/* Tip text */}
        <p className="text-xs text-muted-foreground text-center mt-6 max-w-xs">
          Puedes subir fotos y documentos médicos directamente en el chat
        </p>
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default Home;