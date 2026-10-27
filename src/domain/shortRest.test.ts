// O Descanso Curto como momento aberto da sessão (ADR 0006): o estado que o cartão mostra, o motivo
// de bloqueio e a recarga das Habilidades uma vez por descanso.
// Termos: CONTEXT.md (Descanso Curto, Pedido de Descanso).
import { describe, expect, it } from 'vitest';
import {
  CLOSED_SHORT_REST,
  finishedSummaryText,
  getRestRoster,
  getShortRestState,
  requestSummaryText,
  shortRestBlockMessage,
  shouldRechargeForShortRest,
} from '@/domain/shortRest';

const closed = { short_rests_today: 0, short_rest_id: null, short_rest_opened_by: null };

describe('getShortRestState', () => {
  it('sem descanso aberto e sem bloqueio, o Mestre pode abrir e restam 2', () => {
    expect(getShortRestState(closed, false)).toStrictEqual({
      isOpen: false,
      openedBy: null,
      restsLeft: 2,
      block: null,
    });
  });

  it('conta os Descansos Curtos restantes do dia', () => {
    expect(getShortRestState({ ...closed, short_rests_today: 1 }, false).restsLeft).toBe(1);
    expect(getShortRestState({ ...closed, short_rests_today: 2 }, false).restsLeft).toBe(0);
  });

  it('valor ausente do dia vale 0 usados', () => {
    expect(getShortRestState({ ...closed, short_rests_today: null }, false).restsLeft).toBe(2);
  });

  it('com descanso aberto mostra quem abriu e bloqueia um novo', () => {
    const state = getShortRestState(
      { short_rests_today: 1, short_rest_id: 'r1', short_rest_opened_by: 'master' },
      false,
    );
    expect(state).toStrictEqual({ isOpen: true, openedBy: 'master', restsLeft: 1, block: 'open' });
  });

  it('o descanso aberto pelo grupo é reconhecido', () => {
    expect(
      getShortRestState(
        { short_rests_today: 1, short_rest_id: 'r1', short_rest_opened_by: 'group' },
        false,
      ).openedBy,
    ).toBe('group');
  });

  it('combate em andamento bloqueia', () => {
    expect(getShortRestState(closed, true).block).toBe('combat');
  });

  it('sem Descanso Curto restante bloqueia', () => {
    expect(getShortRestState({ ...closed, short_rests_today: 2 }, false).block).toBe('none-left');
  });

  it('com o descanso aberto, o motivo é o descanso aberto, mesmo em combate', () => {
    expect(
      getShortRestState(
        { short_rests_today: 2, short_rest_id: 'r1', short_rest_opened_by: 'master' },
        true,
      ).block,
    ).toBe('open');
  });

  it('combate vem antes de "sem restante"', () => {
    expect(getShortRestState({ ...closed, short_rests_today: 2 }, true).block).toBe('combat');
  });
});

describe('shortRestBlockMessage', () => {
  it('diz por que não dá para abrir ou pedir', () => {
    expect(shortRestBlockMessage('open')).toBe('Já há um Descanso Curto aberto.');
    expect(shortRestBlockMessage('combat')).toBe('Indisponível: combate em andamento.');
    expect(shortRestBlockMessage('none-left')).toBe(
      'Indisponível: sem Descanso Curto restante hoje.',
    );
  });
});

describe('shouldRechargeForShortRest', () => {
  it('recarrega quando há descanso aberto de identidade diferente da última recarga', () => {
    expect(shouldRechargeForShortRest('r2', 'r1')).toBe(true);
    expect(shouldRechargeForShortRest('r1', null)).toBe(true);
    expect(shouldRechargeForShortRest('r1', undefined)).toBe(true);
  });

  it('não recarrega duas vezes no mesmo descanso', () => {
    expect(shouldRechargeForShortRest('r1', 'r1')).toBe(false);
  });

  it('não recarrega sem descanso aberto', () => {
    expect(shouldRechargeForShortRest(null, 'r1')).toBe(false);
    expect(shouldRechargeForShortRest(undefined, null)).toBe(false);
  });
});

