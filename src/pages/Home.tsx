import { Bell, MessageCircleHeart } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import BottomNav from '@/components/BottomNav';
import HealthProfile from '@/components/HealthProfile';
import { useNavigate } from 'react-router-dom';
import mamaAvatar from '@/assets/mama-avatar.png';

const Home = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <div className="px-4 pt-6 pb-24 flex flex-col min-h-[calc(100vh-6rem)]">
        {/* Header */}
        <header className="w-full flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img 
              src={mamaAvatar} 
              alt="Mama" 
              className="w-10 h-10 rounded-full" 
            />
            <p className="text-sm text-muted-foreground">¡Bienvenido!</p>
          </div>
          <button className="p-2 bg-card border border-border rounded-full relative hover:bg-accent transition-colors">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>
        </header>

        {/* Health Profile */}
        <div className="mb-6">
          <HealthProfile />
        </div>

        {/* Greeting */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground leading-tight">
            ¿Cómo te sientes hoy?
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Cuéntale a Mama tus síntomas</p>
        </div>

        {/* Mama Chat CTA - Centrado y prominente */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={() => navigate('/chat')}
            className="w-full max-w-sm p-6 bg-gradient-to-br from-primary via-primary to-chart-2 rounded-3xl flex flex-col items-center gap-4 text-center shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="relative">
              <img 
                src={mamaAvatar} 
                alt="Mama" 
                className="w-24 h-24 rounded-full border-4 border-primary-foreground/30 shadow-lg" 
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center border-2 border-primary animate-pulse">
                <MessageCircleHeart className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary-foreground">Habla con Mama</h3>
              <p className="text-xs text-primary-foreground/80 mt-1">
                Tu asistente de salud personal
              </p>
            </div>
            <div className="px-5 py-2 bg-primary-foreground/20 rounded-full">
              <span className="text-sm font-semibold text-primary-foreground">
                💬 Cuéntame tus síntomas
              </span>
            </div>
          </button>
        </div>

        {/* Tip text */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Puedes subir fotos y documentos médicos directamente en el chat
        </p>
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default Home;
