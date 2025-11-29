import { Video, Calendar, Clock } from 'lucide-react';
import { Appointment } from '@/types/health';
import { Button } from '@/components/ui/button';

interface AppointmentCardProps {
  appointment: Appointment;
  onReschedule?: () => void;
  onViewProfile?: () => void;
}

const AppointmentCard = ({ appointment, onReschedule, onViewProfile }: AppointmentCardProps) => {
  return (
    <div className="bg-primary rounded-3xl p-4 text-primary-foreground">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={appointment.doctor.image}
            alt={appointment.doctor.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-primary-foreground/30"
          />
          <div>
            <h3 className="font-semibold text-primary-foreground">{appointment.doctor.name}</h3>
            <p className="text-sm text-primary-foreground/80">{appointment.doctor.specialty}</p>
          </div>
        </div>
        <button className="p-2 bg-primary-foreground/20 rounded-full hover:bg-primary-foreground/30 transition-colors">
          <Video className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex items-center gap-4 mb-4 text-sm text-primary-foreground/90">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{appointment.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{appointment.time}</span>
        </div>
      </div>
      
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={onReschedule}
          className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
        >
          Re-Agendar
        </Button>
        <Button
          variant="secondary"
          onClick={onViewProfile}
          className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          Ver Perfil
        </Button>
      </div>
    </div>
  );
};

export default AppointmentCard;
