// A grade de Retratos do Palco: quem está na cena, com o PV à vista, e o delta de dano ou cura
// que flutua do Retrato. Termos: CONTEXT.md (Palco, Retrato).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MotionConfig } from 'motion/react';

import type { Retrato } from '@/lib/retratos';
import { Retratos } from './Retratos';

const retrato = (id: string, over: Partial<Retrato> = {}): Retrato => ({
  id,
  kind: 'player',
  name: `Personagem ${id}`,
  pv: 12,
  pvMax: 18,
  down: false,
  conditions: [],
  isMe: false,
  ...over,
});

const onOpen = vi.fn();
const show = (retratos: Retrato[]) =>
  render(
    <MotionConfig reducedMotion="always">
      <Retratos retratos={retratos} onOpen={onOpen} />
    </MotionConfig>,
  );

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('Retratos', () => {
  it('cada Retrato é um botão com o nome e o PV no nome acessível', () => {
    show([retrato('c1', { name: 'Eliabe' }), retrato('n1', { kind: 'npc', name: 'Mercador' })]);
    expect(screen.getByRole('button', { name: 'Eliabe, 12 de 18 PV' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mercador, 12 de 18 PV' })).toBeInTheDocument();
  });

  it('o Retrato Oculto é marcado como tal, no nome acessível e na tela', () => {
    show([retrato('n2', { kind: 'npc', name: 'Espião', hidden: true })]);
    expect(screen.getByRole('button', { name: 'Espião, 12 de 18 PV, oculto' })).toBeInTheDocument();
    expect(screen.getByText('Oculto')).toBeInTheDocument();
  });

  it('quem está a 0 PV diz "caído"', () => {
    show([retrato('c1', { name: 'Eliabe', pv: 0, down: true })]);
    expect(screen.getByRole('button', { name: 'Eliabe, 0 de 18 PV, caído' })).toBeInTheDocument();
  });

  it('a barra de PV de cada Retrato é uma barra de progresso', () => {
    show([retrato('c1', { name: 'Eliabe' })]);
    const bar = screen.getByRole('progressbar', { name: 'PV de Eliabe' });
    expect(bar).toHaveAttribute('aria-valuenow', '12');
    expect(bar).toHaveAttribute('aria-valuemax', '18');
  });

  it('tocar num Retrato o abre', () => {
    const r = retrato('c1', { name: 'Eliabe' });
    show([r]);
    fireEvent.click(screen.getByRole('button', { name: /^Eliabe/ }));
    expect(onOpen).toHaveBeenCalledWith(r);
  });

  it('o inimigo e o NPC são marcados no nome, mas o Retrato é o mesmo', () => {
    show([retrato('e1', { kind: 'enemy', name: 'Filisteu' })]);
    expect(screen.getByText('Inimigo')).toBeInTheDocument();
  });

  it('a marca d\'água "Mapa" reserva o espaço do mapa, sem atrapalhar a leitura de tela', () => {
    show([retrato('c1')]);
    expect(screen.getByText('Mapa')).toHaveAttribute('aria-hidden', 'true');
  });

  it('sem Retratos, avisa que a cena está vazia', () => {
    show([]);
    expect(screen.getByText('Ninguém na cena ainda.')).toBeInTheDocument();
  });
});

describe('Retratos: o delta de PV', () => {
  const rerenderWith = (utils: ReturnType<typeof show>, pv: number) =>
    utils.rerender(
      <MotionConfig reducedMotion="always">
        <Retratos retratos={[retrato('c1', { name: 'Eliabe', pv })]} onOpen={onOpen} />
      </MotionConfig>,
    );

  it('não mostra nada no primeiro desenho', () => {
    show([retrato('c1')]);
    expect(screen.queryByText(/^[−+]\d/)).not.toBeInTheDocument();
  });

  it('o dano flutua como "−5" e some depois de um instante', () => {
    const utils = show([retrato('c1', { name: 'Eliabe', pv: 12 })]);
    rerenderWith(utils, 7);
    expect(screen.getByText('−5')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByText('−5')).not.toBeInTheDocument();
  });

  it('a cura flutua como "+3"', () => {
    const utils = show([retrato('c1', { name: 'Eliabe', pv: 9 })]);
    rerenderWith(utils, 12);
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('o número do PV no nome acessível já é o novo (não conta devagar)', () => {
    const utils = show([retrato('c1', { name: 'Eliabe', pv: 12 })]);
    rerenderWith(utils, 7);
    expect(screen.getByRole('button', { name: 'Eliabe, 7 de 18 PV' })).toBeInTheDocument();
  });
});

describe('Retratos: o turno', () => {
  it('só o Retrato de quem age agora ganha o anel do turno', () => {
    show([retrato('c1', { name: 'Eliabe' }), retrato('c2', { name: 'Rute' })]);
    expect(screen.queryByTestId('anel-do-turno')).toBeNull();
    cleanup();
    render(
      <MotionConfig reducedMotion="always">
        <Retratos
          retratos={[retrato('c1', { name: 'Eliabe' }), retrato('c2', { name: 'Rute' })]}
          onOpen={onOpen}
          turnId="c1"
        />
      </MotionConfig>,
    );
    expect(screen.getByRole('button', { name: /Eliabe/ })).toHaveAttribute('data-turn', 'true');
    expect(screen.getByRole('button', { name: /Rute/ })).not.toHaveAttribute('data-turn');
    expect(screen.getAllByTestId('anel-do-turno')).toHaveLength(1);
  });

  it('o anel pulsa só em opacidade, sem mover nada (reduced-motion)', () => {
    render(
      <MotionConfig reducedMotion="always">
        <Retratos retratos={[retrato('c1')]} onOpen={onOpen} turnId="c1" />
      </MotionConfig>,
    );
    const ring = screen.getByTestId('anel-do-turno');
    expect(ring.style.transform).toBe('');
    expect(ring).toHaveAttribute('aria-hidden', 'true');
  });
});
