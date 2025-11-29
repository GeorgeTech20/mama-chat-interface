import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft } from 'lucide-react';

// Minimal gender icons as SVG
const MaleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="10" cy="14" r="5"/>
    <path d="M19 5l-5.4 5.4"/>
    <path d="M15 5h4v4"/>
  </svg>
);

const FemaleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="8" r="5"/>
    <path d="M12 13v8"/>
    <path d="M9 18h6"/>
  </svg>
);

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromLogin = location.state?.email || '';

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    dni: '',
    height: '',
    weight: '',
    age: '',
    gender: '',
    email: emailFromLogin
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Datos de registro:', formData);
    navigate('/');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <MobileLayout showNav={false}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-primary p-4 flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="text-primary-foreground hover:bg-primary-foreground/10 p-2 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-primary-foreground">Crear Cuenta</h1>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground text-sm uppercase tracking-wide">Completa tus datos</p>
          </div>

          {formData.email && (
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground">Conectado como:</p>
              <p className="text-sm font-medium text-foreground">{formData.email}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Tu nombre"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="bg-muted/50 border-0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Apellido</Label>
                <Input
                  id="surname"
                  placeholder="Tu apellido"
                  value={formData.surname}
                  onChange={(e) => handleInputChange('surname', e.target.value)}
                  className="bg-muted/50 border-0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dni">DNI</Label>
              <Input
                id="dni"
                placeholder="12345678"
                value={formData.dni}
                onChange={(e) => handleInputChange('dni', e.target.value)}
                className="bg-muted/50 border-0"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="170"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="bg-muted/50 border-0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="70"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="bg-muted/50 border-0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Edad</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="bg-muted/50 border-0"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Género</Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
                className="flex justify-center gap-8"
              >
                <div className="flex flex-col items-center gap-2">
                  <label
                    htmlFor="male"
                    className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.gender === 'male'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <MaleIcon className={`w-10 h-10 ${formData.gender === 'male' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">Hombre</span>
                    <RadioGroupItem value="male" id="male" className="sr-only" />
                  </label>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <label
                    htmlFor="female"
                    className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.gender === 'female'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <FemaleIcon className={`w-10 h-10 ${formData.gender === 'female' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">Mujer</span>
                    <RadioGroupItem value="female" id="female" className="sr-only" />
                  </label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full h-12 mt-6">
              Registrarme
            </Button>
          </form>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Register;
