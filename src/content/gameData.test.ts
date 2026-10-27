// @vitest-environment node
//
// Gate de validação dos dados do jogo (itens, habilidades, condições).
// Violações já existentes ficam em known-violations.json: a lista só pode diminuir.
// Para remover uma entrada, corrija o dado (com confirmação do autor) e apague a linha.
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { characterSchema } from '@/features/character-creation/schemas/characterSchema';
import { SKILLS_LIST } from '@/features/character-management/utils/characterMath';
import { VOCATION_RULES } from '@/features/character-management/utils/rules/vocations';
import { ABILITIES } from './abilities';
import { CONDITIONS } from './conditions';
import { ITEMS_DB } from './items';
import { KITS_DB } from './kits';
import { abilitySchema, conditionSchema, itemSchema, kitSchema } from './schemas';
import knownViolations from './known-violations.json';

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const DOC_FILES = Object.keys(import.meta.glob('../../docs/{tribos,vocacoes}/*.md'));
const docExists = (relativePath: string) => DOC_FILES.includes(`../../docs/${relativePath}`);

// Constitution: nenhum item concede bônus sobrenatural. Itens que mexem na Fé
// precisam estar nesta lista explícita.
const ITEMS_ALLOWED_TO_AFFECT_FAITH = ['simbolo_proibido'];

// Marcos de progressão das tribos (docs/tribos/README.md).
const TRIBE_MILESTONES = [1, 4, 8, 12, 16, 20];

const LIMITED_USAGE = ['short_rest', 'long_rest', 'combat', 'week', 'campaign'];

function schemaViolations(prefix: string, schema: z.ZodType, value: unknown): string[] {
  const result = schema.safeParse(value);
  if (result.success) return [];
  return result.error.issues.map((issue) => `${prefix}:schema:${issue.path.join('.')}`);
}

function duplicates(values: string[]): string[] {
  return [...new Set(values.filter((v, i) => values.indexOf(v) !== i))];
}

