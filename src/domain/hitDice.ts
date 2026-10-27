// Dados de Vida: o dado da Vocação (fonte única, usada também pelo PV inicial e pelo level-up) e a
// reserva do personagem, que é igual ao nível. Os gastos ficam na ficha; o total não é gravado.
// Termos: CONTEXT.md (Dado de Vida). Regras: docs/vocacoes/*.md, regras-base.md 6.4.

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
