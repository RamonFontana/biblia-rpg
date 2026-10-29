// A Barra de Status do jogador: o que ele precisa ver o tempo todo (PV, Fé e Estado de Fé,
// Condições com rodadas, Inspiração, turno, dia e período). Termos: CONTEXT.md (Barra de Status,
// Estado de Fé, Inspiração).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const h = vi.hoisted(() => ({ markInspirationUsed: vi.fn() }));
vi.mock('@/data-access/characters', () => ({ markInspirationUsed: h.markInspirationUsed }));

import type { Character } from '@/features/character-management/types';
import { PlayerStatusBar } from './PlayerStatusBar';

const character = (over: Record<string, unknown> = {}): Character =>
  ({
    id: 'c1',
    name: 'Eliabe',
    stats: { pv: 18, current_pv: 12, current_faith: 50, faith: 50 },
    conditions: [],
    inspiration_used_day: null,
    inspiration_session_id: null,
    ...over,
  }) as unknown as Character;

const onOpenSheet = vi.fn();
const onInspirationUsed = vi.fn();

const show = (over: Partial<Parameters<typeof PlayerStatusBar>[0]> = {}) =>
  render(
    <PlayerStatusBar
      character={character()}
      sessionId="s1"
      day={2}
      period="Manhã"
      turn={null}
      onOpenSheet={onOpenSheet}
      onInspirationUsed={onInspirationUsed}
      {...over}
    />,
  );

beforeEach(() => {
  h.markInspirationUsed.mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  onOpenSheet.mockReset();
  onInspirationUsed.mockReset();
});

describe('PlayerStatusBar', () => {
  it('mostra o nome e o PV em barra e em número', () => {
    show();
    expect(screen.getByText('Eliabe')).toBeInTheDocument();
    expect(screen.getByText('12/18')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: 'PV' });
    expect(bar).toHaveAttribute('aria-valuenow', '12');
    expect(bar).toHaveAttribute('aria-valuemax', '18');
  });

  it('o número do PV troca na hora, sem contar (vale também com "reduzir movimento")', () => {
    const { rerender } = show();
    rerender(
      <PlayerStatusBar
        character={character({ stats: { pv: 18, current_pv: 7, current_faith: 50, faith: 50 } })}
        sessionId="s1"
        day={2}
        period="Manhã"
        turn={null}
        onOpenSheet={onOpenSheet}
        onInspirationUsed={onInspirationUsed}
      />,
    );
    expect(screen.getByText('7/18')).toBeInTheDocument();
  });

  it('mostra a Fé Atual com o selo do Estado de Fé', () => {
    show();
    expect(screen.getByText('Fé 50')).toBeInTheDocument();
    expect(screen.getByText('Comum')).toBeInTheDocument();
  });

  it('o Estado muda com a Fé', () => {
    show({
      character: character({
        stats: { pv: 18, current_pv: 12, current_faith: 74, faith: 50 },
      }),
    });
    expect(screen.getByText('Inabalável')).toBeInTheDocument();
  });

  it('lista as Condições com as rodadas que faltam; sem duração fica sem número', () => {
    show({
      character: character({
        conditions: [
          { conditionId: 'amedrontado', duration: 3 },
          { conditionId: 'envenenado', duration: null },
        ],
      }),
    });
    const list = screen.getByRole('list', { name: 'Condições' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(/Amedrontado/);
    expect(items[0]).toHaveTextContent('3');
    expect(items[1]).toHaveTextContent(/Envenenado/);
    expect(items[1]).not.toHaveTextContent(/\d/);
  });

  it('sem Condições, não desenha a lista', () => {
    show();
    expect(screen.queryByRole('list', { name: 'Condições' })).not.toBeInTheDocument();
  });

  it('o Inabalável com a Inspiração do dia a usa com um toque', async () => {
    show({
      character: character({
        stats: { pv: 18, current_pv: 12, current_faith: 74, faith: 50 },
      }),
    });
    fireEvent.click(screen.getByRole('button', { name: 'Usei a Inspiração' }));
    await waitFor(() => expect(h.markInspirationUsed).toHaveBeenCalledWith('c1', 's1', 2));
    await waitFor(() =>
      expect(onInspirationUsed).toHaveBeenCalledWith({
        inspiration_used_day: 2,
        inspiration_session_id: 's1',
      }),
    );
  });

  it('quem não é Inabalável não vê a Inspiração', () => {
    show();
    expect(screen.queryByText(/Inspiração/)).not.toBeInTheDocument();
  });

  it('fora do combate não há selo de turno', () => {
    show({ turn: null });
    expect(screen.queryByText(/turno/i)).not.toBeInTheDocument();
  });

  it('no combate, o selo diz se é o seu turno', () => {
    show({ turn: { isMine: true, name: 'Eliabe' } });
    expect(screen.getByText('Seu turno')).toBeInTheDocument();
  });

  it('no combate, fora do seu turno o selo diz de quem é', () => {
    show({ turn: { isMine: false, name: 'Filisteu' } });
    expect(screen.getByText('Turno: Filisteu')).toBeInTheDocument();
    expect(screen.queryByText('Seu turno')).not.toBeInTheDocument();
  });

  it('mostra o dia e o período', () => {
    show({ day: 3, period: 'Tarde' });
    expect(screen.getByText('Dia 3 · Tarde')).toBeInTheDocument();
  });

  it('tocar no personagem abre a Ficha', () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir a Ficha de Eliabe' }));
    expect(onOpenSheet).toHaveBeenCalledTimes(1);
  });

  it('sem ficha na sessão, mostra só o dia e o período', () => {
    show({ character: undefined });
    expect(screen.getByText('Dia 2 · Manhã')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Abrir a Ficha/ })).not.toBeInTheDocument();
  });
});
