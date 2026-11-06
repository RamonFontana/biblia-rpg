// O lembrete do Ataque Furtivo no cartão do inimigo, só na tela do Mestre (CONTEXT.md: Ataque
// Furtivo). O 1d6 entra no "Modificar Vida"; o "usei" trava o lembrete até o próximo turno dele.
import { useState } from 'react';
import { Button } from '../ui/button';
import { setEnemyFurtivoUsed } from '@/data-access/combat';
import { furtivoReminder, furtivoStateOf } from '@/domain/furtivo';

interface FurtivoReminderProps {
  participantId: string;
  skills: unknown;
  hp: number;
  isCurrentTurn: boolean;
  round: number;
  /** O `ability_state` do participante, como veio do banco. */
  abilityState: unknown;
}

export function FurtivoReminder({
  participantId,
  round,
  abilityState,
  ...rest
}: FurtivoReminderProps) {
  const [error, setError] = useState(false);
  const reminder = furtivoReminder({ ...rest, round, state: furtivoStateOf(abilityState) });
  if (!reminder) return null;

  const markUsed = async () => {
    setError(false);
    try {
      await setEnemyFurtivoUsed(participantId, round);
    } catch (e) {
      console.error('Erro ao marcar o Ataque Furtivo:', e);
      setError(true);
    }
  };

  return (
    <div
      data-testid="furtivo-reminder"
      className="mt-2 flex items-center justify-between gap-2 rounded border border-amber-500/40 bg-stone-900 p-2"
    >
      <span
        className={reminder.used ? 'text-xs text-stone-500 line-through' : 'text-xs text-amber-500'}
      >
        {reminder.text}
      </span>
      {error && <span className="text-xs text-red-500">Não gravou</span>}
      <Button size="sm" variant="outline" disabled={reminder.used} onClick={markUsed}>
        {reminder.used ? 'Usado' : 'usei'}
      </Button>
    </div>
  );
}
