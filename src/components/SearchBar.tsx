import { Search, Mic } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const SearchBar = ({ placeholder = "Buscar doctor, medicina...", value, onChange }: SearchBarProps) => {
  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="pl-10 pr-4 py-6 bg-card border-border rounded-2xl text-foreground placeholder:text-muted-foreground"
        />
      </div>
      <button className="p-3 bg-card border border-border rounded-2xl text-muted-foreground hover:text-foreground transition-colors">
        <Mic className="w-5 h-5" />
      </button>
    </div>
  );
};

export default SearchBar;
