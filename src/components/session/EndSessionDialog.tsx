import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { canGrantLevelUp } from '@/features/character-management/utils/levelUp';
import { isDying } from '@/lib/deathSaves';

interface EndSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (levelUpCharacterIds: string[]) => void;
  playerCharacters: any[];
}

export function EndSessionDialog({
  isOpen,
  onClose,
  onConfirm,
  playerCharacters,
}: EndSessionDialogProps) {
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const playableCharacters = playerCharacters.filter(
    (pc) => !pc.character.is_npc && !pc.character.is_enemy && !pc.character.is_deleted,
  );

  // A sessão não encerra com alguém Morrendo: o Mestre resolve os Testes de Morte antes.
  const dyingCharacters = playerCharacters
    .map((pc) => pc.character)
    .filter((character) => character && isDying(character));
  const isBlocked = dyingCharacters.length > 0;

  const toggleSelection = (id: string, disabled: boolean) => {
    if (disabled) return;
    setSelectedCharacterIds((prev) =>
      prev.includes(id) ? prev.filter((currId) => currId !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    if (isBlocked) return;
    setIsSubmitting(true);
    onConfirm(selectedCharacterIds);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-stone-900 border border-stone-800 text-stone-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-500 flex items-center gap-2">
            <span>⚠️</span> Finalizar Sessão
          </DialogTitle>
          <DialogDescription className="text-stone-400">
            Tem certeza que deseja finalizar esta sessão? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        {isBlocked && (
          <div className="bg-amber-900/50 border border-amber-500/50 p-4 rounded text-amber-200 text-sm">
            <strong>Atenção:</strong> resolva os Testes de Morte antes de encerrar. Morrendo:{' '}
            {dyingCharacters.map((character) => character.name).join(', ')}.
          </div>
        )}

        <div className="py-4 space-y-4 border-y border-stone-800 my-2">
          <div>
            <h4 className="text-stone-200 font-semibold mb-2">Conceder Level Up</h4>
            <p className="text-stone-400 text-sm mb-4">
              Selecione quais personagens merecem subir de nível pela experiência adquirida nesta
              sessão.
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {playableCharacters.map((pc) => {
                const isLevel20 = !canGrantLevelUp(pc.character);
                return (
                  <div
                    key={pc.character.id}
                    className="flex items-center space-x-3 bg-stone-950 p-3 rounded border border-stone-800"
                  >
                    <Checkbox
                      id={`levelup-${pc.character.id}`}
                      checked={selectedCharacterIds.includes(pc.character.id)}
                      onCheckedChange={() => toggleSelection(pc.character.id, isLevel20)}
                      disabled={isLevel20}
                      className="border-stone-600 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                    />
                    <label
                      htmlFor={`levelup-${pc.character.id}`}
                      className={`text-sm font-medium leading-none flex-1 cursor-pointer ${
                        isLevel20 ? 'text-stone-500' : 'text-stone-200'
                      }`}
                    >
                      {pc.character.name}
                      {isLevel20 && (
                        <span className="ml-2 text-xs text-amber-500/70">(Nível Máximo)</span>
                      )}
                    </label>
                  </div>
                );
              })}

              {playableCharacters.length === 0 && (
                <p className="text-stone-500 text-sm italic">Nenhum jogador na sessão.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting || isBlocked}
          >
            {isSubmitting ? 'Finalizando...' : 'Sim, Finalizar Sessão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
