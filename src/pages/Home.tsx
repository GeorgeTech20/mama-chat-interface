import { Bell, FolderOpen, MessageCircleHeart, LogOut } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import BottomNav from '@/components/BottomNav';
import HealthProfile from '@/components/HealthProfile';
import PatientSelector from '@/components/PatientSelector';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import mamaAvatar from '@/assets/mama-avatar.png';

const Home = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <MobileLayout>
      <div className="px-4 pt-6 pb-24 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <PatientSelector />
          <div className="flex items-center gap-2">
            <button className="p-2 bg-card border border-border rounded-full relative hover:bg-accent transition-colors">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <button 
              onClick={handleSignOut}
              className="p-2 bg-card border border-border rounded-full hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Greeting */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground leading-tight">
            ¿Cómo te sientes hoy?
          </h2>
        </div>

        {/* Health Profile */}
        <HealthProfile />

        {/* Mama Chat CTA - Más llamativo y centrado */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/chat')}
            className="w-full max-w-sm p-6 bg-gradient-to-br from-primary via-primary to-chart-2 rounded-3xl flex flex-col items-center gap-4 text-center shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="relative">
              <img 
                src={mamaAvatar} 
                alt="Mama" 
                className="w-20 h-20 rounded-full border-4 border-primary-foreground/30 shadow-lg" 
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center border-2 border-primary">
                <MessageCircleHeart className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary-foreground">Habla con Mama</h3>
              <p className="text-sm text-primary-foreground/80 mt-1">
                Tu asistente de salud personal
              </p>
            </div>
            <div className="px-6 py-2 bg-primary-foreground/20 rounded-full">
              <span className="text-sm font-semibold text-primary-foreground">
                💬 Cuéntame tus síntomas
              </span>
            </div>
          </button>
        </div>

        {/* Medical Library CTA */}
        <button
          onClick={() => navigate('/library')}
          className="w-full p-4 bg-card border border-border rounded-2xl flex items-center gap-4 text-left hover:bg-accent transition-colors"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Historia Clínica Digital</h3>
            <p className="text-sm text-muted-foreground">Centraliza tus documentos</p>
          </div>
        </button>
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default Home;
