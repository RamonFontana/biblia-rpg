// Bálsamo: item que cura o resultado do dado do item, só no Descanso Curto (CONTEXT.md, Bálsamo).
// Sem modificador de CON e sem teto por Descanso; o dado físico digitado vale (ADR 0001).
import { rollDice } from '@/domain/dice';
import type { Rng } from '@/domain/rng';
import { resolveHealing } from '@/domain/consumables';

export type BalmUseBlock = 'closed' | 'dead' | 'dying' | 'none' | 'full';

function parseDice(dice: string): { count: number; sides: number } {
  const [count, sides] = dice.toLowerCase().split('d').map(Number);
  return { count, sides };
}

/** O dado do Bálsamo: o da descrição do item, subindo um degrau por nível de Qualidade (ADR 0002). */
export function getBalmDice(description: string, level: number | null | undefined): string | null {
  return resolveHealing(undefined, undefined, description, level || 1).healDice ?? null;
}

/** O resultado digitado é a soma dos dados: um inteiro de N a N vezes as faces. */
export function isValidBalmRoll(total: number, dice: string): boolean {
  const { count, sides } = parseDice(dice);
  return Number.isInteger(total) && total >= count && total <= count * sides;
}

/** A Rolagem Virtual do Bálsamo (ADR 0001: o dado físico continua sendo o padrão). */
export function rollBalm(dice: string, rng: Rng): number {
  const { count, sides } = parseDice(dice);
  return rollDice(count, sides, rng).reduce((sum, value) => sum + value, 0);
}

/** A cura é o resultado, sem CON, limitada ao PV máximo; `healed` é o que subiu de fato. */
export function healWithBalm(input: { roll: number; currentPv: number; maxPv: number }): {
  newPv: number;
  healed: number;
} {
  const newPv = Math.min(input.maxPv, input.currentPv + input.roll);
  return { newPv, healed: newPv - input.currentPv };
}

/**
 * Por que o personagem não pode usar o Bálsamo agora, ou `null` se pode. Mesmas regras do Dado de
 * Vida: só com o Descanso Curto aberto; Morrendo não usa; Estável usa e acorda.
 */
export function getBalmUseBlock(input: {
  restOpen: boolean;
  isDead: boolean;
  isDying: boolean;
  quantity: number;
  currentPv: number;
  maxPv: number;
}): BalmUseBlock | null {
  if (!input.restOpen) return 'closed';
  if (input.isDead) return 'dead';
  if (input.isDying) return 'dying';
  if (input.quantity <= 0) return 'none';
  if (input.currentPv >= input.maxPv) return 'full';
  return null;
}

export function balmUseBlockMessage(block: BalmUseBlock): string {
  switch (block) {
    case 'closed':
      return 'Só no Descanso Curto.';
    case 'dead':
      return 'Personagem morto.';
    case 'dying':
      return 'Morrendo: resolva os Testes de Morte antes.';
    case 'none':
      return 'Sem Bálsamo no inventário.';
    case 'full':
      return 'PV já está no máximo.';
  }
}
