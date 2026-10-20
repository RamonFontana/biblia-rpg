// CARACTERIZAÇÃO: a passagem do tempo da Sessão (Manhã → Tarde → Noite → Manhã do dia seguinte),
// extraída de ActiveSessionPage sem alteração de comportamento.
// Termos: CONTEXT.md (Sessão, Descanso Curto).

export type SessionPeriod = 'Manhã' | 'Tarde' | 'Noite';

export interface SessionClock {
  current_period: string | null;
  current_day: number | null;
}

export interface SessionClockPatch {
  current_period: string;
  current_day: number;
  /** Só na virada do dia: os Descansos Curtos do dia recomeçam. */
  short_rests_today?: 0;
}

/**
 * O relógio depois de avançar um período. Da Noite vai para a Manhã do dia seguinte e zera os
 * Descansos Curtos; período desconhecido (ou vazio) volta à Manhã no mesmo dia. Sem dia gravado,
 * conta a partir do dia 1.
 */
export function advanceSessionClock(clock: SessionClock): SessionClockPatch {
  let nextPeriod = 'Manhã';
  let nextDay = clock.current_day || 1;

  if (clock.current_period === 'Manhã') {
    nextPeriod = 'Tarde';
  } else if (clock.current_period === 'Tarde') {
    nextPeriod = 'Noite';
  } else if (clock.current_period === 'Noite') {
    nextPeriod = 'Manhã';
    nextDay += 1;
  }

  return {
    current_period: nextPeriod,
    current_day: nextDay,
    ...(clock.current_period === 'Noite' ? { short_rests_today: 0 as const } : {}),
  };
}

/** O ícone do período; período desconhecido usa o da Manhã. */
export function getPeriodIcon(period: string): string {
  switch (period) {
    case 'Manhã':
      return '🌅';
    case 'Tarde':
      return '☀️';
    case 'Noite':
      return '🌙';
    default:
      return '🌅';
  }
}

/** A virada de Noite para Manhã é a que abre o aviso do novo dia. */
export function isNewDay(before: string | null | undefined, after: string | null | undefined) {
  return before === 'Noite' && after === 'Manhã';
}
