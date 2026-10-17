// CARACTERIZAÇÃO: regras de PV e Aumento de Atributo do level-up, extraídas do LevelUpWizard sem alteração.
// Decisões: ROADMAP.md, Onda 2 (XP dá lugar ao Marco; aumento de atributo nos níveis 4/8/12/16/19).
import { calculateModifier } from './characterMath';

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

/** Níveis em que o personagem ganha 2 pontos de atributo. */
export const ASI_LEVELS = [4, 8, 12, 16, 19];

function normalizeVocation(vocation: string) {
  return vocation.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function getHpAverage(vocation: string | null | undefined): number {
  return VOCATION_HP_AVERAGE[normalizeVocation(vocation || '')] || 5;
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

  // Valor mostrado no passo de PV: usa o modificador ANTIGO de CON.
  const hpGained = Math.max(1, hpAverage + conMod);

  // Valor gravado: usa o modificador NOVO e soma o retroativo dos níveis anteriores.
  const newConMod = calculateModifier(currentCon + conPointsGained);
  const finalHpGained = hpAverage + newConMod;
  const retroactiveHpGained = (newConMod - conMod) * (newLevel - 1);
  const totalHpGained = Math.max(1, finalHpGained) + retroactiveHpGained;

  return {
    hpAverage,
    conMod,
    hpGained,
    newConMod,
    finalHpGained,
    retroactiveHpGained,
    totalHpGained,
  };
}
