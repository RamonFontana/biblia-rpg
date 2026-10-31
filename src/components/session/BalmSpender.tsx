import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { healCharacter } from '@/data-access/characters';
import { removeInventoryItem, setInventoryQuantity } from '@/data-access/inventory';
import {
  balmUseBlockMessage,
  getBalmDice,
  getBalmUseBlock,
  isRestOnlyItem,
  healWithBalm,
  isValidBalmRoll,
  rollBalm,
} from '@/domain/balm';
import { isDying } from '@/domain/deathSaves';
import { getCurrentPv, getMaxPv } from '@/domain/vitals';
import type { CharacterStats } from '@/features/character-creation/types';
import { systemRng } from '@/lib/systemRng';
import type { CombatInventoryItem, InventoryCatalogItem } from '@/types/inventory';
import type { SpenderCharacter } from './HitDiceSpender';

const catalogOf = (owned: CombatInventoryItem): InventoryCatalogItem | undefined =>
  Array.isArray(owned.items) ? owned.items[0] : (owned.items ?? undefined);

interface BalmSpenderProps {
  character: SpenderCharacter;
  /** O Descanso Curto da sessão está aberto. */
  restOpen: boolean;
  /** Avisa a tela do que mudou na ficha, para o PV e o inventário acompanharem na hora. */
  onSpent: (characterId: string, patch: Record<string, unknown>) => void;
}

/**
 * Usa o Bálsamo no Descanso Curto aberto: o dado físico digitado ou a Rolagem Virtual (ADR 0001).
 * Cura o resultado, sem CON, sem passar do PV máximo; quem estava Estável acorda. Grava o PV
 * primeiro e só então gasta a unidade, para nunca perder o item sem curar.
 */
export function BalmSpender({ character, restOpen, onSpent }: BalmSpenderProps) {
  const [typed, setTyped] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const items = character.character_items ?? [];
  const owned = items.find(
    (entry) => isRestOnlyItem(catalogOf(entry)?.slug) && (entry.quantity ?? 0) > 0,
  );
  const quantity = owned?.quantity ?? 0;
  const dice = owned ? getBalmDice(catalogOf(owned)?.description ?? '', owned.level) : null;
  const sides = dice ? Number(dice.split('d')[1]) : 0;
  const diceLabel = dice?.startsWith('1d') ? `Resultado do d${sides}` : `Resultado de ${dice}`;

  const stats = (character.stats ?? {}) as CharacterStats;
  const maxPv = getMaxPv(stats);
  const currentPv = getCurrentPv(stats, maxPv);
  const wasStable = Boolean(character.is_stable) && currentPv <= 0;

  const block = getBalmUseBlock({
    restOpen,
    isDead: Boolean(character.is_dead),
    isDying: isDying(character),
    quantity: dice ? quantity : 0,
    currentPv,
    maxPv,
  });

  const use = async (roll: number, virtual: boolean) => {
    if (!owned || !dice) return;
    if (!isValidBalmRoll(roll, dice)) {
      setError(`O dado vai de ${dice.split('d')[0]} a ${Number(dice.split('d')[0]) * sides}.`);
      return;
    }
    setError(null);
    setBusy(true);
    const { newPv, healed } = healWithBalm({ roll, currentPv, maxPv });
    const newStats = { ...stats, current_pv: newPv };
    const wakePatch = wasStable
      ? { is_stable: false, death_saves_successes: 0, death_saves_failures: 0 }
      : {};
    try {
      await healCharacter(character.id, { stats: newStats, wakeUp: wasStable });
    } catch (e) {
      console.error('Erro ao curar com o Bálsamo:', e);
      setError('Não foi possível usar o Bálsamo. Tente de novo.');
      setBusy(false);
      return;
    }
    try {
      if (quantity <= 1) await removeInventoryItem(owned.id ?? '');
      else await setInventoryQuantity(owned.id ?? '', quantity - 1);
    } catch (e) {
      console.error('Erro ao gastar o Bálsamo:', e);
      setError('Não foi possível gastar o Bálsamo do inventário. A cura foi gravada.');
      onSpent(character.id, { stats: newStats, ...wakePatch });
      setBusy(false);
      return;
    }
    const character_items =
      quantity <= 1
        ? items.filter((entry) => entry !== owned)
        : items.map((entry) => (entry === owned ? { ...entry, quantity: quantity - 1 } : entry));
    onSpent(character.id, { stats: newStats, character_items, ...wakePatch });
    setTyped('');
    setMessage(`${virtual ? `Rolou ${roll}. ` : ''}Curou ${healed} PV (${currentPv} → ${newPv}).`);
    setBusy(false);
  };

  const blocked = block !== null || busy;

  return (
    <div className="rounded-md border border-stone-700 bg-stone-800/60 p-3 text-left">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-300">
        <span className="font-semibold text-stone-200">{`Bálsamo: ${quantity}`}</span>
      </div>

      <div className="mt-2 flex items-end gap-2">
        {dice && (
          <label className="flex-1 text-xs text-stone-400">
            {diceLabel}
            <input
              type="number"
              min={1}
              value={typed}
              disabled={blocked}
              onChange={(e) => setTyped(e.target.value)}
              className="mt-1 w-full rounded border border-stone-700 bg-stone-900 px-2 py-1.5 text-center font-mono text-stone-200 focus:border-amber-500 focus:outline-none disabled:opacity-50"
            />
          </label>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={blocked || typed === ''}
          onClick={() => use(Number(typed), false)}
          className="min-h-11 border-stone-600 text-stone-200 hover:bg-stone-700"
        >
          Usar Bálsamo
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={blocked}
          onClick={() => dice && use(rollBalm(dice, systemRng), true)}
          className="min-h-11 border-stone-600 text-stone-300 hover:bg-stone-700"
        >
          Rolar dado do Bálsamo
        </Button>
      </div>

      {block && <p className="mt-2 text-xs text-amber-400">{balmUseBlockMessage(block)}</p>}
      {message && <p className="mt-2 text-xs text-green-400">{message}</p>}
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
