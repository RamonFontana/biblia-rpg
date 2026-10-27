// O cartão "Descanso Curto", igual nas duas telas: o que cada papel vê e o que o Mestre manda
// (ADR 0006). A camada de dados é simulada.
// Termos: CONTEXT.md (Descanso Curto).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const data = vi.hoisted(() => ({
  openShortRest: vi.fn(),
  closeShortRest: vi.fn(),
  requestShortRest: vi.fn(),
  withdrawShortRestRequest: vi.fn(),
  finishShortRest: vi.fn(),
  refuseShortRestRequests: vi.fn(),
}));
vi.mock('@/data-access/sessions', () => data);

vi.mock('@/data-access/characters', () => ({ spendHitDie: vi.fn() }));

import { ShortRestCard } from './ShortRestCard';
import type { SpenderCharacter } from './HitDiceSpender';

import type { RestPlayer, ShortRestSession } from '@/domain/shortRest';

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
  data.requestShortRest.mockReset().mockResolvedValue(false);
  data.withdrawShortRestRequest.mockReset().mockResolvedValue(undefined);
  data.finishShortRest.mockReset().mockResolvedValue(false);
  data.refuseShortRestRequests.mockReset().mockResolvedValue(undefined);
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

describe('ShortRestCard: Pedido de Descanso e "Terminei"', () => {
  const players: RestPlayer[] = [
    { id: 'p1', name: 'Eliabe' },
    { id: 'p2', name: 'Rute' },
    { id: 'p3', name: 'Noé' },
    { id: 'p4', name: 'Caleb', is_dead: true },
  ];

  const renderRest = (
    role: 'master' | 'player',
    session: Partial<ShortRestSession> = {},
    myCharacterId?: string,
    hasActiveCombat = false,
  ) =>
    render(
      <ShortRestCard
        role={role}
        sessionId="s1"
        session={{ ...closed, ...session }}
        hasActiveCombat={hasActiveCombat}
        players={players}
        myCharacterId={myCharacterId}
      />,
    );

  it('fechado: mostra quantos pediram e quem (o Morto não conta no total)', () => {
    renderRest('master', { short_rest_requested: ['p1', 'p3'] });
    expect(screen.getByText('2 de 3 pediram (Eliabe, Noé)')).toBeInTheDocument();
  });

  it('o jogador vê que o Mestre recusou o pedido', () => {
    renderRest('player', { short_rest_refused_at: '2026-10-28T12:00:00Z' }, 'p2');
    expect(screen.getByText('O Mestre recusou o pedido de descanso.')).toBeInTheDocument();
  });

  it('sem recusa o aviso não aparece', () => {
    renderRest('player', {}, 'p2');
    expect(screen.queryByText('O Mestre recusou o pedido de descanso.')).toBeNull();
  });

  it('com o descanso aberto o aviso de recusa some', () => {
    renderRest(
      'player',
      {
        short_rest_id: 'r1',
        short_rest_opened_by: 'master',
        short_rest_refused_at: '2026-10-28T12:00:00Z',
      },
      'p2',
    );
    expect(screen.queryByText('O Mestre recusou o pedido de descanso.')).toBeNull();
  });

  it('o Mestre não vê o aviso que é dirigido aos jogadores', () => {
    renderRest('master', { short_rest_refused_at: '2026-10-28T12:00:00Z' });
    expect(screen.queryByText('O Mestre recusou o pedido de descanso.')).toBeNull();
  });

  it('o jogador pede o descanso pelo próprio personagem', async () => {
    renderRest('player', {}, 'p2');
    fireEvent.click(screen.getByRole('button', { name: 'Pedir Descanso Curto' }));
    await waitFor(() => expect(data.requestShortRest).toHaveBeenCalledWith('s1', 'p2'));
  });

  it('depois de pedir, o botão vira "Retirar pedido" e retira', async () => {
    renderRest('player', { short_rest_requested: ['p2'] }, 'p2');
    expect(screen.queryByRole('button', { name: 'Pedir Descanso Curto' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retirar pedido' }));
    await waitFor(() => expect(data.withdrawShortRestRequest).toHaveBeenCalledWith('s1', 'p2'));
  });

  it('o jogador com combate em andamento não pede e vê o motivo', () => {
    renderRest('player', {}, 'p2', true);
    expect(screen.queryByRole('button', { name: 'Pedir Descanso Curto' })).toBeNull();
    expect(screen.getByText('Indisponível: combate em andamento.')).toBeInTheDocument();
  });

  it('o jogador sem Descanso Curto restante não pede e vê o motivo', () => {
    renderRest('player', { short_rests_today: 2 }, 'p2');
    expect(screen.queryByRole('button', { name: 'Pedir Descanso Curto' })).toBeNull();
    expect(screen.getByText('Indisponível: sem Descanso Curto restante hoje.')).toBeInTheDocument();
  });

  it('o jogador com personagem Morto não vê o botão de pedir', () => {
    renderRest('player', {}, 'p4');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('mostra o erro do banco quando o pedido falha', async () => {
    data.requestShortRest.mockRejectedValue(new Error('falhou'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderRest('player', {}, 'p2');
    fireEvent.click(screen.getByRole('button', { name: 'Pedir Descanso Curto' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível pedir');
  });

  it('o Mestre recusa o pedido quando há pedidos', async () => {
    renderRest('master', { short_rest_requested: ['p1'] });
    fireEvent.click(screen.getByRole('button', { name: 'Recusar pedido' }));
    await waitFor(() => expect(data.refuseShortRestRequests).toHaveBeenCalledWith('s1'));
  });

  it('o Mestre não vê "Recusar pedido" sem nenhum pedido', () => {
    renderRest('master');
    expect(screen.queryByRole('button', { name: 'Recusar pedido' })).toBeNull();
  });

  it('o Mestre continua abrindo mesmo com pedidos pendentes', async () => {
    renderRest('master', { short_rest_requested: ['p1'] });
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Descanso Curto' }));
    await waitFor(() => expect(data.openShortRest).toHaveBeenCalledWith('s1'));
  });

  it('aberto: mostra quem abriu e quem já terminou', () => {
    renderRest('master', { ...open('group'), short_rest_finished: ['p2'] });
    expect(screen.getByText('Aberto a pedido do grupo')).toBeInTheDocument();
    expect(screen.getByText('1 de 3 terminaram (Rute)')).toBeInTheDocument();
  });

  it('aberto: o jogador marca "Terminei" pelo próprio personagem', async () => {
    renderRest('player', open('master'), 'p1');
    fireEvent.click(screen.getByRole('button', { name: 'Terminei' }));
    await waitFor(() => expect(data.finishShortRest).toHaveBeenCalledWith('s1', 'p1'));
  });

  it('aberto: quem já terminou vê que terminou e não marca de novo', () => {
    renderRest('player', { ...open('master'), short_rest_finished: ['p1'] }, 'p1');
    expect(screen.queryByRole('button', { name: 'Terminei' })).toBeNull();
    expect(screen.getByText('Você terminou.')).toBeInTheDocument();
  });

  it('aberto: o Mestre não vê "Terminei", e sim "Encerrar descanso"', () => {
    renderRest('master', open('master'));
    expect(screen.queryByRole('button', { name: 'Terminei' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Encerrar descanso' })).toBeInTheDocument();
  });

  it('aberto: o resumo de pedidos não aparece', () => {
    renderRest('master', open('master'));
    expect(screen.queryByText(/pediram/)).toBeNull();
  });

  it('bloqueado sem pedidos: só o motivo, sem o resumo de pedidos', () => {
    renderRest('master', {}, undefined, true);
    expect(screen.queryByText(/pediram/)).toBeNull();
  });

  it('bloqueado com pedidos antigos: o Mestre vê o resumo e ainda pode recusar', async () => {
    renderRest('master', { short_rest_requested: ['p1'] }, undefined, true);
    expect(screen.getByText('Indisponível: combate em andamento.')).toBeInTheDocument();
    expect(screen.getByText('1 de 3 pediram (Eliabe)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Recusar pedido' }));
    await waitFor(() => expect(data.refuseShortRestRequests).toHaveBeenCalledWith('s1'));
  });
});