describe('CLOSED_SHORT_REST', () => {
  it('é o que a sessão grava ao fechar o descanso: nada aberto, nenhum pedido, ninguém terminou', () => {
    expect(CLOSED_SHORT_REST).toStrictEqual({
      short_rest_id: null,
      short_rest_opened_by: null,
      short_rest_requested: [],
      short_rest_finished: [],
    });
  });
});

describe('getRestRoster: quem conta no "todos" do Pedido de Descanso', () => {
  const eliabe = { id: 'p1', name: 'Eliabe' };
  const rute = { id: 'p2', name: 'Rute' };
  const noe = { id: 'p3', name: 'Noé' };
  const morto = { id: 'p4', name: 'Caleb', is_dead: true };

  it('o personagem Morto não conta', () => {
    expect(getRestRoster([eliabe, rute, morto], [], []).total).toBe(2);
  });

  it('o personagem Morrendo (com PV 0, mas vivo) conta', () => {
    expect(getRestRoster([eliabe, { id: 'p5', name: 'Zilpa', is_dead: false }], [], []).total).toBe(
      2,
    );
  });

  it('lista quem pediu na ordem da mesa, ignorando ids que não são da mesa', () => {
    const roster = getRestRoster([eliabe, rute, noe], ['p3', 'p1', 'fantasma'], []);
    expect(roster.requested.map((p) => p.name)).toStrictEqual(['Eliabe', 'Noé']);
  });

  it('o pedido de quem morreu depois não conta', () => {
    expect(getRestRoster([eliabe, morto], ['p1', 'p4'], []).requested).toHaveLength(1);
  });

  it('todos pediram só quando cada um dos que contam pediu', () => {
    expect(getRestRoster([eliabe, rute], ['p1'], []).allRequested).toBe(false);
    expect(getRestRoster([eliabe, rute], ['p1', 'p2'], []).allRequested).toBe(true);
    expect(getRestRoster([eliabe, rute, morto], ['p1', 'p2'], []).allRequested).toBe(true);
  });

  it('sem nenhum jogador vivo, ninguém "pediu" e ninguém "terminou"', () => {
    const roster = getRestRoster([morto], ['p4'], ['p4']);
    expect(roster.allRequested).toBe(false);
    expect(roster.allFinished).toBe(false);
  });

  it('todos terminaram só quando cada um dos que contam terminou', () => {
    expect(getRestRoster([eliabe, rute], [], ['p2']).allFinished).toBe(false);
    expect(getRestRoster([eliabe, rute], [], ['p1', 'p2']).allFinished).toBe(true);
  });

  it('lista quem terminou', () => {
    expect(getRestRoster([eliabe, rute], [], ['p2']).finished.map((p) => p.name)).toStrictEqual([
      'Rute',
    ]);
  });
});

describe('textos do cartão', () => {
  const eliabe = { id: 'p1', name: 'Eliabe' };
  const rute = { id: 'p2', name: 'Rute' };

  it('o pedido mostra a contagem e os nomes', () => {
    expect(requestSummaryText(getRestRoster([eliabe, rute], ['p1'], []))).toBe(
      '1 de 2 pediram (Eliabe)',
    );
  });

  it('sem pedidos, só a contagem', () => {
    expect(requestSummaryText(getRestRoster([eliabe, rute], [], []))).toBe('0 de 2 pediram');
  });

  it('quem terminou mostra a contagem e os nomes', () => {
    expect(finishedSummaryText(getRestRoster([eliabe, rute], [], ['p1', 'p2']))).toBe(
      '2 de 2 terminaram (Eliabe, Rute)',
    );
    expect(finishedSummaryText(getRestRoster([eliabe, rute], [], []))).toBe('0 de 2 terminaram');
  });
});
