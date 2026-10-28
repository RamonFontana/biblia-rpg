// Ataque: o atributo, a Proficiência, o acerto contra a CA, o Acerto Crítico, a Falha Crítica e o
// dano. O d20 e o dano chegam digitados (dados físicos, ADR 0001); o motor só aplica a regra.
// Termos: CONTEXT.md (Ataque, Acerto Crítico, Falha Crítica, CA). Regras: docs/regras-base.md, 6.2.
import { calculateModifier, calculateProficiency } from './attributes';
import { rollDice } from './dice';
import type { Rng } from './rng';
import { CONDITIONS } from '@/content/conditions';
import { VOCATION_MARTIAL_WEAPONS } from '@/content/proficiencies';
import { applyConditionResistance } from './armorResistance';
import { combineModes, type ResolvedTestMode } from './testMode';
import type { ConditionEntry, WeaponEffect } from '@/types/combat';
import { canonicalVocation } from './vocation';

export type AttackAbility = 'for' | 'des';

/** O que o ataque lê de uma arma do conteúdo; `null` no lugar dela é o ataque desarmado. */
export interface AttackWeapon {
  id?: string;
  /** Dado e tipo, como no conteúdo: `1d8 cortante`. */
  damage?: string;
  category?: string;
  properties?: string[];
  /** O texto do item; o dado Versátil sai dele (`Versátil (1d10)`). */
  description?: string;
}

export interface AttackInput {
  attributes: { for?: number | null; des?: number | null };
  level: number;
  vocation: string;
  weapon: AttackWeapon | null;
  /** O d20 natural (o que vale, se houve Vantagem ou Desvantagem). */
  naturalRoll: number;
  targetAc: number;
}

export interface AttackResult {
  ability: AttackAbility;
  modifier: number;
  proficient: boolean;
  proficiencyBonus: number;
  total: number;
  hit: boolean;
  critical: boolean;
  fumble: boolean;
}

/**
 * FOR no corpo a corpo, no arremesso sem Acuidade e desarmado; DES com arma de munição; o maior dos
 * dois com Acuidade (FOR no empate).
 */
export function attackAbility(
  weapon: AttackWeapon | null,
  attributes: { for?: number | null; des?: number | null },
): AttackAbility {
  const properties = weapon?.properties ?? [];
  if (properties.includes('ammunition')) return 'des';
  if (properties.includes('finesse')) {
    return calculateModifier(attributes.des) > calculateModifier(attributes.for) ? 'des' : 'for';
  }
  return 'for';
}

// Vocações que não usam armas marciais ("Levita" é como fichas antigas chamam o Sacerdote da tribo).
const NO_MARTIAL_WEAPONS = ['sacerdote', 'levita'];

/**
 * O Sacerdote (e o Sábio) não usa armas marciais; o Batedor usa só as marciais da lista dele
 * (`VOCATION_MARTIAL_WEAPONS`); as demais Vocações usam as duas categorias.
 */
export function isWeaponProficient(
  vocation: string,
  category: string | undefined,
  weaponId?: string | null,
): boolean {
  if (!(category ?? '').toLowerCase().includes('marcial')) return true;
  const vocationName = canonicalVocation(vocation) ?? '';
  if (NO_MARTIAL_WEAPONS.includes(vocationName.toLowerCase())) return false;
  const allowed = VOCATION_MARTIAL_WEAPONS[vocationName];
  return !allowed || (!!weaponId && allowed.includes(weaponId));
}

/** O d20 contra a CA: 20 natural acerta sempre (crítico) e 1 natural erra sempre. */
export function resolveAttack(input: AttackInput): AttackResult {
  const ability = attackAbility(input.weapon, input.attributes);
  const modifier = calculateModifier(input.attributes[ability]);
  const proficient = input.weapon
    ? isWeaponProficient(input.vocation, input.weapon.category, input.weapon.id)
    : true;
  const proficiencyBonus = proficient ? calculateProficiency(input.level) : 0;
  const total = input.naturalRoll + modifier + proficiencyBonus;
  const critical = input.naturalRoll === 20;
  const fumble = input.naturalRoll === 1;
  const hit = critical || (!fumble && total >= input.targetAc);
  return { ability, modifier, proficient, proficiencyBonus, total, hit, critical, fumble };
}

/** O dado da arma (`1d8 cortante` → 1 e 8). */
function parseDamageDice(weapon: AttackWeapon): { count: number; sides: number } | null {
  const match = /^(\d+)d(\d+)/.exec(weapon.damage ?? '');
  return match ? { count: Number(match[1]), sides: Number(match[2]) } : null;
}

