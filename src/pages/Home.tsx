import { useState } from 'react';
import { Bell } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import BottomNav from '@/components/BottomNav';
import AppointmentCard from '@/components/AppointmentCard';
import DoctorCard from '@/components/DoctorCard';
import SpecialtyFilter from '@/components/SpecialtyFilter';
import HealthProfile from '@/components/HealthProfile';
import { doctors, appointments, specialties } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import mamaAvatar from '@/assets/mama-avatar.png';

const Home = () => {
  const [selectedSpecialty, setSelectedSpecialty] = useState('Todos');
  const navigate = useNavigate();

  const filteredDoctors = selectedSpecialty === 'Todos'
    ? doctors
    : doctors.filter(d => d.specialty === selectedSpecialty);

  return (
    <MobileLayout>
      <div className="px-4 pt-6 pb-24 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={mamaAvatar}
              alt="Usuario"
              className="w-12 h-12 rounded-full object-cover border-2 border-primary"
            />
            <div>
              <p className="text-sm text-muted-foreground">¡Buenos días!</p>
              <h1 className="font-semibold text-foreground">Usuario</h1>
            </div>
          </div>
          <button className="p-2 bg-card border border-border rounded-full relative hover:bg-accent transition-colors">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>
        </header>

        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold text-foreground leading-tight">
            ¿Cómo te sientes<br />hoy?
          </h2>
        </div>

        {/* Health Profile */}
        <HealthProfile />

        {/* Mama Chat CTA */}
        <button
          onClick={() => navigate('/chat')}
          className="w-full p-4 bg-gradient-to-r from-primary to-chart-2 rounded-2xl flex items-center gap-4 text-left hover:opacity-90 transition-opacity"
        >
          <img src={mamaAvatar} alt="Mama" className="w-14 h-14 rounded-full" />
          <div className="flex-1">
            <h3 className="font-semibold text-primary-foreground">Habla con Mama</h3>
            <p className="text-sm text-primary-foreground/80">Cuéntame tus síntomas</p>
          </div>
          <div className="px-3 py-1 bg-primary-foreground/20 rounded-full">
            <span className="text-xs font-medium text-primary-foreground">Chat</span>
          </div>
        </button>

        {/* Upcoming Appointments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Próximas Citas</h3>
            <button className="text-sm text-primary font-medium">Ver Todas</button>
          </div>
          {appointments.length > 0 ? (
            <AppointmentCard
              appointment={appointments[0]}
              onViewProfile={() => navigate(`/doctor/${appointments[0].doctor.id}`)}
            />
          ) : (
            <p className="text-muted-foreground text-center py-8">No tienes citas próximas</p>
          )}
        </section>

        {/* Popular Doctors */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Doctores Populares</h3>
            <button className="text-sm text-primary font-medium">Ver Todos</button>
          </div>
          
          <SpecialtyFilter
            specialties={specialties}
            selected={selectedSpecialty}
            onSelect={setSelectedSpecialty}
          />
          
          <div className="space-y-3 mt-4">
            {filteredDoctors.slice(0, 3).map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        </section>
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default Home;
