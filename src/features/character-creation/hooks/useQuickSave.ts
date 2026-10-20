import { useState } from 'react';
import { useCharacterCreationStore } from '../store/useCharacterCreationStore';
import { updateCharacter } from '@/data-access/characters';

import type { DraftCharacter } from '../types';
import { withoutShop } from '../utils/draft';

export function useQuickSave() {
  const { draft, editingId } = useCharacterCreationStore();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const quickSave = async (partialData?: Partial<DraftCharacter>) => {
    if (!editingId) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateCharacter(editingId, withoutShop({ ...draft, ...partialData }));
      setMessage('Salvo!');
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage('Erro ao salvar');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return { quickSave, saving, message, isEditing: !!editingId };
}
