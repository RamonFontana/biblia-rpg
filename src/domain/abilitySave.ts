// O TR de uma Habilidade (Onda 5, feature 4; ADR 0007): a CD da Habilidade do personagem, o
// modificador do alvo e o resultado de cada alvo depois que o Mestre lança o dado. Os dados da mesa
// são físicos (ADR 0001): o Mestre digita o d20 ou usa a Rolagem Virtual.
// Termos: CONTEXT.md (Habilidade, CD da Habilidade, TR, Vantagem, Desvantagem, Rolagem Virtual).
import { calculateModifier, calculateProficiency } from './attributes';
import type { Rng } from './rng';
import { isRegularTestApproved } from './sessionTests';
import {
  physicalDieReminder,
  pickCountingDie,
  rollTestDice,
  type MasterMark,
  type TestMode,
} from './testMode';

export type SaveAttribute = 'for' | 'des' | 'con' | 'int' | 'sab' | 'car';

const ATTRIBUTE_LABEL: Record<SaveAttribute, string> = {
  for: 'Força',
  des: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  sab: 'Sabedoria',
  car: 'Carisma',
};

export function saveAttributeLabel(attribute: SaveAttribute): string {
  return ATTRIBUTE_LABEL[attribute];
}

/** O tipo do Teste do TR, o mesmo nome dos Testes de sessão ("Resistência (Sabedoria)"). */
export function saveTestType(attribute: SaveAttribute): string {
  return `Resistência (${ATTRIBUTE_LABEL[attribute]})`;
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * O atributo da CD da Habilidade pela Vocação: FOR para Guerreiro, DES para Batedor e SAB para
 * Sacerdote, Sábio e Caçador. Vale também nas Habilidades de Tribo. Vocação desconhecida usa SAB.
 */
export function abilityCdAttribute(vocation: string | null | undefined): SaveAttribute {
  const name = normalize(vocation ?? '');
  if (name.includes('guerreiro')) return 'for';
  if (name.includes('batedor')) return 'des';
  return 'sab';
}

/** O valor de um atributo da ficha (às vezes gravado como texto); ausente ou inválido é `undefined`. */
function attributeValue(attributes: unknown, key: SaveAttribute): number | undefined {
  const raw = (attributes as Record<string, unknown> | null | undefined)?.[key];
  const value = typeof raw === 'string' ? Number(raw) : raw;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** O modificador de um atributo da ficha; atributo ausente ou inválido vale 0. */
export function saveModifierOf(attributes: unknown, key: SaveAttribute): number {
  return calculateModifier(attributeValue(attributes, key));
}

/** A CD da Habilidade do personagem: 8 + Proficiência + modificador do atributo da Vocação. */
export function abilityCd(input: {
  vocation: string | null | undefined;
  level: number | null | undefined;
  attributes: unknown;
}): number {
  const attribute = abilityCdAttribute(input.vocation);
  return 8 + calculateProficiency(input.level ?? 1) + saveModifierOf(input.attributes, attribute);
}

export interface AbilitySaveResult {
  mode: TestMode;
  /** O dado que vale (o maior ou o menor dos dois, com Vantagem ou Desvantagem). */
  natural: number;
  total: number;
  failed: boolean;
}

/**
 * O resultado do TR de um alvo: o d20 que vale mais o modificador contra a CD. É um Teste comum
 * (sem sucesso nem falha automáticos no 20 e no 1). Os dados são os que o Mestre digitou ou a
 * Rolagem Virtual sorteou: um sem marca, dois com Vantagem ou Desvantagem.
 */
export function resolveAbilitySave(input: {
  dice: number[];
  mark: MasterMark;
  modifier: number;
  cd: number;
}): AbilitySaveResult {
  const mode: TestMode = input.mark ?? 'normal';
  const natural = pickCountingDie(mode, 'Resistência', input.dice);
  const total = natural + input.modifier;
  return { mode, natural, total, failed: !isRegularTestApproved(total, input.cd) };
}

/** Rolagem Virtual do TR: um d20, ou dois com Vantagem ou Desvantagem. */
export function rollAbilitySaveDice(mark: MasterMark, rng: Rng): number[] {
  return rollTestDice('Resistência', mark ?? 'normal', rng);
}

/** O lembrete para quem rola dados físicos; `null` sem marca. */
export function saveReminder(mark: MasterMark): string | null {
  return physicalDieReminder('Resistência', mark ?? 'normal');
}
