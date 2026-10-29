// O cartão do Retrato: PV, Condições, Negociar e Atacar. Termos: CONTEXT.md (Retrato).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import type { Retrato } from '@/lib/retratos';
import { RetratoCard } from './RetratoCard';

const retrato = (over: Partial<Retrato> = {}): Retrato => ({
  id: 'c2',
  kind: 'player',
  name: 'Rute',
  pv: 12,
  pvMax: 18,
  down: false,
  conditions: [],
  isMe: false,
  ...over,
});

const onNegotiate = vi.fn();
const onAttack = vi.fn();
const show = (r: Retrato, props: Partial<Parameters<typeof RetratoCard>[0]> = {}) =>
  render(<RetratoCard retrato={r} onNegotiate={onNegotiate} onAttack={onAttack} {...props} />);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('RetratoCard', () => {
  it('mostra o nome, a ficha de PV e a barra', () => {
    show(retrato());
    expect(screen.getByRole('heading', { name: 'Rute' })).toBeInTheDocument();
    expect(screen.getByText('12/18 PV')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'PV' })).toHaveAttribute('aria-valuenow', '12');
  });

  it('sem Condições, diz isso', () => {
    show(retrato());
    expect(screen.getByText('Sem Condições.')).toBeInTheDocument();
  });

  it('lista as Condições com as rodadas', () => {
    show(
      retrato({
        conditions: [
          { conditionId: 'amedrontado', duration: 3 },
          { conditionId: 'envenenado', duration: null },
        ],
      }),
    );
    const list = screen.getByRole('list', { name: 'Condições' });
    const items = within(list).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent(/Amedrontado/);
    expect(items[0]).toHaveTextContent('3');
    expect(items[1]).toHaveTextContent(/Envenenado/);
  });

  it('o outro jogador e o NPC têm Negociar, e ele chama o fluxo de hoje', () => {
    const r = retrato({ userId: 'u2' });
    show(r);
    fireEvent.click(screen.getByRole('button', { name: 'Negociar' }));
    expect(onNegotiate).toHaveBeenCalledWith(r);
  });

  it('o próprio personagem e o inimigo não têm Negociar', () => {
    show(retrato({ isMe: true }));
    expect(screen.queryByRole('button', { name: 'Negociar' })).not.toBeInTheDocument();
    cleanup();
    show(retrato({ kind: 'enemy' }));
    expect(screen.queryByRole('button', { name: 'Negociar' })).not.toBeInTheDocument();
  });

  it('sem o fluxo de negociar (ocupado), o botão não aparece', () => {
    show(retrato(), { onNegotiate: undefined });
    expect(screen.queryByRole('button', { name: 'Negociar' })).not.toBeInTheDocument();
  });

  it('sem combate (attack nulo), não há Atacar', () => {
    show(retrato(), { attack: null });
    expect(screen.queryByRole('button', { name: 'Atacar' })).not.toBeInTheDocument();
  });

  it('com Atacar liberado, ele chama o fluxo de hoje', () => {
    const r = retrato({ kind: 'enemy', participantId: 'p3' });
    show(r, { attack: { enabled: true } });
    fireEvent.click(screen.getByRole('button', { name: 'Atacar' }));
    expect(onAttack).toHaveBeenCalledWith(r);
  });

  it('com Atacar bloqueado, fica desabilitado e diz o motivo', () => {
    show(retrato({ kind: 'enemy' }), { attack: { enabled: false, reason: 'Não é o seu turno' } });
    expect(screen.getByRole('button', { name: 'Atacar' })).toBeDisabled();
    expect(screen.getByText('Não é o seu turno')).toBeInTheDocument();
  });

  it('o próprio personagem não se ataca', () => {
    show(retrato({ isMe: true }), { attack: { enabled: true } });
    expect(screen.queryByRole('button', { name: 'Atacar' })).not.toBeInTheDocument();
  });

  it('quem está a 0 PV diz que está caído', () => {
    show(retrato({ pv: 0, down: true }));
    expect(screen.getByText('Caído')).toBeInTheDocument();
  });
});
