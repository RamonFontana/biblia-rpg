export const SKILLS_LIST = [
  { id: 'acrobacia', name: 'Acrobacia', attribute: 'des' },
  { id: 'arcanismo', name: 'Arcanismo', attribute: 'int' },
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

export type SkillId = typeof SKILLS_LIST[number]['id'];

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
