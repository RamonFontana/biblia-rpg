// CARACTERIZAÇÃO: regras de cura e Fé dos consumíveis, extraídas de InventoryList e
// useUpdateNPCInventory sem alteração de comportamento.
// Decisões: ROADMAP.md, Onda 2 (bloco B): Odre e Ração viram Sustento e não curam; o Bálsamo
// cura 1d4 PV, rolado pelo jogador na mesa (ADR 0001).
// Problemas conhecidos: o dado de cura é exibido mas nunca rolado; o texto da descrição do item
// vira regra de cura (a descrição do catálogo é a fonte).
import { applyHpDelta, getCurrentPv, getMaxPv, type VitalsLike } from './vitalsUtils';

/** Progressão do dado de cura: cada nível de Qualidade acima de 1 avança um degrau. */
const DICE_PROGRESSION = [
  '1',
  '1d4',
  '1d6',
  '1d8',
  '1d10',
  '1d12',
  '2d6',
  '2d8',
  '2d10',
  '2d12',
  '3d8',
  '3d10',
  '3d12',
];

export interface HealingInfo {
  healDice?: string;
  heal?: number;
}

/**
 * Cura efetiva de um item. Usa os efeitos gravados; se não houver nenhum, lê a descrição do
 * catálogo ("Cura 1d4 PV" ou "Cura 2 PV"). Depois aplica a Qualidade (nível) do item:
 * dado sobe um degrau por nível; cura fixa soma +2 por nível acima de 1.
 */
export function resolveHealing(
  effectHealDice: string | undefined,
  effectHeal: number | undefined,
  catalogDescription: string | undefined,
  level: number,
): HealingInfo {
  let healDice = effectHealDice;
  let fixedHeal = effectHeal;

  if (!healDice && !fixedHeal && catalogDescription) {
    const healDiceMatch = catalogDescription.match(/Cura\s+(\d+d\d+)\s+(HP|PV)/i);
    if (healDiceMatch) {
      healDice = healDiceMatch[1];
    } else {
      const healFixedMatch = catalogDescription.match(/Cura\s+(\d+)\s+(HP|PV)/i);
      if (healFixedMatch) {
        fixedHeal = Number(healFixedMatch[1]);
      }
    }
  }

  if (healDice) {
    const levelBonus = Math.max(0, level - 1);
    const baseIndex = DICE_PROGRESSION.indexOf(healDice.toLowerCase().trim());
    if (baseIndex !== -1) {
      const newIndex = Math.min(baseIndex + levelBonus, DICE_PROGRESSION.length - 1);
      healDice = DICE_PROGRESSION[newIndex];
    }
    return { healDice };
  }
  if (fixedHeal) {
    const levelBonus = Math.max(0, level - 1);
    return { heal: fixedHeal + levelBonus * 2 };
  }
  return {};
}

interface ConsumableStats extends VitalsLike {
  faith?: number | null;
  current_faith?: number | null;
}

export interface ConsumableEffects {
  heal?: number;
  restore_faith?: number;
}

/** Aplica cura fixa (até o PV máximo) e Fé (até a Fé Inicial gravada) às stats do alvo. */
export function applyConsumableEffects<T extends ConsumableStats>(
  currentStats: T,
  effects: ConsumableEffects,
): { stats: T & { current_pv?: number; current_faith?: number }; hasChanges: boolean } {
  const newStats = { ...currentStats } as T & { current_pv?: number; current_faith?: number };
  let hasChanges = false;

  if (effects.heal) {
    const maxHp = getMaxPv(newStats);
    const currentHp = getCurrentPv(newStats, maxHp);
    newStats.current_pv = applyHpDelta(currentHp, maxHp, effects.heal);
    hasChanges = true;
  }

  if (effects.restore_faith) {
    const maxFaith = newStats.faith || 0;
    const currentFaith = newStats.current_faith ?? maxFaith;
    newStats.current_faith = Math.min(currentFaith + effects.restore_faith, maxFaith);
    hasChanges = true;
  }

  return { stats: newStats, hasChanges };
}
