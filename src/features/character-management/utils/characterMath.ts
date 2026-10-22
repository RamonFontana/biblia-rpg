export const SKILLS_LIST = [
  { id: 'acrobacia', name: 'Acrobacia', attribute: 'des' },
  { id: 'atletismo', name: 'Atletismo', attribute: 'for' },
  { id: 'atuacao', name: 'Atuação', attribute: 'car' },
  { id: 'enganacao', name: 'Enganação', attribute: 'car' },
  { id: 'furtividade', name: 'Furtividade', attribute: 'des' },
  { id: 'historia', name: 'História', attribute: 'int' },
  { id: 'intimidacao', name: 'Intimidação', attribute: 'car' },
  { id: 'intuicao', name: 'Intuição', attribute: 'sab' },
  { id: 'investigacao', name: 'Investigação', attribute: 'int' },
  { id: 'lidar_com_animais', name: 'Lidar com Animais', attribute: 'sab' },
  { id: 'medicina', name: 'Medicina', attribute: 'sab' },
  { id: 'natureza', name: 'Natureza', attribute: 'int' },
  { id: 'percepcao', name: 'Percepção', attribute: 'sab' },
  { id: 'persuasao', name: 'Persuasão', attribute: 'car' },
  { id: 'prestidigitacao', name: 'Prestidigitação', attribute: 'des' },
  { id: 'religiao', name: 'Religião', attribute: 'int' },
  { id: 'sobrevivencia', name: 'Sobrevivência', attribute: 'sab' },
] as const;

export const TEST_GROUPS = [
  {
    label: 'Atributos',
    options: ['Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma'],
  },
  {
    label: 'Testes de Resistência',
    options: [
      'Resistência (Força)',
      'Resistência (Destreza)',
      'Resistência (Constituição)',
      'Resistência (Inteligência)',
      'Resistência (Sabedoria)',
      'Resistência (Carisma)',
    ],
  },
  {
    label: 'Perícias',
    options: SKILLS_LIST.map((s) => s.name),
  },
  {
    label: 'Fé',
    options: ['Fé'],
  },
];

export type SkillId = (typeof SKILLS_LIST)[number]['id'];

export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

import { calculateModifier, calculateProficiency } from '@/domain/attributes';
import { getVocationRules } from './rules/vocations';

/**
 * O que o cálculo de um Teste lê da ficha. Os campos `jsonb` chegam como `Json` (lidos do banco) ou
 * já tipados (a ficha carregada), então ficam `unknown` e são lidos pelas funções abaixo.
 */
export interface TestSheet {
  attributes?: unknown;
  vocation?: string | null;
  level?: number | null;
  proficiencies?: unknown;
}

function readAttribute(sheet: TestSheet, key: string): number | undefined {
  return (sheet.attributes as Record<string, number | undefined> | null | undefined)?.[key];
}

type SkillProficiencies = { skill_proficiencies?: string[] } | null | undefined;

function readSkillProficiencies(sheet: TestSheet): string[] {
  return (sheet.proficiencies as SkillProficiencies)?.skill_proficiencies || [];
}

export function getTestModifiers(
  testType: string,
  charData: TestSheet | null | undefined,
): { attrMod: number; profBonus: number } {
  let attrMod = 0;
  let profBonus = 0;
  if (!charData) return { attrMod, profBonus };

  const isSavingThrow = testType.startsWith('Resistência');

  if (isSavingThrow) {
    const attrName = testType.replace('Resistência (', '').replace(')', '');
    const attrNameMap: Record<string, string> = {
      Força: 'for',
      Destreza: 'des',
      Constituição: 'con',
      Inteligência: 'int',
      Sabedoria: 'sab',
      Carisma: 'car',
    };
    const mappedKey = attrNameMap[attrName];
    if (mappedKey) {
      attrMod = calculateModifier(readAttribute(charData, mappedKey));

      const rules = getVocationRules(charData.vocation);
      const savingThrows = rules?.savingThrows || [];
      if (savingThrows.includes(mappedKey)) {
        profBonus = calculateProficiency(charData.level || 1);
      }
    }
    return { attrMod, profBonus };
  }

  const skillInfo = SKILLS_LIST.find((s) => s.name === testType);
  if (skillInfo) {
    attrMod = calculateModifier(readAttribute(charData, skillInfo.attribute));

    if (readSkillProficiencies(charData).includes(skillInfo.id)) {
      profBonus = calculateProficiency(charData.level || 1);
    }
  } else {
    const attrNameMap: Record<string, string> = {
      Força: 'for',
      Destreza: 'des',
      Constituição: 'con',
      Vigor: 'con',
      Inteligência: 'int',
      Sabedoria: 'sab',
      Vontade: 'sab',
      Carisma: 'car',
    };
    const mappedKey = attrNameMap[testType];
    if (mappedKey) {
      attrMod = calculateModifier(readAttribute(charData, mappedKey));
    }
  }

  return { attrMod, profBonus };
}

/**
 * Texto do detalhamento de um resultado. Com `rollValue` (o dado que o jogador rolou, gravado
 * junto do total), mostra o dado real. Sem ele (testes antigos), reconstrói o d20 subtraindo os
 * modificadores de AGORA, que podem diferir dos da época da rolagem.
 */
export function getTestBreakdown(
  testType: string,
  resultValue: number | null,
  charData: TestSheet | null | undefined,
  rollValue?: number | null,
): string {
  if (resultValue === null) return '';
  if (testType === 'Fé') return `1d100 (${resultValue})`;

  const { attrMod, profBonus } = getTestModifiers(testType, charData);
  const hasRoll = rollValue !== undefined && rollValue !== null;
  const totalModifiers = hasRoll ? resultValue - rollValue : attrMod + profBonus;
  const d20 = hasRoll ? rollValue : resultValue - totalModifiers;

  if (hasRoll && totalModifiers === 0) {
    return `1d20 (${d20})`;
  }

  // O bônus gravado pode não bater com a ficha de agora: então mostra o bônus real em bloco.
  if (hasRoll && totalModifiers !== attrMod + profBonus) {
    return `1d20 (${d20}) + Bônus (${totalModifiers}) = ${resultValue}`;
  }

  if (attrMod === 0 && profBonus === 0) {
    return `1d20 (${d20})`;
  }

  return `1d20 (${d20}) + Mod (${attrMod})${profBonus > 0 ? ` + Prof (${profBonus})` : ''} = ${resultValue}`;
}
