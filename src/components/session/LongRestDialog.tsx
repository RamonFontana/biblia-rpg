import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { checkFortitudeDie } from '@/domain/faith';
import { rollDie } from '@/domain/dice';
import { systemRng } from '@/lib/systemRng';

interface LongRestDialogProps {
  isOpen: boolean;
  /** Há Sacerdote ou Sábio entre os jogadores: o ensinamento dá +2 à Fé recuperada. */
  hasPriest: boolean;
  /** Recebe o d4 (1 a 4); quem chama aplica o Descanso Longo. */
  onConfirm: (die: number) => Promise<void>;
  onClose: () => void;
}

/**
 * O 1d4 de Fé do Descanso Longo: o Mestre digita o dado físico ou usa a Rolagem Virtual
 * (ADR 0001). O dado só vale quando o Mestre confirma.
 */
export function LongRestDialog({ isOpen, hasPriest, onConfirm, onClose }: LongRestDialogProps) {
  const [die, setDie] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleConfirm = async () => {
    const problem = checkFortitudeDie(die);
    if (problem === 'empty') {
      setError('Insira o resultado do d4 (1-4).');
      return;
    }
    if (problem === 'range') {
      setError('O valor do d4 deve estar entre 1 e 4.');
      return;
    }
    setError(null);
    setIsApplying(true);
    try {
      await onConfirm(Number(die));
      setDie('');
      onClose();
    } catch {
      setError('Não foi possível realizar o Descanso Longo. Tente de novo.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-stone-900 border-amber-700/50 text-stone-200">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-amber-500">Descanso Longo</DialogTitle>
          <DialogDescription className="text-stone-400">
            O grupo recupera 1d4 de Fé
            {hasPriest ? ', mais 2 pelo ensinamento do Sacerdote ou Sábio' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-3">
          <label className="flex-1 text-sm text-stone-400">
            Resultado do d4
            <input
              type="number"
              min={1}
              max={4}
              value={die}
              onChange={(e) => setDie(e.target.value === '' ? '' : Number(e.target.value))}
              className="mt-1 w-full rounded border border-stone-700 bg-stone-800 px-3 py-2 text-center font-mono text-lg text-stone-200 focus:border-amber-500 focus:outline-none"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDie(rollDie(4, systemRng))}
            className="border-stone-600 text-stone-300 hover:bg-stone-700"
          >
            Rolar 1d4
          </Button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="mt-2 flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isApplying}
            className="bg-amber-600 text-stone-100 hover:bg-amber-700"
          >
            Confirmar Descanso Longo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
