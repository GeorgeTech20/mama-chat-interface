import { Heart, User, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock user data - this would come from registration/auth
const userData = {
  name: 'Usuario',
  lastName: 'Demo',
  dni: '12345678',
  height: 170, // cm
  weight: 70, // kg
  age: 28,
  gender: 'male' as 'male' | 'female',
};

const HealthProfile = () => {
  const { height, weight, gender } = userData;

  const calculateBMI = () => {
    const h = height / 100; // cm to m
    if (h > 0 && weight > 0) {
      return (weight / (h * h)).toFixed(1);
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-destructive/10 rounded-full">
            <Heart className="w-5 h-5 text-destructive fill-destructive" />
          </div>
          <h3 className="font-semibold text-foreground">Tu Perfil de Salud</h3>
        </div>
        
        {/* Gender Icon - Read Only */}
        <div className={cn(
          "p-2 rounded-full",
          gender === 'male' ? "bg-primary/10" : "bg-pink-500/10"
        )}>
          {gender === 'male' ? (
            <User className="w-5 h-5 text-primary" />
          ) : (
            <UserRound className="w-5 h-5 text-pink-500" />
          )}
        </div>
      </div>

      {/* Stats Grid - Read Only */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-background rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">{height}</p>
          <p className="text-xs text-muted-foreground">cm</p>
        </div>
        <div className="bg-background rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">{weight}</p>
          <p className="text-xs text-muted-foreground">kg</p>
        </div>
        <div className="bg-background rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">{userData.age}</p>
          <p className="text-xs text-muted-foreground">años</p>
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
