import { useState } from 'react';
import { createSessionEnemies } from '@/services/enemyService';
import { expandEnemyCopies } from '@/lib/enemyCopies';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Character } from '@/features/character-management/types';
import { UnifiedEnemyForm, type EnemyFormValues } from './enemy-form';

interface CreateEnemyDialogProps {
  sessionId: string;
  onEnemyCreated?: (enemy: Character) => void;
  /** Os nomes dos inimigos que a sessão já tem: a numeração do lote continua deles. */
  existingNames?: string[];
}

export function CreateEnemyDialog({
  sessionId,
  onEnemyCreated,
  existingNames = [],
}: CreateEnemyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (formData: EnemyFormValues) => {
    if (!formData.name) return;
    setIsCreating(true);

    try {
      const created = await createSessionEnemies(
        sessionId,
        expandEnemyCopies(formData, existingNames),
      );
      if (created.length === 0) return;

      created.forEach((enemy) => onEnemyCreated?.(enemy));

      setIsOpen(false);
    } catch (err) {
      console.error('Failed to create enemy:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus size={16} />
          Criar Inimigo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl bg-stone-900 text-stone-200 border-stone-700 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>Criar Novo Inimigo</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <UnifiedEnemyForm
            onSubmit={handleCreate}
            onCancel={() => setIsOpen(false)}
            isSubmitting={isCreating}
            submitLabel="Criar Inimigo"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