function collectViolations(): string[] {
  const violations: string[] = [];
  const conditionIds = new Set(Object.keys(CONDITIONS));

  // Condições
  for (const [key, condition] of Object.entries(CONDITIONS)) {
    violations.push(...schemaViolations(`condition:${key}`, conditionSchema, condition));
    if (condition.id !== key) violations.push(`condition:${key}:id-differs-from-key`);
  }

  // Itens
  for (const id of duplicates(ITEMS_DB.map((i) => i.id)))
    violations.push(`item:${id}:duplicate-id`);
  // syncInventory.ts procura itens pelo nome, então o nome também é chave.
  for (const name of duplicates(ITEMS_DB.map((i) => i.name)))
    violations.push(`item:${name}:duplicate-name`);

  for (const item of ITEMS_DB) {
    const p = `item:${item.id}`;
    violations.push(...schemaViolations(p, itemSchema, item));

    for (const resistance of item.conditionResistances ?? []) {
      if (!conditionIds.has(resistance)) violations.push(`${p}:unknown-condition:${resistance}`);
    }

    // O texto "Requer For N" e o campo que o aviso de equipar lê têm de concordar.
    const textRequirement = item.description.match(/Requer For (\d+)/i);
    if ((textRequirement ? Number(textRequirement[1]) : undefined) !== item.requiresStrength)
      violations.push(`${p}:requires-strength-differs-from-description`);

    if (item.type === 'Arma' && !item.damage) violations.push(`${p}:weapon-without-damage`);
    if ((item.type === 'Armadura' || item.type === 'Escudo') && item.armorClass === undefined)
      violations.push(`${p}:armor-without-ac`);
    if ((item.type === 'Armadura' || item.type === 'Escudo') && !item.slot)
      violations.push(`${p}:armor-without-slot`);
    if (
      (item.type === 'Consumível' || item.type === 'Utilidade') &&
      (item.damage || item.armorClass)
    )
      violations.push(`${p}:gear-with-combat-stats`);

    if (item.statPenalty) {
      if (item.statPenalty.value > 0) violations.push(`${p}:supernatural-bonus`);
      if (item.statPenalty.stat === 'faith' && !ITEMS_ALLOWED_TO_AFFECT_FAITH.includes(item.id))
        violations.push(`${p}:affects-faith-without-allowlist`);
    }
  }

  // Kits
  const itemSlugs = new Set(ITEMS_DB.map((i) => i.id));
  for (const [vocation, kit] of Object.entries(KITS_DB)) {
    const p = `kit:${vocation}`;
    violations.push(...schemaViolations(p, kitSchema, kit));
    for (const { slug } of kit.items) {
      if (!itemSlugs.has(slug)) violations.push(`${p}:unknown-item:${slug}`);
    }
  }

  // Habilidades
  for (const id of duplicates(ABILITIES.map((a) => a.id)))
    violations.push(`ability:${id}:duplicate-id`);

  const vocationIds = new Set(Object.keys(VOCATION_RULES).map(normalize));

  // Vocações: toda perícia elegível existe na lista de perícias.
  const skillIds = new Set<string>(SKILLS_LIST.map((s) => s.id));
  for (const [name, rules] of Object.entries(VOCATION_RULES)) {
    for (const skillId of rules.eligibleSkills) {
      if (!skillIds.has(skillId)) violations.push(`vocation:${name}:unknown-skill:${skillId}`);
    }
  }

  for (const ability of ABILITIES) {
    const p = `ability:${ability.id}`;
    violations.push(...schemaViolations(p, abilitySchema, ability));

    for (const { conditionId } of ability.combatEffect?.apply ?? []) {
      if (!conditionIds.has(conditionId)) violations.push(`${p}:unknown-condition:${conditionId}`);
    }
    // Passiva não se usa: um efeito de combate nela nunca seria aplicado.
    if (ability.combatEffect && ability.actionType === 'passive')
      violations.push(`${p}:combat-effect-on-passive`);

    const limited = LIMITED_USAGE.includes(ability.usageType);
    if (limited && ability.maxUses === undefined) violations.push(`${p}:limited-without-max-uses`);
    if (!limited && ability.maxUses !== undefined)
      violations.push(`${p}:max-uses-on-${ability.usageType}`);

    if (ability.sourceType === 'tribe') {
      if (!TRIBE_MILESTONES.includes(ability.minLevel))
        violations.push(`${p}:level-${ability.minLevel}-not-a-tribe-milestone`);
    } else if (!vocationIds.has(ability.sourceId)) {
      violations.push(`${p}:unknown-vocation:${ability.sourceId}`);
    }
  }

  // Estrutura de cada tribo e vocação (constitution: 2 passivas no nível 1, caminhos A/B no 4).
  const sources = new Set(ABILITIES.map((a) => `${a.sourceType}:${a.sourceId}`));
  for (const source of sources) {
    const [sourceType, sourceId] = source.split(':');
    const docDir = sourceType === 'tribe' ? 'tribos' : 'vocacoes';
    if (!docExists(`${docDir}/${sourceId}.md`)) violations.push(`${source}:missing-doc`);
    if (sourceType !== 'tribe') continue;

    const own = ABILITIES.filter((a) => a.sourceType === 'tribe' && a.sourceId === sourceId);
    const level1 = own.filter((a) => a.minLevel === 1 && !a.path).length;
    if (level1 !== 2) violations.push(`${source}:has-${level1}-level-1-passives`);
    for (const path of ['A', 'B'] as const) {
      if (!own.some((a) => a.minLevel === 4 && a.path === path))
        violations.push(`${source}:missing-path-${path}-at-level-4`);
    }
  }

  return violations.sort();
}

describe('dados do jogo', () => {
  const actual = collectViolations();
  const known = new Set<string>(knownViolations.violations);

  it('não tem violações novas (fora de known-violations.json)', () => {
    expect(actual.filter((v) => !known.has(v))).toEqual([]);
  });

  it('não tem entradas obsoletas em known-violations.json (apague as já corrigidas)', () => {
    const actualSet = new Set(actual);
    expect([...known].filter((v) => !actualSet.has(v))).toEqual([]);
  });

  it('aplica a Regra de Levi na criação de personagem', () => {
    const base = {
      name: 'Teste',
      tribe: 'Levi',
      attributes: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
      fortress: 'x',
      temptation: 'y',
      coins: 0,
      equipment: [],
      narrative: {},
    };
    const asWarrior = characterSchema.safeParse({ ...base, vocation: 'Guerreiro' });
    expect(asWarrior.success).toBe(false);
    expect(asWarrior.error?.issues.map((i) => i.message)).toContain(
      'A Regra de Levi exige que a vocação seja Sacerdote ou Sábio.',
    );
  });
});
