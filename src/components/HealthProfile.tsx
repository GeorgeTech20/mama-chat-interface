import { useState } from 'react';
import { Heart, User, UserRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const HealthProfile = () => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);

  const calculateBMI = () => {
    const h = parseFloat(height) / 100; // cm to m
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return null;
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { text: 'Bajo peso', color: 'text-yellow-500' };
    if (bmi < 25) return { text: 'Normal', color: 'text-green-500' };
    if (bmi < 30) return { text: 'Sobrepeso', color: 'text-orange-500' };
    return { text: 'Obesidad', color: 'text-destructive' };
  };

  const bmi = calculateBMI();
  const bmiStatus = bmi ? getBMIStatus(parseFloat(bmi)) : null;

  return (
    <div className="bg-card rounded-3xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-destructive/10 rounded-full">
          <Heart className="w-5 h-5 text-destructive fill-destructive" />
        </div>
        <h3 className="font-semibold text-foreground">Tu Perfil de Salud</h3>
      </div>

      {/* Gender Selection */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">Género</p>
        <div className="flex gap-3">
          <button
            onClick={() => setGender('male')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all",
              gender === 'male'
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-foreground hover:bg-accent"
            )}
          >
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">Hombre</span>
          </button>
          <button
            onClick={() => setGender('female')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all",
              gender === 'female'
                ? "bg-pink-500 text-primary-foreground border-pink-500"
                : "bg-background border-border text-foreground hover:bg-accent"
            )}
          >
            <UserRound className="w-5 h-5" />
            <span className="text-sm font-medium">Mujer</span>
          </button>
        </div>
      </div>

      {/* Height & Weight */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Altura (cm)</p>
          <Input
            type="number"
            placeholder="170"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="bg-background border-border rounded-xl"
          />
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Peso (kg)</p>
          <Input
            type="number"
            placeholder="70"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="bg-background border-border rounded-xl"
          />
        </div>
      </div>

      {/* BMI Result */}
      {bmi && (
        <div className="bg-background rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Heart className="w-10 h-10 text-destructive fill-destructive animate-pulse" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary-foreground">
                {bmi}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tu IMC</p>
              <p className={cn("font-semibold", bmiStatus?.color)}>{bmiStatus?.text}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{bmi}</p>
            <p className="text-xs text-muted-foreground">kg/m²</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthProfile;
