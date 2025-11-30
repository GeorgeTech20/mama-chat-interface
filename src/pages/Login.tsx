import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import loginBackground from '@/assets/login-background.png';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Check if profile exists
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', session.user.id)
            .single();
          
          if (profile && profile.name) {
            navigate('/');
          } else {
            navigate('/register', { state: { userId: session.user.id, email: session.user.email } });
          }
        }, 0);
      }
    });

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('profiles')
          .select('name')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile && profile.name) {
              navigate('/');
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/register`
        }
      });
      if (error) {
        toast.error('Error al iniciar sesión con Google: ' + error.message);
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/register`
        }
      });
      if (error) {
        toast.error('Error al iniciar sesión con Apple: ' + error.message);
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = () => {
    navigate('/auth');
  };

  return (
    <MobileLayout showNav={false}>
      <div className="min-h-screen flex flex-col relative">
        {/* Background - Full screen image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${loginBackground})` }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Skip button removed - now using protected routes */}

        {/* Hero Section - Center */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center relative z-10">
          <div className="w-16 h-16 flex items-center justify-center mb-6">
            <Heart className="w-12 h-12 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-semibold text-primary-foreground tracking-tight">
            Vida
          </h1>
        </div>

        {/* Bottom Login Section - Dark card */}
        <div className="relative z-10 bg-card rounded-t-3xl p-6 pb-8 space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 gap-3 bg-background hover:bg-muted border-border"
            onClick={handleAppleSignIn}
            disabled={isLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Continuar con Apple
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 gap-3 bg-background hover:bg-muted border-border"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </Button>

          <Button
            className="w-full h-12 bg-muted hover:bg-muted/80 text-muted-foreground"
            variant="secondary"
            onClick={handleEmailSignIn}
            disabled={isLoading}
          >
            Continuar con email
          </Button>

          <div className="flex justify-center gap-6 pt-4">
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Política de privacidad
            </button>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Términos de servicio
            </button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Login;
