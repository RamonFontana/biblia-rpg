// O Descanso Curto como momento aberto da sessão (ADR 0006): o estado do cartão, o motivo de
// bloqueio e a regra da recarga das Habilidades, uma vez por descanso.
// Termos: CONTEXT.md (Descanso Curto, Pedido de Descanso).
import { canTakeShortRest, MAX_SHORT_RESTS_PER_DAY } from '@/domain/rest';

export type ShortRestOpenedBy = 'master' | 'group';

/** Por que um Descanso Curto não pode abrir agora. */
export type ShortRestBlock = 'open' | 'combat' | 'none-left';

/** O que o motor lê da sessão. */
export interface ShortRestSession {
  short_rests_today: number | null;
  short_rest_id: string | null;
  short_rest_opened_by: string | null;
  /** Os personagens que pediram o descanso e os que já terminaram (ausentes valem nenhum). */
  short_rest_requested?: string[] | null;
  short_rest_finished?: string[] | null;
  /** Quando o Mestre recusou o Pedido de Descanso; some ao abrir, ao fechar e num novo pedido. */
  short_rest_refused_at?: string | null;
}

export interface ShortRestState {
  isOpen: boolean;
  openedBy: ShortRestOpenedBy | null;
  restsLeft: number;
  block: ShortRestBlock | null;
  /** O Mestre recusou o pedido e o descanso segue fechado. */
  refused: boolean;
}

/** O que a sessão grava ao fechar o Descanso Curto: nada aberto, nenhum pedido, ninguém terminou, nenhuma recusa. */
export const CLOSED_SHORT_REST = {
  short_rest_id: null,
  short_rest_opened_by: null,
  short_rest_requested: [] as string[],
  short_rest_finished: [] as string[],
  short_rest_refused_at: null,
};

export function getShortRestState(
  session: ShortRestSession,
  hasActiveCombat: boolean,
): ShortRestState {
  const taken = session.short_rests_today || 0;
  const isOpen = !!session.short_rest_id;

  let block: ShortRestBlock | null = null;
  if (isOpen) block = 'open';
  else if (hasActiveCombat) block = 'combat';
  else if (!canTakeShortRest(taken)) block = 'none-left';

  return {
    isOpen,
    openedBy: isOpen ? (session.short_rest_opened_by as ShortRestOpenedBy) : null,
    restsLeft: Math.max(0, MAX_SHORT_RESTS_PER_DAY - taken),
    block,
    refused: !isOpen && !!session.short_rest_refused_at,
  };
}

export function shortRestBlockMessage(block: ShortRestBlock): string {
  switch (block) {
    case 'open':
      return 'Já há um Descanso Curto aberto.';
    case 'combat':
      return 'Indisponível: combate em andamento.';
    case 'none-left':
      return 'Indisponível: sem Descanso Curto restante hoje.';
  }
}

/**
 * As Habilidades do Descanso Curto recarregam uma vez por descanso: quando há descanso aberto e a
 * ficha ainda não registrou a identidade dele como a da última recarga.
 */
export function shouldRechargeForShortRest(
  openRestId: string | null | undefined,
  lastRechargeId: string | null | undefined,
): boolean {
  return !!openRestId && openRestId !== lastRechargeId;
}

/** O jogador (o personagem dele) como o Pedido de Descanso o enxerga. */
export interface RestPlayer {
  id: string;
  name: string;
  is_dead?: boolean | null;
}

export interface RestRoster {
  /** Quantos jogadores contam no "todos": os personagens que não estão Mortos. */
  total: number;
  requested: RestPlayer[];
  finished: RestPlayer[];
  allRequested: boolean;
  allFinished: boolean;
}

/**
 * Quem conta no "todos" do Pedido de Descanso e do "Terminei": os jogadores com personagem na
 * sessão que não está Morto. Quem está Morrendo conta (quem pede é o jogador); NPC e inimigo não
 * entram, pois `players` já vem sem eles. O banco (`request_short_rest`) usa a mesma definição.
 */
export function getRestRoster(
  players: RestPlayer[],
  requestedIds: string[],
  finishedIds: string[],
): RestRoster {
  const counting = players.filter((p) => !p.is_dead);
  const requested = counting.filter((p) => requestedIds.includes(p.id));
  const finished = counting.filter((p) => finishedIds.includes(p.id));
  return {
    total: counting.length,
    requested,
    finished,
    allRequested: counting.length > 0 && requested.length === counting.length,
    allFinished: counting.length > 0 && finished.length === counting.length,
  };
}

function withNames(count: number, total: number, verb: string, people: RestPlayer[]): string {
  const base = `${count} de ${total} ${verb}`;
  return people.length > 0 ? `${base} (${people.map((p) => p.name).join(', ')})` : base;
}

/** "2 de 4 pediram (Eliabe, Rute)". */
export function requestSummaryText(roster: RestRoster): string {
  return withNames(roster.requested.length, roster.total, 'pediram', roster.requested);
}

/** "1 de 4 terminaram (Eliabe)". */
export function finishedSummaryText(roster: RestRoster): string {
  return withNames(roster.finished.length, roster.total, 'terminaram', roster.finished);
}