/** O lembrete do que rolar: o dado da arma, com a quantidade dobrada no Acerto Crítico. */
export function damageReminder(weapon: AttackWeapon | null, critical: boolean): string | null {
  const dice = weapon ? parseDamageDice(weapon) : null;
  if (!dice) return null;
  return `Role ${critical ? dice.count * 2 : dice.count}d${dice.sides}.`;
}

/**
 * O dano: o que o jogador digitou dos dados mais o modificador, uma vez só. Desarmado causa 1 mais
 * o modificador. Nunca é negativo.
 */
export function computeDamage(input: {
  weapon: AttackWeapon | null;
  modifier: number;
  rolled: number;
}): number {
  const dice = input.weapon ? input.rolled : 1;
  return Math.max(0, dice + input.modifier);
}

/** O aviso curto de um ataque, para a mesa: sem a CA nem o d20 (esses são do Mestre). */
export function describeAttack(attack: {
  attackerName: string;
  targetName: string;
  hit: boolean;
  critical: boolean;
  fumble: boolean;
  damage: number;
  /** O efeito de arma, já em texto (`describeWeaponEffect`). */
  weaponEffect?: string | null;
}): string {
  const { attackerName, targetName } = attack;
  if (attack.hit) {
    const kind = attack.critical ? ' (crítico)' : '';
    const effect = attack.weaponEffect ? ` ${attack.weaponEffect}.` : '';
    return `${attackerName} acertou ${targetName}${kind}: ${attack.damage} de dano.${effect}`;
  }
  return `${attackerName} errou ${targetName}${attack.fumble ? ' (falha crítica)' : ''}.`;
}

/** Se o ataque é à distância: a arma de munição (funda, arco), ou a de arremesso quando arremessada. */
export function weaponIsRanged(weapon: AttackWeapon | null, throwing = false): boolean {
  if (weapon?.properties?.includes('ammunition')) return true;
  return throwing && canThrow(weapon);
}

/** As armas de arremesso (Lança, Adaga, Dardo) podem ser usadas de perto ou arremessadas. */
export function canThrow(weapon: AttackWeapon | null): boolean {
  return !!weapon?.properties?.includes('thrown');
}

/** Arma Versátil com a outra mão livre pode ser usada com as duas mãos. */
export function canUseTwoHands(weapon: AttackWeapon | null, offHandFree: boolean): boolean {
  return offHandFree && !!weapon?.properties?.includes('versatile');
}

/** O dado Versátil do texto da arma (`Versátil (1d10)` → `1d10`). */
function versatileDie(weapon: AttackWeapon): string | null {
  return /Versátil \((\d+d\d+)\)/.exec(weapon.description ?? '')?.[1] ?? null;
}

/** A arma como será usada: com as duas mãos, o dado Versátil (o tipo de dano continua). */
export function effectiveWeapon(weapon: AttackWeapon, twoHands: boolean): AttackWeapon {
  const die = twoHands ? versatileDie(weapon) : null;
  const type = /^\d+d\d+ (.+)$/.exec(weapon.damage ?? '')?.[1];
  return die && type ? { ...weapon, damage: `${die} ${type}` } : weapon;
}

// A munição de cada arma é um item do inventário, pelo slug do conteúdo.
const AMMUNITION: Record<string, string> = {
  funda: 'pedras_funda',
  arco_curto: 'flechas',
  arco_longo: 'flechas',
};

/** O slug da munição que a arma gasta, ou `null` se não gasta. */
export function ammunitionSlug(weapon: AttackWeapon | null): string | null {
  if (!weapon?.properties?.includes('ammunition')) return null;
  return AMMUNITION[weapon.id ?? ''] ?? null;
}

export interface AttackModeInput {
  /** Os ids das Condições do atacante e do alvo. */
  attackerConditions: string[];
  targetConditions: string[];
  ranged: boolean;
  inspirationUsed: boolean;
}

const HINDERED_ATTACKER: Record<string, string> = {
  envenenado: 'Você está Envenenado',
  cego: 'Você está Cego',
  impedido: 'Você está Impedido',
};
const EXPOSED_TARGET: Record<string, string> = {
  atordoado: 'Alvo Atordoado',
  paralisado: 'Alvo Paralisado',
  cego: 'Alvo Cego',
};

/**
 * A modalidade do ataque: Desvantagem de quem ataca Envenenado, Cego ou Impedido; Vantagem contra
 * alvo Atordoado, Paralisado ou Cego; alvo Caído dá Vantagem no corpo a corpo e Desvantagem à
 * distância; a Inspiração dá Vantagem. Lados opostos se anulam, como nos Testes.
 */
