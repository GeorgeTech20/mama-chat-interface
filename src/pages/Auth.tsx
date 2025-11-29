import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (!isLogin && password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email o contraseña incorrectos');
          } else {
            toast.error('Error al iniciar sesión: ' + error.message);
          }
          return;
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', data.user.id)
            .single();

          if (profile && profile.name) {
            toast.success('¡Bienvenido de nuevo!');
            navigate('/');
          } else {
            navigate('/register', { state: { userId: data.user.id, email: data.user.email } });
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/register`
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Este email ya está registrado. Intenta iniciar sesión.');
          } else {
            toast.error('Error al registrar: ' + error.message);
          }
          return;
        }

        if (data.user) {
          toast.success('¡Cuenta creada! Completa tu perfil.');
          navigate('/register', { state: { userId: data.user.id, email: data.user.email } });
        }
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout showNav={false}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center p-4">
          <button
            onClick={() => navigate('/login')}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-8">
          <h1 className="text-2xl font-semibold text-center text-foreground mb-2">
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            {isLogin ? 'Ingresa tus credenciales' : 'Crea tu cuenta con email'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-muted/50 border-0"
              />
              {errors.email && (
                <p className="text-destructive text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-muted/50 border-0 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {errors.password && (
                <p className="text-destructive text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {!isLogin && (
              <div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 bg-muted/50 border-0"
                />
                {errors.confirmPassword && (
                  <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12"
              disabled={isLoading}
            >
              {isLoading ? 'Cargando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-primary hover:underline text-sm"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Auth;
