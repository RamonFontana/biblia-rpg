// A luz do mapa (CONTEXT.md: Ambiente, Luz plena, Penumbra, Escuridão, Fonte de luz; regras-base 6.7).
// Uma Fonte de luz ilumina um raio de Luz plena e, depois dele, uma faixa de Penumbra. A luz é um
// círculo (distância euclidiana entre o centro dos Quadrados), sem paredes. A luz só clareia: nunca
// deixa um lugar mais escuro que o Ambiente.
import { SQUARE_METERS, type Cell } from './grid';

/** O Ambiente de um mapa. */
export type Ambient = 'claro' | 'penumbra' | 'escuridao';
/** O nível de luz num ponto. */
export type LightLevel = 'plena' | 'penumbra' | 'escuridao';

export interface LightSource {
  cell: Cell;
  /** Raio da Luz plena, em metros. */
  brightM: number;
  /** Largura da faixa de Penumbra depois da Luz plena, em metros. */
  dimM: number;
}

const AMBIENTS: readonly string[] = ['claro', 'penumbra', 'escuridao'];

/** De manhã e à tarde a cena é clara; à noite, escura. Período desconhecido vale como Manhã. */
export function ambientForPeriod(period: string | null | undefined): Ambient {
  return period === 'Noite' ? 'escuridao' : 'claro';
}

/** O Ambiente de agora: o que o Mestre fixou no mapa ou, sem isso, o do período. */
export function effectiveAmbient(
  fixed: string | null | undefined,
  period: string | null | undefined,
): Ambient {
  return fixed && AMBIENTS.includes(fixed) ? (fixed as Ambient) : ambientForPeriod(period);
}

const ORDER: Record<LightLevel, number> = { escuridao: 0, penumbra: 1, plena: 2 };
const AMBIENT_LEVEL: Record<Ambient, LightLevel> = {
  claro: 'plena',
  penumbra: 'penumbra',
  escuridao: 'escuridao',
};

const brighter = (a: LightLevel, b: LightLevel): LightLevel => (ORDER[a] >= ORDER[b] ? a : b);

/** O nível de luz no Quadrado: a melhor entre o Ambiente e as Fontes de luz. */
export function lightLevelAt(cell: Cell, ambient: Ambient, sources: LightSource[]): LightLevel {
  let level = AMBIENT_LEVEL[ambient];
  for (const source of sources) {
    const meters =
      Math.hypot(cell.col - source.cell.col, cell.row - source.cell.row) * SQUARE_METERS;
    if (meters <= source.brightM) return 'plena';
    if (meters <= source.brightM + source.dimM) level = brighter(level, 'penumbra');
  }
  return level;
}

/** Em Luz plena ou Penumbra se vê a criatura; na Escuridão, não. */
export function isSeen(level: LightLevel): boolean {
  return level !== 'escuridao';
}
