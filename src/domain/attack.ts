// Ataque: o atributo, a Proficiência, o acerto contra a CA, o Acerto Crítico, a Falha Crítica e o
// dano. O d20 e o dano chegam digitados (dados físicos, ADR 0001); o motor só aplica a regra.
// Termos: CONTEXT.md (Ataque, Acerto Crítico, Falha Crítica, CA). Regras: docs/regras-base.md, 6.2.
import { calculateModifier, calculateProficiency } from './attributes';
import { canonicalVocation } from './vocation';

export type AttackAbility = 'for' | 'des';

/** O que o ataque lê de uma arma do conteúdo; `null` no lugar dela é o ataque desarmado. */
export interface AttackWeapon {
  id?: string;
  /** Dado e tipo, como no conteúdo: `1d8 cortante`. */
  damage?: string;
  category?: string;
  properties?: string[];
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

/** O Sacerdote (e o Sábio) não usa armas marciais; as demais Vocações usam as duas categorias. */
export function isWeaponProficient(vocation: string, category: string | undefined): boolean {
  const isMartial = (category ?? '').toLowerCase().includes('marcial');
  const vocationName = (canonicalVocation(vocation) ?? '').toLowerCase();
  return !(isMartial && NO_MARTIAL_WEAPONS.includes(vocationName));
}

/** O d20 contra a CA: 20 natural acerta sempre (crítico) e 1 natural erra sempre. */
export function resolveAttack(input: AttackInput): AttackResult {
  const ability = attackAbility(input.weapon, input.attributes);
  const modifier = calculateModifier(input.attributes[ability]);
  const proficient = input.weapon
    ? isWeaponProficient(input.vocation, input.weapon.category)
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
}): string {
  const { attackerName, targetName } = attack;
  if (attack.hit) {
    const kind = attack.critical ? ' (crítico)' : '';
    return `${attackerName} acertou ${targetName}${kind}: ${attack.damage} de dano.`;
  }
  return `${attackerName} errou ${targetName}${attack.fumble ? ' (falha crítica)' : ''}.`;
}
