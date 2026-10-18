// Avisos ao equipar armadura ou escudo. Equipar sem proficiência ou sem a FOR exigida é permitido;
// o aviso só informa. Termos: CONTEXT.md (Proficiência de armadura).
import { ITEMS_DB } from '@/content/items';
import { VOCATION_PROFICIENCIES } from '@/content/proficiencies';
import type { ItemCategory } from '@/content/schemas';
import { canonicalVocation } from '@/domain/vocation';

export type EquipWarning =
  | { kind: 'proficiency'; message: string }
  | { kind: 'strength'; required: number; message: string };

export interface EquipWarningInput {
  /** Slug do item em src/content/items.ts. */
  slug: string | null | undefined;
  vocation?: string | null;
  /** Valor do atributo FOR da ficha, quando conhecido. */
  strength?: number | null;
}

const ITEM_BY_SLUG = new Map(ITEMS_DB.map((item) => [item.id, item]));

function proficiencyMessage(category: ItemCategory): string {
  if (category === 'Escudo') return 'Sem proficiência em escudo';
  if (category === 'Sagrada') return 'Armadura exclusiva de Sacerdote e Sábio';
  return `Sem proficiência em armadura ${category.toLowerCase()}`;
}

export function getEquipWarnings(input: EquipWarningInput): EquipWarning[] {
  const item = input.slug ? ITEM_BY_SLUG.get(input.slug) : undefined;
  if (!item || (item.type !== 'Armadura' && item.type !== 'Escudo')) return [];

  const warnings: EquipWarning[] = [];

  // Sem Vocação conhecida (inimigo, NPC sem ficha) não há como julgar a proficiência.
  const proficiencies = input.vocation
    ? VOCATION_PROFICIENCIES[canonicalVocation(input.vocation)]
    : undefined;
  if (proficiencies && !proficiencies.includes(item.category)) {
    warnings.push({ kind: 'proficiency', message: proficiencyMessage(item.category) });
  }

  const required = item.requiresStrength;
  const strength = input.strength;
  if (required !== undefined && typeof strength === 'number' && strength < required) {
    warnings.push({
      kind: 'strength',
      required,
      message: `Requer FOR ${required} (você tem ${strength})`,
    });
  }

  return warnings;
}
