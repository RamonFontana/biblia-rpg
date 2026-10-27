// O cartão "Descanso Curto", igual nas duas telas: o que cada papel vê e o que o Mestre manda
// (ADR 0006). A camada de dados é simulada.
// Termos: CONTEXT.md (Descanso Curto).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const data = vi.hoisted(() => ({
  openShortRest: vi.fn(),
  closeShortRest: vi.fn(),
}));
vi.mock('@/data-access/sessions', () => data);

vi.mock('@/data-access/characters', () => ({ spendHitDie: vi.fn() }));

import { ShortRestCard } from './ShortRestCard';
import type { SpenderCharacter } from './HitDiceSpender';

import type { ShortRestSession } from '@/domain/shortRest';

const closed: ShortRestSession = {
  short_rests_today: 0,
  short_rest_id: null,
  short_rest_opened_by: null,
};
const open = (by: 'master' | 'group', taken = 1): ShortRestSession => ({
  short_rests_today: taken,
  short_rest_id: 'r1',
  short_rest_opened_by: by,
});

const renderCard = (role: 'master' | 'player', session = closed, hasActiveCombat = false) =>
  render(
    <ShortRestCard
      role={role}
      sessionId="s1"
      session={session}
      hasActiveCombat={hasActiveCombat}
    />,
  );

beforeEach(() => {
  data.openShortRest.mockReset().mockResolvedValue('r1');
  data.closeShortRest.mockReset().mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('ShortRestCard: Mestre, descanso fechado', () => {
  it('mostra os Descansos Curtos restantes e deixa abrir', () => {
    renderCard('master');
    expect(screen.getByText(/2 restantes hoje/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir Descanso Curto' })).toBeEnabled();
  });

  it('com 1 restante usa o singular', () => {
    renderCard('master', { ...closed, short_rests_today: 1 });
    expect(screen.getByText(/1 restante hoje/)).toBeInTheDocument();
  });

  it('abre o descanso da sessão ao clicar', async () => {
    renderCard('master');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Descanso Curto' }));
    await waitFor(() => expect(data.openShortRest).toHaveBeenCalledWith('s1'));
  });

  it('com combate em andamento o botão fica desabilitado e o motivo está à vista', () => {
    renderCard('master', closed, true);
    expect(screen.getByRole('button', { name: 'Abrir Descanso Curto' })).toBeDisabled();
    expect(screen.getByText('Indisponível: combate em andamento.')).toBeInTheDocument();
  });

  it('sem Descanso Curto restante o botão fica desabilitado com o motivo', () => {
    renderCard('master', { ...closed, short_rests_today: 2 });
    expect(screen.getByRole('button', { name: 'Abrir Descanso Curto' })).toBeDisabled();
    expect(screen.getByText('Indisponível: sem Descanso Curto restante hoje.')).toBeInTheDocument();
  });

  it('mostra o erro do banco quando abrir falha', async () => {
    data.openShortRest.mockRejectedValue(new Error('falhou'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderCard('master');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Descanso Curto' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível abrir');
  });
});

describe('ShortRestCard: descanso aberto', () => {
  it('diz que foi aberto pelo Mestre e deixa o Mestre encerrar', async () => {
    renderCard('master', open('master'));
    expect(screen.getByText('Aberto pelo Mestre')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Abrir Descanso Curto' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar descanso' }));
    await waitFor(() => expect(data.closeShortRest).toHaveBeenCalledWith('s1'));
  });

  it('diz que foi aberto a pedido do grupo', () => {
    renderCard('master', open('group'));
    expect(screen.getByText('Aberto a pedido do grupo')).toBeInTheDocument();
  });

  it('mostra o erro do banco quando encerrar falha', async () => {
    data.closeShortRest.mockRejectedValue(new Error('falhou'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderCard('master', open('master'));
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar descanso' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível encerrar');
  });
});

describe('ShortRestCard: jogador', () => {
  it('fechado: vê os restantes e que quem abre é o Mestre, sem botões', () => {
    renderCard('player');
    expect(screen.getByText(/2 restantes hoje/)).toBeInTheDocument();
    expect(screen.getByText(/Aguardando o Mestre/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('aberto: vê quem abriu e não encerra', () => {
    renderCard('player', open('master'));
    expect(screen.getByText('Aberto pelo Mestre')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('bloqueado por combate: vê o motivo', () => {
    renderCard('player', closed, true);
    expect(screen.getByText('Indisponível: combate em andamento.')).toBeInTheDocument();
  });
});

const spender = (id: string, name: string): SpenderCharacter => ({
  id,
  name,
  tribe: 'Judá',
  vocation: 'Guerreiro',
  level: 2,
  hit_dice_spent: 0,
  attributes: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
  stats: { pv: 20, current_pv: 5, ca: 12, faith: 50, current_faith: 50 },
  skills: {},
});

describe('ShortRestCard: Dados de Vida', () => {
  const renderWith = (
    session: ShortRestSession,
    spenders: SpenderCharacter[],
    role: 'master' | 'player' = 'player',
  ) =>
    render(
      <ShortRestCard
        role={role}
        sessionId="s1"
        session={session}
        hasActiveCombat={false}
        spenders={spenders}
        onSpent={vi.fn()}
      />,
    );

  it('com o descanso aberto mostra o gasto de cada personagem da lista', () => {
    renderWith(open('master'), [spender('c1', 'Eliabe'), spender('c2', 'Rute')], 'master');
    expect(screen.getAllByLabelText(/Resultado do d10/)).toHaveLength(2);
    expect(screen.getByText('Eliabe')).toBeInTheDocument();
    expect(screen.getByText('Rute')).toBeInTheDocument();
  });

  it('o jogador vê só o próprio personagem, sem o nome repetido', () => {
    renderWith(open('master'), [spender('c1', 'Eliabe')]);
    expect(screen.getAllByLabelText(/Resultado do d10/)).toHaveLength(1);
    expect(screen.queryByText('Eliabe')).not.toBeInTheDocument();
  });

  it('com o descanso fechado não mostra o gasto', () => {
    renderWith(closed, [spender('c1', 'Eliabe')]);
    expect(screen.queryByLabelText(/Resultado do d10/)).not.toBeInTheDocument();
  });

  it('sem personagens na lista não mostra nada de Dados de Vida', () => {
    renderWith(open('master'), []);
    expect(screen.queryByLabelText(/Resultado do d/)).not.toBeInTheDocument();
  });
});
