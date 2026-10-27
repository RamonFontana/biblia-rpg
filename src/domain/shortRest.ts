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
}

export interface ShortRestState {
  isOpen: boolean;
  openedBy: ShortRestOpenedBy | null;
  restsLeft: number;
  block: ShortRestBlock | null;
}

/** O que a sessão grava ao fechar o Descanso Curto: nada aberto, nenhum pedido, ninguém terminou. */
export const CLOSED_SHORT_REST = {
  short_rest_id: null,
  short_rest_opened_by: null,
  short_rest_requested: [] as string[],
  short_rest_finished: [] as string[],
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
