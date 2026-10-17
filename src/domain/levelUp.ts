// Regras de PV e Aumento de Atributo do level-up, extraídas do LevelUpWizard.
// Decisões: ROADMAP.md, Onda 2 (XP dá lugar ao Marco; aumento de atributo nos níveis 4/8/12/16/19;
// o passo de PV mostra o ganho final, depois da escolha de atributo).
import { calculateModifier } from '@/domain/attributes';

/** Média do dado de vida por Vocação (o doc também permite rolar; o app só usa a média). */
const VOCATION_HP_AVERAGE: Record<string, number> = {
  guerreiro: 6,
  batedor: 5,
  caçador: 6,
  cacador: 6,
  sacerdote: 5,
  sábio: 5,
  sabio: 5,
};

/** Nível máximo do jogo. A trava hoje existe só na tela de encerramento da sessão. */
export const MAX_LEVEL = 20;

/** Nível do personagem: a coluna `level` ou, nas fichas antigas, `stats.level`; senão 1. */
export function getCharacterLevel(character: { level?: number | null; stats?: unknown }): number {
  const statsLevel = (character.stats as { level?: number } | null | undefined)?.level;
  return character.level || statsLevel || 1;
}

/** O Mestre só pode conceder level up a quem ainda não chegou ao nível máximo. */
export function canGrantLevelUp(character: { level?: number | null; stats?: unknown }): boolean {
  return getCharacterLevel(character) < MAX_LEVEL;
}

/** Níveis em que o personagem ganha 2 pontos de atributo. */
export const ASI_LEVELS = [4, 8, 12, 16, 19];

function normalizeVocation(vocation: string) {
  return vocation.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function getHpAverage(vocation: string | null | undefined): number {
  return VOCATION_HP_AVERAGE[normalizeVocation(vocation || '')] || 5;
}

export type LevelUpStep = 'hp' | 'tribe' | 'vocation' | 'asi' | 'summary';

/**
 * Passos do level-up, em ordem. O passo de PV vem depois da escolha de atributo, para mostrar o
 * ganho final (o Aumento de Atributo pode subir a CON e gerar PV retroativo).
 */
export function getLevelUpSteps(options: {
  hasTribeChoice: boolean;
  hasVocationChoice: boolean;
  hasAsi: boolean;
}): LevelUpStep[] {
  const steps: LevelUpStep[] = [];
  if (options.hasTribeChoice) steps.push('tribe');
  if (options.hasVocationChoice) steps.push('vocation');
  if (options.hasAsi) steps.push('asi');
  steps.push('hp', 'summary');
  return steps;
}

export interface LevelUpHpInput {
  vocation: string | null | undefined;
  currentCon: number;
  /** Quantos pontos do aumento de atributo foram para a CON neste nível (0 a 2). */
  conPointsGained: number;
  newLevel: number;
}

export function calculateLevelUpHp({
  vocation,
  currentCon,
  conPointsGained,
  newLevel,
}: LevelUpHpInput) {
  const hpAverage = getHpAverage(vocation);
  const conMod = calculateModifier(currentCon);

  // Usa o modificador NOVO de CON e soma o retroativo dos níveis anteriores.
  const newConMod = calculateModifier(currentCon + conPointsGained);
  const finalHpGained = hpAverage + newConMod;
  const retroactiveHpGained = (newConMod - conMod) * (newLevel - 1);
  const totalHpGained = Math.max(1, finalHpGained) + retroactiveHpGained;

  return {
    hpAverage,
    conMod,
    newConMod,
    finalHpGained,
    retroactiveHpGained,
    totalHpGained,
  };
}
