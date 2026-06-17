import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sun } from 'lucide-react';

interface NewDayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  day: number;
}

export function NewDayDialog({ isOpen, onClose, day }: NewDayDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-stone-900 border-amber-700/50 text-stone-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-amber-500">
            <Sun className="h-6 w-6" />
            Um novo dia raiou!
          </DialogTitle>
          <DialogDescription className="text-stone-400 mt-2 text-lg">
            O sol surge no horizonte e estamos agora no <strong>DIA {day}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 text-stone-300">
          <p>
            Se o seu personagem teve um sono reparador ou o descanso necessário, lembre-se de abrir sua ficha de personagem e usar a funcionalidade de <strong>Descanso Longo</strong> ou <strong>Descanso Curto</strong> para recarregar suas habilidades diárias.
          </p>
        </div>

        <div className="flex justify-end mt-4">
          <Button 
            onClick={onClose} 
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
