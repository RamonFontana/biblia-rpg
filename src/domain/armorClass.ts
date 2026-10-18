// CA (Classe de Armadura): uma fórmula só, para a ficha, o cartão de slot e o inventário.
// Sem armadura, 10 + DES. Armadura leve soma a DES inteira, média até +2, pesada nenhuma. Escudo
// dá +2. Armadura e escudo ganham +1 por nível de Qualidade acima de 1 (ADR 0002). Elmo não dá CA:
// só Resistência a Condição. Termos: CONTEXT.md (CA, Elmo, Qualidade).
import { ITEMS_DB } from '@/content/items';
import type { ContentItem } from '@/content/schemas';

export const UNARMORED_AC = 10;
export const MEDIUM_ARMOR_DEX_CAP = 2;

const ITEM_BY_SLUG = new Map(ITEMS_DB.map((item) => [item.id, item]));

/** Como a DES entra na CA: inteira (leve), até +2 (média) ou nenhuma (pesada). */
export type DexRule = 'full' | 'max2' | 'none';

export interface EquippedItemRef {
  /** Slug do item em src/content/items.ts (`items.slug` no banco). */
  slug?: string | null;
  /** Qualidade (`character_items.level`); ausente vale 1. */
  level?: number | null;
}

export type ItemArmorClass =
  { kind: 'armor'; base: number; dexRule: DexRule } | { kind: 'shield'; bonus: number };

const DEX_RULE_BY_CATEGORY: Partial<Record<ContentItem['category'], DexRule>> = {
  Leve: 'full',
  Sagrada: 'full',
  Média: 'max2',
  Pesada: 'none',
};

const qualityBonus = (level: number | null | undefined) => Math.max(0, (level ?? 1) - 1);

/** O que o item soma à CA, ou null se não dá CA (elmo, arma, consumível, slug desconhecido). */
export function getItemArmorClass(ref: EquippedItemRef): ItemArmorClass | null {
  const item = ref.slug ? ITEM_BY_SLUG.get(ref.slug) : undefined;
  if (!item || item.armorClass === undefined) return null;

  if (item.type === 'Escudo') {
    return { kind: 'shield', bonus: item.armorClass + qualityBonus(ref.level) };
  }
  if (item.type === 'Armadura' && item.slot !== 'head') {
    const dexRule = DEX_RULE_BY_CATEGORY[item.category];
    if (!dexRule) return null;
    return { kind: 'armor', base: item.armorClass + qualityBonus(ref.level), dexRule };
  }
  return null;
}

function dexContribution(rule: DexRule, dexModifier: number): number {
  if (rule === 'full') return dexModifier;
  if (rule === 'max2') return Math.min(dexModifier, MEDIUM_ARMOR_DEX_CAP);
  return 0;
}

export interface ArmorClassInput {
  dexModifier: number;
  /** Item no slot do corpo. Só conta se for armadura. */
  body?: EquippedItemRef | null;
  /** Item na mão secundária. Só conta se for escudo. */
  shield?: EquippedItemRef | null;
}

export interface ArmorClassResult {
  total: number;
  /** 10 + DES: a CA sem armadura nem escudo. */
  base: number;
  /** O que a armadura e o escudo acrescentam à base (pode ser negativo: pesada com DES alta). */
  bonus: number;
}

export function calculateArmorClass(input: ArmorClassInput): ArmorClassResult {
  const base = UNARMORED_AC + input.dexModifier;

  const armor = input.body ? getItemArmorClass(input.body) : null;
  const bodyAc =
    armor?.kind === 'armor' ? armor.base + dexContribution(armor.dexRule, input.dexModifier) : base;

  const shield = input.shield ? getItemArmorClass(input.shield) : null;
  const shieldBonus = shield?.kind === 'shield' ? shield.bonus : 0;

  const total = bodyAc + shieldBonus;
  return { total, base, bonus: total - base };
}

/** Texto da CA do item para telas: "CA 14 + DES (máx +2)", "CA +2"; null se o item não dá CA. */
export function formatItemArmorClass(ref: EquippedItemRef): string | null {
  const ac = getItemArmorClass(ref);
  if (!ac) return null;
  if (ac.kind === 'shield') return `CA +${ac.bonus}`;
  if (ac.dexRule === 'full') return `CA ${ac.base} + DES`;
  if (ac.dexRule === 'max2') return `CA ${ac.base} + DES (máx +${MEDIUM_ARMOR_DEX_CAP})`;
  return `CA ${ac.base}`;
}
