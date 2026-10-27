// Dados de Vida: o dado da Vocação (fonte única, usada também pelo PV inicial e pelo level-up) e a
// reserva do personagem, que é igual ao nível. Os gastos ficam na ficha; o total não é gravado.
// Termos: CONTEXT.md (Dado de Vida, Descanso Curto, Morrendo, Estável). Regras: docs/vocacoes/*.md, regras-base.md 6.4.

import { calculateModifier } from '@/domain/attributes';
import { rollDie } from '@/domain/dice';
import type { Rng } from '@/domain/rng';

/** Dado das Vocações que não são de d10 (Batedor, Sacerdote/Sábio) e de Vocação desconhecida. */
const DEFAULT_HIT_DIE = 8;

/** Vocações de d10; a chave é o nome sem acento e em minúsculas. */
const D10_VOCATIONS = ['guerreiro', 'cacador'];

function plain(vocation: string) {
  return vocation.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Faces do Dado de Vida da Vocação: d10 para Guerreiro e Caçador, d8 para as demais. */
export function getHitDie(vocation: string | null | undefined): number {
  return D10_VOCATIONS.includes(plain(vocation ?? '')) ? 10 : DEFAULT_HIT_DIE;
}

/** A média do dado (o level-up usa a média, não rola): metade das faces mais 1. */
export function getHitDieAverage(die: number): number {
  return die / 2 + 1;
}

export interface HitDice {
  /** Faces do dado da Vocação. */
  die: number;
  /** A reserva inteira: igual ao nível. */
  total: number;
  /** Os que ainda não foram gastos. */
  remaining: number;
}

export function getHitDice(character: {
  level: number | null | undefined;
  spent: number | null | undefined;
  vocation: string | null | undefined;
}): HitDice {
  const total = character.level || 1;
  return {
    die: getHitDie(character.vocation),
    total,
    remaining: Math.max(0, total - (character.spent ?? 0)),
  };
}

export type HitDieSpendBlock = 'closed' | 'dead' | 'dying' | 'none-left' | 'full';

/**
 * Por que o personagem não pode gastar um Dado de Vida agora, ou `null` se pode. Só se gasta com o
 * Descanso Curto aberto. Morrendo não gasta (o Mestre resolve os Testes de Morte antes); Estável
 * gasta e acorda.
 */
export function getHitDieSpendBlock(input: {
  restOpen: boolean;
  isDead: boolean;
  isDying: boolean;
  remaining: number;
  currentPv: number;
  maxPv: number;
}): HitDieSpendBlock | null {
  if (!input.restOpen) return 'closed';
  if (input.isDead) return 'dead';
  if (input.isDying) return 'dying';
  if (input.remaining <= 0) return 'none-left';
  if (input.currentPv >= input.maxPv) return 'full';
  return null;
}

export function hitDieSpendBlockMessage(block: HitDieSpendBlock): string {
  switch (block) {
    case 'closed':
      return 'O Descanso Curto não está aberto.';
    case 'dead':
      return 'Personagem morto.';
    case 'dying':
      return 'Morrendo: resolva os Testes de Morte antes.';
    case 'none-left':
      return 'Sem Dados de Vida restantes.';
    case 'full':
      return 'PV já está no máximo.';
  }
}

/** O dado digitado precisa ser um inteiro de 1 até as faces do Dado de Vida. */
export function isValidHitDieRoll(roll: number, die: number): boolean {
  return Number.isInteger(roll) && roll >= 1 && roll <= die;
}

/** A Rolagem Virtual do Dado de Vida (ADR 0001: o dado físico continua sendo o padrão). */
export function rollHitDie(die: number, rng: Rng): number {
  return rollDie(die, rng);
}

/**
 * A cura de um Dado de Vida: o rolado mais o modificador de CON, no mínimo 1, mais 1 com Sangue
 * Resiliente (Manassés, caminho B do nível 4), sem passar do PV máximo. `healed` é o que subiu de
 * fato. CON ausente vale 10.
 */
export function healWithHitDie(input: {
  roll: number;
  conScore: number | null | undefined;
  currentPv: number;
  maxPv: number;
  bloodResilience: boolean;
}): { newPv: number; healed: number } {
  const conMod = calculateModifier(input.conScore ?? 10);
  const heal = Math.max(1, input.roll + conMod) + (input.bloodResilience ? 1 : 0);
  const newPv = Math.min(input.maxPv, input.currentPv + heal);
  return { newPv, healed: newPv - input.currentPv };
}
