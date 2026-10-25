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

interface FortitudeDialogProps {
  isOpen: boolean;
  characterName: string;
  fortress: string | null | undefined;
  /** Recebe o d4 (1 a 4) e soma à Fé do personagem. */
  onApply: (die: number) => Promise<void>;
  onClose: () => void;
}

/**
 * A Fortaleza: o Mestre dá 1d4 de Fé a quem agiu pela sua virtude. O d4 é o dado físico digitado
 * ou a Rolagem Virtual; não há limite por dia.
 */
export function FortitudeDialog({
  isOpen,
  characterName,
  fortress,
  onApply,
  onClose,
}: FortitudeDialogProps) {
  const [die, setDie] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
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
      await onApply(Number(die));
      onClose();
    } catch {
      setError('Não foi possível aplicar a Fortaleza. Tente de novo.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-stone-900 border-amber-700/50 text-stone-200">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-amber-500">Fortaleza</DialogTitle>
          <DialogDescription className="text-stone-400">
            {characterName} agiu pela sua virtude e recupera 1d4 de Fé.
          </DialogDescription>
        </DialogHeader>

        <p className="text-stone-300">
          {fortress ? (
            <span className="font-medium text-amber-400">{fortress}</span>
          ) : (
            <span className="italic text-stone-500">Sem Fortaleza registrada.</span>
          )}
        </p>

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
            onClick={handleApply}
            disabled={isApplying}
            className="bg-amber-600 text-stone-100 hover:bg-amber-700"
          >
            Aplicar Fortaleza
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
