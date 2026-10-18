import { useState } from 'react';
import { getCurrentUser } from '@/data-access/auth';
import { createEnemyCharacter } from '@/data-access/characters';
import { addSessionParticipant } from '@/data-access/sessions';
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
}

export function CreateEnemyDialog({ sessionId, onEnemyCreated }: CreateEnemyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (formData: EnemyFormValues) => {
    if (!formData.name) return;
    setIsCreating(true);

    try {
      const user = await getCurrentUser();
      if (!user) return;

      const newCharacter = {
        name: formData.name,
        vocation: formData.vocation ?? '',
        tribe: 'Inimigo',
        is_enemy: true,
        user_id: user.id,
        has_participated_in_session: true,
        stats: {
          pv: formData.hpMax,
          current_pv: formData.hpCurrent,
          ca: formData.ca,
          faith: 0,
          current_faith: 0,
        },
        attributes: formData.attributes,
        skills: formData.skills || [],
        narrative: {
          imageUrl: formData.imageBase64 || '',
        },
      };

      // 1. Create character
      const enemy = await createEnemyCharacter(newCharacter);

      // 2. Add to session
      await addSessionParticipant({ sessionId, characterId: enemy.id, userId: user.id });

      if (onEnemyCreated) {
        onEnemyCreated(enemy);
      }

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
