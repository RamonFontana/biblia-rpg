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

export function calculateModifier(attributeValue: number | undefined | null): number {
  if (attributeValue === undefined || attributeValue === null) return 0;
  return Math.floor((attributeValue - 10) / 2);
}

export function calculateProficiency(level: number = 1): number {
  return Math.max(2, Math.floor((level - 1) / 4) + 2);
}

export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

import { getVocationRules } from './rules/vocations';

export function getTestModifiers(
  testType: string,
  charData: any,
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
      const attrValue = (charData.attributes as any)?.[mappedKey];
      attrMod = calculateModifier(attrValue);

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
    const attrValue = (charData.attributes as any)?.[skillInfo.attribute];
    attrMod = calculateModifier(attrValue);

    const proficiencies = (charData.proficiencies as any)?.skill_proficiencies || [];
    if (proficiencies.includes(skillInfo.id)) {
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
      const attrValue = (charData.attributes as any)?.[mappedKey];
      attrMod = calculateModifier(attrValue);
    }
  }

  return { attrMod, profBonus };
}

export function getTestBreakdown(
  testType: string,
  resultValue: number | null,
  charData: any,
): string {
  if (resultValue === null) return '';
  if (testType === 'Fé') return `1d100 (${resultValue})`;

  const { attrMod, profBonus } = getTestModifiers(testType, charData);
  const totalModifiers = attrMod + profBonus;
  const d20 = resultValue - totalModifiers;

  if (attrMod === 0 && profBonus === 0) {
    return `1d20 (${d20})`;
  }

  return `1d20 (${d20}) + Mod (${attrMod})${profBonus > 0 ? ` + Prof (${profBonus})` : ''} = ${resultValue}`;
}
