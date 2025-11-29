import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Patient {
  id: string;
  dni: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  height: number | null;
  weight: number | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
}

export const useActivePatient = () => {
  const { user, profile } = useAuth();
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivePatient = async () => {
      if (!profile?.patient_active) {
        setActivePatient(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', profile.patient_active)
          .single();

        if (error) throw error;
        setActivePatient(data);
      } catch (error) {
        console.error('Error fetching active patient:', error);
        setActivePatient(null);
      } finally {
        setLoading(false);
      }
    };

    fetchActivePatient();
  }, [profile?.patient_active]);

  return { activePatient, loading };
};
