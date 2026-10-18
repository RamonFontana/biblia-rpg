import { useState } from 'react';
import { useCharacterCreationStore } from '../store/useCharacterCreationStore';
import { updateCharacter } from '@/data-access/characters';

import type { DraftCharacter } from '../types';

export function useQuickSave() {
  const { draft, editingId } = useCharacterCreationStore();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const quickSave = async (partialData?: Partial<DraftCharacter>) => {
    if (!editingId) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload = { ...draft, ...partialData };
      const { equipment, coins, ...draftWithoutEquipment } = payload;
      await updateCharacter(editingId, draftWithoutEquipment as any);
      setMessage('Salvo!');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage('Erro ao salvar');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return { quickSave, saving, message, isEditing: !!editingId };
}
