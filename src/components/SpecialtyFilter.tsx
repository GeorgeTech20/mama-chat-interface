import { cn } from '@/lib/utils';

interface SpecialtyFilterProps {
  specialties: string[];
  selected: string;
  onSelect: (specialty: string) => void;
}

const SpecialtyFilter = ({ specialties, selected, onSelect }: SpecialtyFilterProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {specialties.map((specialty) => (
        <button
          key={specialty}
          onClick={() => onSelect(specialty)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            selected === specialty
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground hover:bg-accent"
          )}
        >
          {specialty}
        </button>
      ))}
    </div>
  );
};

export default SpecialtyFilter;
