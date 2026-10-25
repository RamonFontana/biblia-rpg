// Inspiração: recurso do Estado Inabalável, uma vez por dia da sessão. O dia novo a devolve pela
// comparação com o dia gravado, então nada precisa ser zerado ao avançar o dia.
// Termos: CONTEXT.md (Inspiração, Estado de Fé).
import { getFaithState, type FaithStats } from './faith';

export interface InspirationInput {
  stats: FaithStats | null | undefined;
  /** O dia da sessão em que foi usada (`null` = nunca) e em que sessão. */
  usedDay: number | null | undefined;
  usedSessionId: string | null | undefined;
  /** A sessão e o dia de agora. */
  sessionId: string;
  day: number;
}

/**
 * `usada` se foi gasta hoje nesta sessão (mesmo que a Fé tenha mudado depois), `disponivel` se o
 * personagem é Inabalável e não a gastou hoje, `null` nos demais casos.
 */
export function getInspirationStatus(input: InspirationInput): 'disponivel' | 'usada' | null {
  if (input.usedDay === input.day && input.usedSessionId === input.sessionId) return 'usada';
  return getFaithState(input.stats).id === 'inabalavel' ? 'disponivel' : null;
}
