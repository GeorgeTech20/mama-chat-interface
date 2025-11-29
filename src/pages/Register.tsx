import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

// Scroll Picker Component
interface ScrollPickerProps {
  values: (string | number)[];
  selected: string | number;
  onChange: (value: string | number) => void;
  suffix?: string;
}

const ScrollPicker = ({ values, selected, onChange, suffix = '' }: ScrollPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 48;
  const visibleItems = 7;

  useEffect(() => {
    const selectedIndex = values.indexOf(selected);
    if (containerRef.current && selectedIndex !== -1) {
      const scrollPosition = selectedIndex * itemHeight - (visibleItems / 2 - 0.5) * itemHeight;
      containerRef.current.scrollTop = scrollPosition;
    }
  }, [selected, values]);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const centerIndex = Math.round((scrollTop + (visibleItems / 2 - 0.5) * itemHeight) / itemHeight);
      const clampedIndex = Math.max(0, Math.min(values.length - 1, centerIndex));
      if (values[clampedIndex] !== selected) {
        onChange(values[clampedIndex]);
      }
    }
  };

  return (
    <div className="relative h-[336px] overflow-hidden">
      {/* Selection indicator */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-12 border-t border-b border-border pointer-events-none z-10" />
      
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {/* Padding for centering */}
        <div style={{ height: `${(visibleItems / 2 - 0.5) * itemHeight}px` }} />
        
        {values.map((value, index) => {
          const isSelected = value === selected;
          const distance = Math.abs(values.indexOf(selected) - index);
          
          return (
            <div
              key={value}
              className="h-12 flex items-center justify-center snap-center cursor-pointer transition-all duration-200"
              style={{
                opacity: isSelected ? 1 : Math.max(0.2, 1 - distance * 0.2),
                transform: `scale(${isSelected ? 1.2 : Math.max(0.8, 1 - distance * 0.1)})`,
              }}
              onClick={() => onChange(value)}
            >
              <span className={`text-2xl ${isSelected ? 'font-bold text-foreground' : 'font-normal text-muted-foreground'}`}>
                {value}{suffix}
              </span>
            </div>
          );
        })}
        
        {/* Padding for centering */}
        <div style={{ height: `${(visibleItems / 2 - 0.5) * itemHeight}px` }} />
      </div>
    </div>
  );
};

// Gender Icons
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
  
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    dni: '',
    age: 25,
    height: 170,
    weight: 70,
    gender: '',
    email: emailFromLogin
  });

  const totalSteps = 6;
  
  // Generate value ranges
  const ages = Array.from({ length: 83 }, (_, i) => i + 18); // 18-100
  const heights = Array.from({ length: 81 }, (_, i) => i + 140); // 140-220 cm
  const weights = Array.from({ length: 121 }, (_, i) => i + 30); // 30-150 kg

  const handleNext = () => {
    if (step < totalSteps) {
      setDirection('next');
      setStep(step + 1);
    } else {
      // Submit form
      console.log('Registro completo:', formData);
      navigate('/');
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setDirection('prev');
      setStep(step - 1);
    } else {
      navigate('/login');
    }
  };

  const handleClose = () => {
    navigate('/login');
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.name.trim() !== '' && formData.surname.trim() !== '';
      case 2: return formData.dni.trim() !== '';
      case 3: return formData.age > 0;
      case 4: return formData.height > 0;
      case 5: return formData.weight > 0;
      case 6: return formData.gender !== '';
      default: return false;
    }
  };

  const getStepContent = () => {
    const animationClass = direction === 'next' 
      ? 'animate-fade-in' 
      : 'animate-fade-in';

    switch (step) {
      case 1:
        return (
          <div key="step1" className={`space-y-6 ${animationClass}`}>
            <h2 className="text-2xl font-semibold text-center text-foreground">
              ¿Cómo te llamas?
            </h2>
            <div className="space-y-4 pt-8">
              <Input
                placeholder="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-14 text-lg text-center bg-muted/50 border-0"
              />
              <Input
                placeholder="Apellido"
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                className="h-14 text-lg text-center bg-muted/50 border-0"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div key="step2" className={`space-y-6 ${animationClass}`}>
            <h2 className="text-2xl font-semibold text-center text-foreground">
              ¿Cuál es tu DNI?
            </h2>
            <div className="pt-8">
              <Input
                placeholder="12345678"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className="h-14 text-lg text-center bg-muted/50 border-0"
                maxLength={8}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div key="step3" className={`space-y-6 ${animationClass}`}>
            <h2 className="text-2xl font-semibold text-center text-foreground">
              ¿Cuántos años tienes?
            </h2>
            <ScrollPicker
              values={ages}
              selected={formData.age}
              onChange={(value) => setFormData({ ...formData, age: Number(value) })}
            />
          </div>
        );

      case 4:
        return (
          <div key="step4" className={`space-y-6 ${animationClass}`}>
            <h2 className="text-2xl font-semibold text-center text-foreground">
              ¿Cuál es tu altura?
            </h2>
            <ScrollPicker
              values={heights}
              selected={formData.height}
              onChange={(value) => setFormData({ ...formData, height: Number(value) })}
              suffix=" cm"
            />
          </div>
        );

      case 5:
        return (
          <div key="step5" className={`space-y-6 ${animationClass}`}>
            <h2 className="text-2xl font-semibold text-center text-foreground">
              ¿Cuál es tu peso?
            </h2>
            <ScrollPicker
              values={weights}
              selected={formData.weight}
              onChange={(value) => setFormData({ ...formData, weight: Number(value) })}
              suffix=" kg"
            />
          </div>
        );

      case 6:
        return (
          <div key="step6" className={`space-y-6 ${animationClass}`}>
            <h2 className="text-2xl font-semibold text-center text-foreground">
              ¿Cuál es tu género?
            </h2>
            <div className="flex justify-center gap-8 pt-12">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'male' })}
                className={`flex flex-col items-center gap-3 p-8 rounded-2xl border-2 transition-all duration-300 ${
                  formData.gender === 'male'
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <MaleIcon className={`w-16 h-16 ${formData.gender === 'male' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-lg font-medium ${formData.gender === 'male' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Hombre
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'female' })}
                className={`flex flex-col items-center gap-3 p-8 rounded-2xl border-2 transition-all duration-300 ${
                  formData.gender === 'female'
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <FemaleIcon className={`w-16 h-16 ${formData.gender === 'female' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-lg font-medium ${formData.gender === 'female' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Mujer
                </span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MobileLayout showNav={false}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          {/* Progress dots */}
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i < step ? 'w-6 bg-primary' : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-8">
          {getStepContent()}
        </div>

        {/* Bottom buttons */}
        <div className="p-6 space-y-3">
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full h-12"
          >
            {step === totalSteps ? 'Completar' : 'Siguiente'}
          </Button>
          <button
            onClick={handlePrev}
            className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            {step === 1 ? 'Cancelar' : 'Anterior'}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Register;
