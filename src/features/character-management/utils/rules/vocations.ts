import { canonicalVocation } from '@/lib/vocation';
import type { SkillId } from '../characterMath';

export interface VocationRules {
  id: string;
  name: string;
  maxSkills: number;
  eligibleSkills: SkillId[];
  savingThrows: string[]; // e.g., 'for', 'des', 'con', 'int', 'sab', 'car'
}

export const VOCATION_RULES: Record<string, VocationRules> = {
  Guerreiro: {
    id: 'Guerreiro',
    name: 'Guerreiro / Soldado',
    maxSkills: 2,
    eligibleSkills: [
      'atletismo',
      'acrobacia',
      'intimidacao',
      'sobrevivencia',
      'lidar_com_animais',
      'percepcao',
    ],
    savingThrows: ['for', 'con'],
  },
  Batedor: {
    id: 'Batedor',
    name: 'Batedor',
    maxSkills: 3,
    eligibleSkills: [
      'furtividade',
      'acrobacia',
      'investigacao',
      'percepcao',
      'enganacao',
      'prestidigitacao',
    ],
    savingThrows: ['des', 'int'],
  },
  Caçador: {
    id: 'Caçador',
    name: 'Caçador / Nômade',
    maxSkills: 3,
    eligibleSkills: [
      'furtividade',
      'sobrevivencia',
      'natureza',
      'percepcao',
      'atletismo',
      'medicina',
    ],
    savingThrows: ['for', 'des'],
  },
  Sacerdote: {
    id: 'Sacerdote',
    name: 'Sacerdote / Sábio',
    maxSkills: 3,
    eligibleSkills: ['religiao', 'historia', 'medicina', 'intuicao', 'persuasao', 'natureza'],
    savingThrows: ['sab', 'car'],
  },
};

export function getVocationRules(vocationName: string | undefined | null): VocationRules | null {
  if (!vocationName) return null;
  return VOCATION_RULES[canonicalVocation(vocationName)] || null;
}
