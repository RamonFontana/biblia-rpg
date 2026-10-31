import { useState } from 'react';
import { HitDiceLabel } from '@/components/character/HitDiceLabel';
import { Button } from '@/components/ui/button';
import { spendHitDie } from '@/data-access/characters';
import { isDying } from '@/domain/deathSaves';
import {
  getHitDice,
  getHitDieSpendBlock,
  healWithHitDie,
  hitDieSpendBlockMessage,
  isValidHitDieRoll,
  rollHitDie,
} from '@/domain/hitDice';
import { getCharacterLevel } from '@/domain/levelUp';
import { getCurrentPv, getMaxPv } from '@/domain/vitals';
import type { CharacterStats } from '@/features/character-creation/types';
import type { Character } from '@/features/character-management/types';
import type { CombatInventoryItem } from '@/types/inventory';
import { systemRng } from '@/lib/systemRng';
import { getAbilitiesForCharacter } from '@/utils/abilityUtils';

/** A habilidade de Manassés (caminho B do nível 4) que soma 1 PV por Dado de Vida gasto. */
const BLOOD_RESILIENCE_ID = 'tribe-manasses-4-sangue-resilien';

/** O que o gasto lê de uma ficha: a de um jogador ou a de um NPC jogável. */
export type SpenderCharacter = SpenderSheet & { character_items?: CombatInventoryItem[] };

type SpenderSheet = Pick<
  Character,
  | 'id'
  | 'name'
  | 'tribe'
  | 'vocation'
  | 'level'
  | 'attributes'
  | 'stats'
  | 'skills'
  | 'hit_dice_spent'
  | 'is_dead'
  | 'is_stable'
  | 'is_enemy'
  | 'is_deleted'
>;

interface HitDiceSpenderProps {
  character: SpenderCharacter;
  /** O Descanso Curto da sessão está aberto. */
  restOpen: boolean;
  /** Mostra o nome do personagem (o Mestre vê vários); o jogador vê só o dele. */
  showName?: boolean;
  /** Avisa a tela do que mudou na ficha, para o PV e os dados acompanharem na hora. */
  onSpent: (characterId: string, patch: Record<string, unknown>) => void;
}

function hasBloodResilience(character: SpenderCharacter): boolean {
  return getAbilitiesForCharacter(
    character.tribe || '',
    character.vocation || '',
    getCharacterLevel(character),
    Array.isArray(character.skills) ? undefined : character.skills?.path_choices,
  ).some((ability) => ability.id === BLOOD_RESILIENCE_ID);
}

/**
 * Gasta Dados de Vida de um personagem no Descanso Curto aberto, um de cada vez: o dado físico
 * digitado ou a Rolagem Virtual (ADR 0001). Cada dado cura o rolado + CON (mínimo 1), sem passar do
 * PV máximo; quem estava Estável acorda.
 */
export function HitDiceSpender({
  character,
  restOpen,
  showName = false,
  onSpent,
}: HitDiceSpenderProps) {
  const [typed, setTyped] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const level = getCharacterLevel(character);
  const { die, remaining } = getHitDice({
    level,
    spent: character.hit_dice_spent,
    vocation: character.vocation,
  });
  const stats = (character.stats ?? {}) as CharacterStats;
  const maxPv = getMaxPv(stats);
  const currentPv = getCurrentPv(stats, maxPv);
  const wasStable = Boolean(character.is_stable) && currentPv <= 0;

  const block = getHitDieSpendBlock({
    restOpen,
    isDead: Boolean(character.is_dead),
    isDying: isDying(character),
    remaining,
    currentPv,
    maxPv,
  });

  const spend = async (roll: number, virtual: boolean) => {
    if (!isValidHitDieRoll(roll, die)) {
      setError(`O dado vai de 1 a ${die}.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { newPv, healed } = healWithHitDie({
        roll,
        conScore: character.attributes?.con,
        currentPv,
        maxPv,
        bloodResilience: hasBloodResilience(character),
      });
      const newStats = { ...stats, current_pv: newPv };
      const hitDiceSpent = (character.hit_dice_spent ?? 0) + 1;
      await spendHitDie(character.id, { stats: newStats, hitDiceSpent, wakeUp: wasStable });
      onSpent(character.id, {
        stats: newStats,
        hit_dice_spent: hitDiceSpent,
        ...(wasStable && {
          is_stable: false,
          death_saves_successes: 0,
          death_saves_failures: 0,
        }),
      });
      setTyped('');
      setMessage(
        `${virtual ? `Rolou ${roll}. ` : ''}Curou ${healed} PV (${currentPv} → ${newPv}).`,
      );
    } catch (e) {
      console.error('Erro ao gastar o Dado de Vida:', e);
      setError('Não foi possível gastar o Dado de Vida. Tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  const blocked = block !== null || busy;

  return (
    <div className="rounded-md border border-stone-700 bg-stone-800/60 p-3 text-left">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-300">
        {showName && <span className="font-semibold text-stone-200">{character.name}</span>}
        <HitDiceLabel
          level={level}
          spent={character.hit_dice_spent}
          vocation={character.vocation}
        />
        <span className="font-mono tabular-nums text-stone-400">{`PV ${currentPv}/${maxPv}`}</span>
      </div>

      <div className="mt-2 flex items-end gap-2">
        <label className="flex-1 text-xs text-stone-400">
          {`Resultado do d${die}`}
          <input
            type="number"
            min={1}
            max={die}
            value={typed}
            disabled={blocked}
            onChange={(e) => setTyped(e.target.value)}
            className="mt-1 w-full rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-center font-mono text-stone-200 focus:border-amber-500 focus:outline-none disabled:opacity-50"
          />
        </label>
        <Button
          type="button"
          variant="outline"
          disabled={blocked || typed === ''}
          onClick={() => spend(Number(typed), false)}
          className="border-stone-600 text-stone-200 hover:bg-stone-700"
        >
          Gastar dado
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={blocked}
          onClick={() => spend(rollHitDie(die, systemRng), true)}
          className="border-stone-600 text-stone-300 hover:bg-stone-700"
        >
          Rolar dado virtual
        </Button>
      </div>

      {block && <p className="mt-2 text-xs text-amber-400">{hitDieSpendBlockMessage(block)}</p>}
      {message && <p className="mt-2 text-xs text-green-400">{message}</p>}
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
