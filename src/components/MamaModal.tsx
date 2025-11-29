import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import mamaAvatar from '@/assets/mama-avatar.png';
import { SmilePlus, Frown } from 'lucide-react';

interface MamaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MamaModal = ({ open, onOpenChange }: MamaModalProps) => {
  const navigate = useNavigate();

  const handleOption = (feeling: 'good' | 'bad') => {
    onOpenChange(false);
    navigate('/chat', { state: { initialFeeling: feeling } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-3xl border-none bg-card p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Avatar */}
          <img 
            src={mamaAvatar} 
            alt="Mama" 
            className="w-24 h-24 rounded-full shadow-md" 
          />
          
          {/* Title */}
          <DialogTitle className="text-xl font-semibold text-foreground">
            ¿Cómo te sientes hoy?
          </DialogTitle>

          {/* Options */}
          <div className="flex gap-4 w-full">
            <button
              onClick={() => handleOption('good')}
              className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl bg-green-500/10 hover:bg-green-500/20 transition-colors border border-green-500/20"
            >
              <SmilePlus className="w-8 h-8 text-green-500" />
              <span className="text-sm font-medium text-foreground">Bien</span>
            </button>
            <button
              onClick={() => handleOption('bad')}
              className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl bg-orange-500/10 hover:bg-orange-500/20 transition-colors border border-orange-500/20"
            >
              <Frown className="w-8 h-8 text-orange-500" />
              <span className="text-sm font-medium text-foreground">No muy bien</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MamaModal;
