import { useState, useEffect } from 'react';
import { ChevronDown, User, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import mamaAvatar from '@/assets/mama-avatar.png';

interface Patient {
  id: string;
  dni: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  height: number | null;
  weight: number | null;
  gender: string | null;
}

const PatientSelector = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPatients();
    }
  }, [user?.id]);

  const fetchPatients = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, dni, first_name, last_name, birth_date, height, weight, gender')
        .or(`user_owner.eq.${user.id},user_creator.eq.${user.id}`);

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleSelectPatient = async (patientId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ patient_active: patientId })
        .eq('user_id', user?.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Paciente cambiado');
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating active patient:', error);
      toast.error('Error al cambiar paciente');
    } finally {
      setLoading(false);
    }
  };

  const activePatient = patients.find(p => p.id === profile?.patient_active);
  const displayName = activePatient 
    ? `${activePatient.first_name} ${activePatient.last_name}`
    : profile?.name || 'Usuario';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días!';
    if (hour < 18) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative">
            <img
              src={mamaAvatar}
              alt="Usuario"
              className="w-12 h-12 rounded-full object-cover border-2 border-primary"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-card border-2 border-border rounded-full flex items-center justify-center">
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground">{getGreeting()}</p>
            <h1 className="font-semibold text-foreground">{displayName}</h1>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-2 py-1">Seleccionar paciente</p>
          {patients.map((patient) => {
            const isActive = patient.id === profile?.patient_active;
            const isMain = patient.id === profile?.patient_main;
            
            return (
              <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient.id)}
                disabled={loading}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'hover:bg-accent'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <User className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {patient.first_name} {patient.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isMain ? 'Paciente principal' : 'Familiar'}
                  </p>
                </div>
                {isActive && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PatientSelector;