export function resolveAttackMode(input: AttackModeInput): ResolvedTestMode {
  const advantages: string[] = [];
  const disadvantages: string[] = [];

  for (const id of input.attackerConditions) {
    if (HINDERED_ATTACKER[id]) disadvantages.push(HINDERED_ATTACKER[id]);
  }
  for (const id of input.targetConditions) {
    if (EXPOSED_TARGET[id]) advantages.push(EXPOSED_TARGET[id]);
    if (id === 'caido') {
      if (input.ranged) disadvantages.push('Alvo Caído (à distância)');
      else advantages.push('Alvo Caído (corpo a corpo)');
    }
  }
  if (input.inspirationUsed) advantages.push('Inspiração');

  return { mode: combineModes(advantages, disadvantages), advantages, disadvantages };
}

/** Rolagem Virtual do dano: os dados da arma (dobrados no crítico) somados; 0 se desarmado. */
export function rollDamage(weapon: AttackWeapon | null, critical: boolean, rng: Rng): number {
  const dice = weapon ? parseDamageDice(weapon) : null;
  if (!dice) return 0;
  return rollDice(critical ? dice.count * 2 : dice.count, dice.sides, rng).reduce(
    (sum, die) => sum + die,
    0,
  );
}

/** Quantas rodadas dura a Condição de um efeito de arma, sem cura nem resistência. */
const WEAPON_EFFECT_DURATION = 3;

/** O efeito de arma dispara no acerto com 18 natural ou mais (docs/itens/armas.md). */
export function weaponEffectTriggers(
  naturalRoll: number,
  hit: boolean,
  effects: WeaponEffect[] | null | undefined,
): boolean {
  return hit && naturalRoll >= 18 && !!effects && effects.length > 0;
}

/**
 * As Condições do efeito de arma depois da Resistência a Condição do alvo (nível por Condição), e
 * as frases de resistência para o Mestre.
 */
export function resolveWeaponEffect(
  effects: WeaponEffect[],
  resistanceLevels: Record<string, number>,
): { conditions: ConditionEntry[]; messages: string[] } {
  const conditions: ConditionEntry[] = [];
  const messages: string[] = [];
  for (const effect of effects) {
    const outcome = applyConditionResistance(
      effect.conditionId,
      WEAPON_EFFECT_DURATION,
      resistanceLevels[effect.conditionId] ?? 0,
    );
    if (outcome.message) messages.push(outcome.message);
    if (!outcome.immune) {
      conditions.push({ conditionId: effect.conditionId, duration: outcome.duration });
    }
  }
  return { conditions, messages };
}

/** O aviso para quem foi atingido (aliado ou NPC controlado por jogador). */
export function describeHitOnTarget(hit: {
  attackerName: string;
  damage: number;
  critical: boolean;
}): string {
  return `Você foi atingido por ${hit.attackerName}${hit.critical ? ' (crítico)' : ''}: ${hit.damage} de dano.`;
}

/** O aviso do Mestre: o golpe atingiu quem já estava Morrendo; a falha no Teste de Morte é dele. */
export function describeStrikeOnDying(strike: { targetName: string; critical: boolean }): string {
  return `${strike.targetName} já estava Morrendo e foi atingido${strike.critical ? ' (crítico)' : ''}: marque a falha no Teste de Morte.`;
}

const PROPERTY_LABELS: Record<string, string> = {
  finesse: 'Acuidade',
  thrown: 'Arremesso',
  versatile: 'Versátil',
  ammunition: 'Munição',
  'two-handed': 'Duas mãos',
  heavy: 'Pesada',
};

/** As propriedades da arma em português, na ordem do conteúdo. */
export function describeWeaponProperties(weapon: AttackWeapon | null): string {
  return (weapon?.properties ?? [])
    .map((property) => PROPERTY_LABELS[property])
    .filter(Boolean)
    .join(', ');
}

const signed = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

/**
 * O que entra na soma do ataque (o atributo e a Proficiência), para o jogador entender o total sem
 * ver a CA do alvo.
 */
export function describeAttackBonus(
  input: Pick<AttackInput, 'attributes' | 'level' | 'vocation' | 'weapon'>,
): string {
  const ability = attackAbility(input.weapon, input.attributes);
  const modifier = calculateModifier(input.attributes[ability]);
  const proficient = input.weapon
    ? isWeaponProficient(input.vocation, input.weapon.category, input.weapon.id)
    : true;
  const parts = [`d20`, `${ability.toUpperCase()} ${signed(modifier)}`];
  if (proficient) parts.push(`Proficiência ${signed(calculateProficiency(input.level))}`);
  return parts.join(' + ');
}

/** O efeito de arma de um ataque: as Condições que chegaram ao alvo, ou "resistido"; nulo sem disparo. */
export function describeWeaponEffect(
  triggered: boolean,
  appliedConditionIds: string[],
): string | null {
  if (!triggered) return null;
  if (appliedConditionIds.length === 0) return 'Efeito de arma resistido';
  const names = appliedConditionIds.map((id) => CONDITIONS[id]?.name ?? id);
  return `Efeito de arma: ${names.join(', ')}`;
}
