// O Template Endemoniado (CONTEXT.md: Template Endemoniado; docs/bestiario/template-endemoniado.md):
// função pura que transforma os valores de um inimigo na criação (ADR 0012). Sem estado: o resultado
// é um inimigo novo, que o Mestre ainda edita.
import {
  ENDEMONIADO_ABILITIES,
  ENDEMONIADO_ALIGNMENT,
  ENDEMONIADO_ATTRIBUTE_BONUS,
  ENDEMONIADO_BESTIAL_ATTACK,
  ENDEMONIADO_IMMUNITIES,
  ENDEMONIADO_INT_CAP,
  ENDEMONIADO_SKILL,
} from '@/content/enemyTemplate';
import type { EnemyAttack } from '@/content/schemas';
import { calculateModifier } from './attributes';

interface Attributes {
  for: number;
  des: number;
  con: number;
  int: number;
  sab: number;
  car: number;
}

export interface HitDice {
  count: number;
  sides: number;
  bonus: number;
}

export interface TemplateEnemy {
  name: string;
  /** Para o sufixo concordar: "Endemoniado" ou "Endemoniada". */
  nameGender: 'm' | 'f';
  /** Tamanho, tipo e tendência ("Médio, Humano, Neutro e Mau"). */
  creatureType: string;
  hp: number;
  /** Sem dado de vida (inimigo do zero) o PV não muda. */
  hitDice?: HitDice;
  attributes: Attributes;
  attacks: EnemyAttack[];
  abilities: { name: string; description: string; libraryId?: string }[];
  conditionImmunities: string[];
  /** As perícias do bloco, em texto ("Atletismo +5, Intimidação +4"). */
  proficiencies?: string;
  /** O inimigo já é Endemoniado (o Preset Endemoniado Comum): o Template não se aplica de novo. */
  endemoniado?: boolean;
}

export function canApplyEndemoniado(enemy: Pick<TemplateEnemy, 'endemoniado'>): boolean {
  return !enemy.endemoniado;
}

const ALIGNMENT_START = /^(Leal|Neutro|Caótico|Imparcial)/i;

/** Troca a tendência no fim do "Tamanho, Tipo, Tendência", mantendo tamanho e tipo. */
function withEndemoniadoAlignment(creatureType: string): string {
  const parts = creatureType
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const kept = parts.findIndex((part) => ALIGNMENT_START.test(part));
  const sizeAndType = kept === -1 ? parts : parts.slice(0, kept);
  return [...sizeAndType, ENDEMONIADO_ALIGNMENT].join(', ');
}

/** O PV médio do dado de vida (arredondado para baixo, como nos blocos dos docs). */
const averageHp = ({ count, sides, bonus }: HitDice) =>
  Math.floor((count * (sides + 1)) / 2 + bonus);

/** O ataque que a FOR rege ganha o que o modificador de FOR ganhou; a Acuidade usa o maior dos dois. */
function upgradeAttack(attack: EnemyAttack, before: Attributes, after: Attributes): EnemyAttack {
  if (attack.attribute === 'des') return attack;
  const forBefore = calculateModifier(before.for);
  const forAfter = calculateModifier(after.for);
  const desMod = calculateModifier(before.des);
  const usedBefore = attack.attribute === 'for' ? forBefore : Math.max(forBefore, desMod);
  const usedAfter = attack.attribute === 'for' ? forAfter : Math.max(forAfter, desMod);
  const delta = usedAfter - usedBefore;
  return {
    ...attack,
    attribute: attack.attribute === 'finesse' && forAfter > desMod ? 'for' : attack.attribute,
    hitBonus: attack.hitBonus + delta,
    damage: { ...attack.damage, bonus: attack.damage.bonus + delta },
  };
}

function withIntimidation(proficiencies: string | undefined, charisma: number): string {
  const text = proficiencies?.trim() ?? '';
  if (text.toLowerCase().includes(ENDEMONIADO_SKILL.toLowerCase())) return text;
  const bonus = calculateModifier(charisma) + 2;
  const added = `${ENDEMONIADO_SKILL} ${bonus >= 0 ? '+' : ''}${bonus}`;
  return text ? `${text}, ${added}` : added;
}

export function applyEndemoniado(enemy: TemplateEnemy): TemplateEnemy {
  if (!canApplyEndemoniado(enemy)) return enemy;

  const attributes: Attributes = {
    ...enemy.attributes,
    for: enemy.attributes.for + ENDEMONIADO_ATTRIBUTE_BONUS,
    con: enemy.attributes.con + ENDEMONIADO_ATTRIBUTE_BONUS,
    int: Math.min(enemy.attributes.int, ENDEMONIADO_INT_CAP),
  };

  // +2 no modificador de CON em cada dado de vida.
  const conGain = calculateModifier(attributes.con) - calculateModifier(enemy.attributes.con);
  const hitDice = enemy.hitDice && {
    ...enemy.hitDice,
    bonus: enemy.hitDice.bonus + conGain * enemy.hitDice.count,
  };

  const forMod = calculateModifier(attributes.for);
  const bestial: EnemyAttack = {
    name: ENDEMONIADO_BESTIAL_ATTACK.name,
    mode: ENDEMONIADO_BESTIAL_ATTACK.mode,
    attribute: ENDEMONIADO_BESTIAL_ATTACK.attribute,
    hitBonus: forMod + 2,
    reach: ENDEMONIADO_BESTIAL_ATTACK.reach,
    damage: { dice: ENDEMONIADO_BESTIAL_ATTACK.damageDice, bonus: forMod },
    damageType: ENDEMONIADO_BESTIAL_ATTACK.damageType,
  };

  const have = new Set(enemy.abilities.map((ability) => ability.name));
  const suffix = enemy.nameGender === 'f' ? 'Endemoniada' : 'Endemoniado';

  return {
    ...enemy,
    name: `${enemy.name.trim()} ${suffix}`,
    creatureType: withEndemoniadoAlignment(enemy.creatureType),
    attributes,
    hitDice,
    hp: hitDice ? averageHp(hitDice) : enemy.hp,
    attacks: [
      ...enemy.attacks.map((attack) => upgradeAttack(attack, enemy.attributes, attributes)),
      bestial,
    ],
    abilities: [
      ...enemy.abilities,
      ...ENDEMONIADO_ABILITIES.filter((ability) => !have.has(ability.name)),
    ],
    conditionImmunities: [...new Set([...enemy.conditionImmunities, ...ENDEMONIADO_IMMUNITIES])],
    proficiencies: withIntimidation(enemy.proficiencies, attributes.car),
    endemoniado: true,
  };
}
