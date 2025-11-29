import { Star } from 'lucide-react';
import { Doctor } from '@/types/health';
import { useNavigate } from 'react-router-dom';

interface DoctorCardProps {
  doctor: Doctor;
}

const DoctorCard = ({ doctor }: DoctorCardProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/doctor/${doctor.id}`)}
      className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border w-full text-left hover:shadow-md transition-shadow"
    >
      <img
        src={doctor.image}
        alt={doctor.name}
        className="w-14 h-14 rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{doctor.name}</h3>
        <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
        <div className="flex items-center gap-1 mt-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium text-foreground">{doctor.rating}</span>
          <span className="text-sm text-muted-foreground">• {doctor.reviews} Reviews</span>
        </div>
      </div>
    </button>
  );
};

export default DoctorCard;
