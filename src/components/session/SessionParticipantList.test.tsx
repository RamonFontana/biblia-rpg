// CARACTERIZAÇÃO: a lista de participantes da mesa: o cartão de cada jogador (ocupado, negociando,
// PV, Fé e Condições), a lista de NPCs (ficha, Condições, negociar) e as trocas pendentes. Os
// cartões, o seletor de Condição, a ficha e o menu são stubs. Decisões: ROADMAP.md, Onda 4,
// passo 7e. Termos: CONTEXT.md (Condição, Teste, Troca).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

const h = vi.hoisted(() => ({
  user: { id: 'me' } as { id: string } | null,
  adjustCurrentPv: vi.fn(),
  updateCharacterStats: vi.fn(),
  applyConditionToCharacter: vi.fn(),
  removeConditionFromCharacter: vi.fn(),
}));

vi.mock('@/store/authStore', () => ({ useAuthStore: () => ({ user: h.user }) }));
vi.mock('@/data-access/characters', () => ({ updateCharacterStats: h.updateCharacterStats }));
vi.mock('@/data-access/vitals', () => ({
  characterVitalsService: { adjustCurrentPv: h.adjustCurrentPv },
}));
vi.mock('@/data-access/conditions', () => ({
  applyConditionToCharacter: h.applyConditionToCharacter,
  removeConditionFromCharacter: h.removeConditionFromCharacter,
}));
vi.mock('./PlayerCard', async () => ({
  PlayerCard: (await import('@/test/stubs')).makeStub('PlayerCard', (props) =>
    String((props.user as { user_id: string }).user_id),
  ),
}));
vi.mock('../conditions/ConditionBadge', async () => ({
  ConditionBadge: (await import('@/test/stubs')).makeStub('ConditionBadge', (props) =>
    String(props.conditionId),
  ),
}));
vi.mock('../conditions/ConditionSelector', async () => ({
  ConditionSelector: (await import('@/test/stubs')).makeStub('ConditionSelector'),
}));
vi.mock('../character/CharacterSheetView', async () => ({
  CharacterSheetView: (await import('@/test/stubs')).makeStub('CharacterSheetView'),
}));
vi.mock('./TokenContextMenu', async () => ({
  TokenContextMenu: (await import('@/test/stubs')).makeStub('TokenContextMenu'),
}));
vi.mock('./TradeRequestNotification', async () => ({
  TradeRequestNotification: (await import('@/test/stubs')).makeStub(
    'TradeRequestNotification',
    (props) => String((props.trade as { id: string }).id),
  ),
}));

import { clearStubs, stubProps } from '@/test/stubs';
import type { PresenceState } from '@/data-access/realtime';
import type { SessionNpc } from '@/data-access/sessions';
import type { SessionTest, SessionTestResult } from '@/data-access/sessionTests';
import type { Character } from '@/features/character-management/types';
import type { TradeWithItems } from '@/types/trade';
import { SessionParticipantList } from './SessionParticipantList';

const online = (user_id: string, name = user_id): PresenceState =>
  ({ user_id, name, online_at: '', username: name }) as PresenceState;

const sheet = (id: string, over: Partial<Character> = {}): Character => ({
  id,
  user_id: `owner-${id}`,
  name: `Ficha ${id}`,
  has_participated_in_session: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  stats: { pv: 12, current_pv: 9, ca: 11, faith: 50, current_faith: 40 },
  ...over,
});

const npc = (id: string, over: Partial<SessionNpc> = {}): SessionNpc => ({
  ...sheet(id, { name: `Npc ${id}`, vocation: 'Mercador' }),
  ...over,
});

const trade = (over: Partial<TradeWithItems> = {}): TradeWithItems =>
  ({
    id: 't1',
    status: 'pending',
    type: 'player_trade',
    initiator_character_id: 'x',
    target_character_id: 'pc1',
    target_npc_id: null,
    trade_items: [],
    ...over,
  }) as TradeWithItems;

const test = (over: Partial<SessionTest> = {}): SessionTest =>
  ({ id: 'test1', status: 'active', ...over }) as SessionTest;
const result = (over: Partial<SessionTestResult> = {}): SessionTestResult =>
  ({
    id: 'r1',
    test_id: 'test1',
    player_id: 'u1',
    status: 'pending',
    ...over,
  }) as SessionTestResult;

type Props = Partial<React.ComponentProps<typeof SessionParticipantList>>;
const renderList = (props: Props = {}) =>
  render(<SessionParticipantList onlineUsers={[]} activeTests={[]} testResults={{}} {...props} />);

const card = (id: string) => stubProps('PlayerCard', id)!;
const call = <T extends unknown[]>(fn: unknown, ...args: T) =>
  act(async () => {
    await (fn as (...a: T) => unknown)(...args);
  });

beforeEach(() => {
  h.user = { id: 'me' };
  h.adjustCurrentPv.mockResolvedValue({ pv: 12, current_pv: 7 });
  h.updateCharacterStats.mockResolvedValue(undefined);
  h.applyConditionToCharacter.mockResolvedValue(undefined);
  h.removeConditionFromCharacter.mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  clearStubs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('SessionParticipantList: cabeçalho e Mestre', () => {
  it('conta os participantes online', () => {
    renderList({ onlineUsers: [online('gm'), online('u1')], gmId: 'gm' });
    expect(screen.getByText('Participantes Online (2)')).toBeInTheDocument();
  });

  it('o Mestre aparece à parte, sem ação', () => {
    renderList({ onlineUsers: [online('gm'), online('u1')], gmId: 'gm', isGM: true });
    expect(card('gm')).toMatchObject({ isClickable: false, isSessionGM: true, viewerIsGM: true });
  });

  it('para o jogador, sem ninguém conectado, avisa que não há jogadores', () => {
    renderList({ onlineUsers: [online('gm')], gmId: 'gm' });
    expect(screen.getByText('Nenhum jogador conectado.')).toBeInTheDocument();
  });

  it('para o Mestre, sem jogadores, a seção de personagens some', () => {
    renderList({ onlineUsers: [online('gm')], gmId: 'gm', isGM: true });
    expect(screen.queryByText('Personagens')).toBeNull();
  });
});

describe('SessionParticipantList: o cartão do jogador', () => {
  const players = [{ user_id: 'u1', character: sheet('pc1') }];

  it('entrega o personagem do jogador ao cartão', () => {
    renderList({ onlineUsers: [online('u1')], playerCharacters: players, isGM: true });
    expect(card('u1')).toMatchObject({
      character: { id: 'pc1' },
      isBusy: false,
      isTrading: false,
      isClickable: true,
      viewerIsGM: true,
    });
  });

  it('o jogador com Teste pendente aparece ocupado e sem clique', () => {
    renderList({
      onlineUsers: [online('u1')],
      playerCharacters: players,
      activeTests: [test()],
      testResults: { test1: [result()] },
    });
    expect(card('u1')).toMatchObject({ isBusy: true, isClickable: false });
    expect(card('u1').onClick).toBeUndefined();
  });

  it.each([
    ['Teste já enviado', { status: 'submitted' as const }],
    ['resultado de outro jogador', { player_id: 'u2' }],
  ])('%s não deixa o jogador ocupado', (_name, over) => {
    renderList({
      onlineUsers: [online('u1')],
      playerCharacters: players,
      activeTests: [test()],
      testResults: { test1: [result(over)] },
    });
    expect(card('u1')).toMatchObject({ isBusy: false });
  });

  it('Teste que não está ativo não ocupa o jogador', () => {
    renderList({
      onlineUsers: [online('u1')],
      playerCharacters: players,
      activeTests: [test({ status: 'completed' })],
      testResults: { test1: [result()] },
    });
    expect(card('u1')).toMatchObject({ isBusy: false });
  });

  it.each(['active', 'pending'] as const)('Troca %s deixa o personagem negociando', (status) => {
    renderList({
      onlineUsers: [online('u1')],
      playerCharacters: players,
      activeTrades: [trade({ status, initiator_character_id: 'pc1', target_character_id: 'z' })],
    });
    expect(card('u1')).toMatchObject({ isTrading: true, isClickable: false });
  });

  it('Troca encerrada não deixa o personagem negociando', () => {
    renderList({
      onlineUsers: [online('u1')],
      playerCharacters: players,
      activeTrades: [trade({ status: 'completed', target_character_id: 'pc1' })],
    });
    expect(card('u1')).toMatchObject({ isTrading: false });
  });

  it('negociar e loja só chegam quando o cartão não está bloqueado', () => {
    const onNegotiate = vi.fn();
    const onShop = vi.fn();
    renderList({
      onlineUsers: [online('u1'), online('me')],
      playerCharacters: [...players, { user_id: 'me', character: sheet('mine') }],
      onNegotiate,
      onShop,
    });
    expect(card('u1').onNegotiate).toBe(onNegotiate);
    expect(card('u1').onShop).toBe(onShop);
    // Não negocia consigo mesmo.
    expect(card('me').onNegotiate).toBeUndefined();
  });

  it('o cartão bloqueado não recebe negociar nem loja', () => {
    renderList({
      onlineUsers: [online('u1')],
      playerCharacters: players,
      activeTests: [test()],
      testResults: { test1: [result()] },
      onNegotiate: vi.fn(),
      onShop: vi.fn(),
    });
    expect(card('u1').onNegotiate).toBeUndefined();
    expect(card('u1').onShop).toBeUndefined();
  });

  it('as Condições do cartão vão para onUpdatePlayerData', () => {
    const onUpdatePlayerData = vi.fn();
    renderList({ onlineUsers: [online('u1')], playerCharacters: players, onUpdatePlayerData });
    const conditions = [{ conditionId: 'sangrando', duration: 2 }];
    (card('u1').onUpdateConditions as (id: string, c: unknown) => void)('pc1', conditions);
    expect(onUpdatePlayerData).toHaveBeenCalledWith('pc1', { conditions });
  });

  it('sem onUpdatePlayerData ou sem personagem, o cartão não atualiza Condições', () => {
    renderList({ onlineUsers: [online('u1'), online('u2')], playerCharacters: players });
    expect(card('u1').onUpdateConditions).toBeUndefined();
    expect(card('u2').onUpdateStat).toBeUndefined();
  });
});

describe('SessionParticipantList: PV e Fé do jogador', () => {
  const players = [{ user_id: 'u1', character: sheet('pc1') }];
  const update = (onUpdatePlayerData?: (id: string, data: Partial<Character>) => void) =>
    renderList({ onlineUsers: [online('u1')], playerCharacters: players, onUpdatePlayerData });
  const stat = (key: string, delta: number) => call(card('u1').onUpdateStat, key, delta);

  it('PV: grava pelo serviço e devolve os stats novos', async () => {
    const onUpdatePlayerData = vi.fn();
    update(onUpdatePlayerData);
    await stat('current_pv', -2);
    expect(h.adjustCurrentPv).toHaveBeenCalledWith('pc1', players[0].character.stats, -2);
    expect(onUpdatePlayerData).toHaveBeenCalledWith('pc1', { stats: { pv: 12, current_pv: 7 } });
  });

  it('PV: a falha é registrada e nada é devolvido', async () => {
    h.adjustCurrentPv.mockRejectedValue(new Error('falhou'));
    const onUpdatePlayerData = vi.fn();
    update(onUpdatePlayerData);
    await stat('current_pv', -2);
    expect(console.error).toHaveBeenCalledWith(
      'Erro ao atualizar status do Jogador:',
      expect.any(Error),
    );
    expect(onUpdatePlayerData).not.toHaveBeenCalled();
  });

  it('Fé: soma o delta, grava os stats e devolve os stats novos', async () => {
    const onUpdatePlayerData = vi.fn();
    update(onUpdatePlayerData);
    await stat('current_faith', 5);
    const expected = { ...players[0].character.stats, current_faith: 45 };
    expect(h.updateCharacterStats).toHaveBeenCalledWith('pc1', expected);
    expect(onUpdatePlayerData).toHaveBeenCalledWith('pc1', { stats: expected });
  });

  it('Fé: não passa de 100 nem fica abaixo de 0', async () => {
    update();
    await stat('current_faith', 500);
    expect(h.updateCharacterStats).toHaveBeenLastCalledWith(
      'pc1',
      expect.objectContaining({ current_faith: 100 }),
    );
    await stat('current_faith', -500);
    expect(h.updateCharacterStats).toHaveBeenLastCalledWith(
      'pc1',
      expect.objectContaining({ current_faith: 0 }),
    );
  });

  it('Fé: a falha ao gravar é registrada e nada é devolvido', async () => {
    h.updateCharacterStats.mockRejectedValue(new Error('falhou'));
    const onUpdatePlayerData = vi.fn();
    update(onUpdatePlayerData);
    await stat('current_faith', 5);
    expect(console.error).toHaveBeenCalledWith(
      'Erro ao atualizar status do Jogador:',
      expect.any(Error),
    );
    expect(onUpdatePlayerData).not.toHaveBeenCalled();
  });

  it('sem stats na ficha, não faz nada', async () => {
    const onUpdatePlayerData = vi.fn();
    renderList({
      onlineUsers: [online('u1')],
      playerCharacters: [{ user_id: 'u1', character: sheet('pc1', { stats: undefined }) }],
      onUpdatePlayerData,
    });
    await stat('current_pv', -2);
    await stat('current_faith', 5);
    expect(h.adjustCurrentPv).not.toHaveBeenCalled();
    expect(h.updateCharacterStats).not.toHaveBeenCalled();
    expect(onUpdatePlayerData).not.toHaveBeenCalled();
  });
});

describe('SessionParticipantList: abrir a ficha e o menu', () => {
  const players = [
    { user_id: 'u1', character: sheet('pc1') },
    { user_id: 'me', character: sheet('mine') },
  ];

  it('clicar em outro jogador abre a ficha dele na sessão', () => {
    renderList({
      onlineUsers: [online('u1')],
      playerCharacters: players,
      sessionId: 's1',
      gmId: 'gm',
    });
    act(() => (card('u1').onClick as (id: string) => void)('u1'));
    expect(stubProps('CharacterSheetView')).toMatchObject({ userId: 'u1', sessionId: 's1' });
  });

  it('clicar no próprio cartão abre o menu na posição do clique', () => {
    renderList({
      onlineUsers: [online('me')],
      playerCharacters: players,
      sessionId: 's1',
      gmId: 'gm',
    });
    act(() =>
      (card('me').onClick as (id: string, e: unknown) => void)('me', { clientX: 30, clientY: 40 }),
    );
    expect(stubProps('TokenContextMenu')).toMatchObject({
      userId: 'me',
      sessionId: 's1',
      x: 30,
      y: 40,
    });
    act(() => (stubProps('TokenContextMenu')!.onClose as () => void)());
    expect(document.querySelector('[data-stub="TokenContextMenu"]')).toBeNull();
  });

  it('o próprio cartão sem evento de clique abre a ficha, não o menu', () => {
    renderList({
      onlineUsers: [online('me')],
      playerCharacters: players,
      sessionId: 's1',
      gmId: 'gm',
    });
    act(() => (card('me').onClick as (id: string) => void)('me'));
    expect(stubProps('CharacterSheetView')).toMatchObject({ userId: 'me' });
  });

  it('clicar no Mestre não abre nada', () => {
    renderList({
      onlineUsers: [online('gm'), online('u1')],
      playerCharacters: [{ user_id: 'gm', character: sheet('gmchar') }, ...players],
      sessionId: 's1',
      gmId: 'gm',
    });
    act(() => (card('u1').onClick as (id: string) => void)('gm'));
    expect(document.querySelector('[data-stub="CharacterSheetView"]')).toBeNull();
  });

  it('o personagem em Troca não abre a ficha', () => {
    renderList({
      onlineUsers: [online('u1')],
      playerCharacters: players,
      sessionId: 's1',
      gmId: 'gm',
      activeTrades: [trade({ status: 'active', initiator_character_id: 'pc1' })],
    });
    // O cartão bloqueado já não recebe onClick; o handler também recusa quem negocia.
    expect(card('u1').onClick).toBeUndefined();
    expect(document.querySelector('[data-stub="CharacterSheetView"]')).toBeNull();
  });
});

describe('SessionParticipantList: NPCs', () => {
  it('sem NPCs, a seção não aparece', () => {
    renderList();
    expect(screen.queryByText('NPCs')).toBeNull();
  });

  it('o NPC jogável mostra tribo, vocação e nível', () => {
    renderList({
      npcs: [npc('n1', { is_playable: true, tribe: 'Judá', vocation: 'Guerreiro', level: 3 })],
    });
    expect(screen.getByText('Judá • Guerreiro (Nível 3)')).toBeInTheDocument();
  });

  it('o nível do NPC jogável cai para stats.level e depois para 1', () => {
    renderList({
      npcs: [
        npc('n1', {
          is_playable: true,
          tribe: 'Judá',
          vocation: 'Guerreiro',
          level: undefined,
          stats: { pv: 5, ca: 10, faith: 0, level: 4 } as never,
        }),
        npc('n2', { is_playable: true, level: undefined }),
      ],
    });
    expect(screen.getByText('Judá • Guerreiro (Nível 4)')).toBeInTheDocument();
    expect(screen.getByText('Tribo Desconhecida • Mercador (Nível 1)')).toBeInTheDocument();
  });

  it('o NPC jogável sem vocação mostra "Sem Vocação"', () => {
    renderList({ npcs: [npc('n1', { is_playable: true, vocation: undefined })] });
    expect(screen.getByText(/Sem Vocação/)).toBeInTheDocument();
  });

  it('o NPC simples mostra só a vocação', () => {
    renderList({ npcs: [npc('n1', { vocation: 'Estalajadeiro' })] });
    expect(screen.getByText('Estalajadeiro')).toBeInTheDocument();
    expect(screen.queryByText(/Nível/)).toBeNull();
  });

  it('mostra o PV atual e o máximo', () => {
    renderList({ npcs: [npc('n1')] });
    expect(screen.getByText('9/12')).toBeInTheDocument();
  });

  it('sem stats, não mostra o PV', () => {
    renderList({ npcs: [npc('n1', { stats: undefined })] });
    expect(screen.queryByText('♥')).toBeNull();
  });

  it('só o NPC jogável abre a ficha ao clicar', () => {
    renderList({
      sessionId: 's1',
      npcs: [npc('n1', { name: 'Simples' }), npc('n2', { name: 'Jogável', is_playable: true })],
    });
    fireEvent.click(screen.getByText('Simples'));
    expect(document.querySelector('[data-stub="CharacterSheetView"]')).toBeNull();

    fireEvent.click(screen.getByText('Jogável'));
    expect(screen.getByText('Ficha do NPC: Jogável')).toBeInTheDocument();
    expect(stubProps('CharacterSheetView')).toMatchObject({
      characterId: 'n2',
      sessionId: 's1',
      isGM: false,
    });
  });
});

describe('SessionParticipantList: negociar com o NPC', () => {
  it('o jogador negocia e o clique não abre a ficha', () => {
    const onNPCNegotiate = vi.fn();
    const n = npc('n1', { is_playable: true });
    renderList({ npcs: [n], onNPCNegotiate });
    fireEvent.click(screen.getByRole('button', { name: /Negociar/ }));
    expect(onNPCNegotiate).toHaveBeenCalledWith(n);
    expect(document.querySelector('[data-stub="CharacterSheetView"]')).toBeNull();
  });

  it('o Mestre não vê o botão', () => {
    renderList({ isGM: true, npcs: [npc('n1')], onNPCNegotiate: vi.fn() });
    expect(screen.queryByRole('button', { name: /Negociar/ })).toBeNull();
  });

  it('sem onNPCNegotiate não há botão', () => {
    renderList({ npcs: [npc('n1')] });
    expect(screen.queryByRole('button', { name: /Negociar/ })).toBeNull();
  });

  it('o NPC escondido (is_visible falso) não pode ser negociado', () => {
    renderList({ npcs: [npc('n1', { is_visible: false })], onNPCNegotiate: vi.fn() });
    expect(screen.queryByRole('button', { name: /Negociar/ })).toBeNull();
  });

  it('o NPC sem is_visible pode ser negociado', () => {
    renderList({ npcs: [npc('n1', { is_visible: undefined })], onNPCNegotiate: vi.fn() });
    expect(screen.getByRole('button', { name: /Negociar/ })).toBeInTheDocument();
  });
});

describe('SessionParticipantList: Condições do NPC', () => {
  const conditions = [{ conditionId: 'sangrando', duration: 2 }];

  it('o jogador não vê o bloco sem Condições', () => {
    renderList({ npcs: [npc('n1')] });
    expect(document.querySelector('[data-stub="ConditionSelector"]')).toBeNull();
  });

  it('o jogador vê as Condições, só leitura e sem seletor', () => {
    renderList({ npcs: [npc('n1', { conditions })] });
    expect(stubProps('ConditionBadge', 'sangrando')).toMatchObject({
      duration: 2,
      readonly: true,
    });
    expect(stubProps('ConditionBadge', 'sangrando')!.onRemove).toBeUndefined();
    expect(document.querySelector('[data-stub="ConditionSelector"]')).toBeNull();
  });

  it('a duração nula vira indefinida no selo', () => {
    renderList({
      npcs: [npc('n1', { conditions: [{ conditionId: 'sangrando', duration: null }] })],
    });
    expect(stubProps('ConditionBadge', 'sangrando')!.duration).toBeUndefined();
  });

  it('o Mestre sempre vê o seletor, mesmo sem Condições', () => {
    renderList({ isGM: true, npcs: [npc('n1')] });
    expect(stubProps('ConditionSelector')).toBeDefined();
    expect(document.querySelector('[data-stub="ConditionBadge"]')).toBeNull();
  });

  it('o Mestre vê as Condições editáveis', () => {
    renderList({ isGM: true, npcs: [npc('n1', { conditions })] });
    expect(stubProps('ConditionBadge', 'sangrando')).toMatchObject({ readonly: false });
  });

  it('o seletor recebe os níveis de resistência dos itens equipados do NPC', () => {
    renderList({ isGM: true, npcs: [npc('n1')] });
    expect(stubProps('ConditionSelector')!.resistanceLevels).toEqual({});
  });

  it('adicionar: substitui a Condição igual, atualiza a tela e grava', async () => {
    const onUpdateNPCData = vi.fn();
    renderList({
      isGM: true,
      onUpdateNPCData,
      npcs: [npc('n1', { conditions: [{ conditionId: 'sangrando', duration: 1 }] })],
    });
    await call(stubProps('ConditionSelector')!.onAddCondition, 'sangrando', 3);
    const updated = [{ conditionId: 'sangrando', duration: 3 }];
    expect(onUpdateNPCData).toHaveBeenCalledWith('n1', { conditions: updated });
    expect(h.applyConditionToCharacter).toHaveBeenCalledWith(
      'n1',
      [{ conditionId: 'sangrando', duration: 1 }],
      { conditionId: 'sangrando', duration: 3 },
    );
  });

  it('adicionar com duração 0 vira Condição sem duração', async () => {
    const onUpdateNPCData = vi.fn();
    renderList({ isGM: true, onUpdateNPCData, npcs: [npc('n1')] });
    await call(stubProps('ConditionSelector')!.onAddCondition, 'atordoado', 0);
    expect(onUpdateNPCData).toHaveBeenCalledWith('n1', {
      conditions: [{ conditionId: 'atordoado', duration: null }],
    });
    expect(h.applyConditionToCharacter).toHaveBeenCalledWith('n1', [], {
      conditionId: 'atordoado',
      duration: null,
    });
  });

  it('remover: tira a Condição da tela e grava', async () => {
    const onUpdateNPCData = vi.fn();
    renderList({
      isGM: true,
      onUpdateNPCData,
      npcs: [
        npc('n1', {
          conditions: [
            { conditionId: 'sangrando', duration: 2 },
            { conditionId: 'atordoado', duration: 1 },
          ],
        }),
      ],
    });
    await call(stubProps('ConditionBadge', 'sangrando')!.onRemove);
    expect(onUpdateNPCData).toHaveBeenCalledWith('n1', {
      conditions: [{ conditionId: 'atordoado', duration: 1 }],
    });
    expect(h.removeConditionFromCharacter).toHaveBeenCalledWith(
      'n1',
      [
        { conditionId: 'sangrando', duration: 2 },
        { conditionId: 'atordoado', duration: 1 },
      ],
      'sangrando',
    );
  });

  it('sem onUpdateNPCData, ainda grava no banco', async () => {
    renderList({ isGM: true, npcs: [npc('n1')] });
    await call(stubProps('ConditionSelector')!.onAddCondition, 'sangrando', 2);
    expect(h.applyConditionToCharacter).toHaveBeenCalledTimes(1);
  });
});

describe('SessionParticipantList: trocas pendentes', () => {
  const players = [{ user_id: 'me', character: sheet('pc1') }];
  const notice = (id: string) => stubProps('TradeRequestNotification', id);

  it('o jogador alvo vê o pedido da Troca com outro jogador', () => {
    renderList({ playerCharacters: players, activeTrades: [trade()] });
    expect(notice('t1')).toMatchObject({ trade: { id: 't1' } });
  });

  it('quem não é o alvo não vê o pedido', () => {
    h.user = { id: 'outro' };
    renderList({ playerCharacters: players, activeTrades: [trade()] });
    expect(notice('t1')).toBeUndefined();
  });

  it('Troca que não está pendente não gera pedido', () => {
    renderList({ playerCharacters: players, activeTrades: [trade({ status: 'active' })] });
    expect(notice('t1')).toBeUndefined();
  });

  it('o Mestre vê o pedido de Troca com NPC, com o nome do NPC', () => {
    renderList({
      isGM: true,
      npcs: [npc('n1', { name: 'Zacarias' })],
      activeTrades: [trade({ id: 't2', type: 'npc_trade', target_npc_id: 'n1' })],
    });
    expect(notice('t2')).toMatchObject({ npcName: 'Zacarias' });
  });

  it('o nome do NPC também vem do personagem alvo quando não há target_npc_id', () => {
    renderList({
      isGM: true,
      npcs: [npc('n1', { name: 'Zacarias' })],
      activeTrades: [trade({ id: 't2', type: 'npc_trade', target_character_id: 'n1' })],
    });
    expect(notice('t2')).toMatchObject({ npcName: 'Zacarias' });
  });

  it('o jogador não vê pedido de Troca com NPC', () => {
    renderList({ activeTrades: [trade({ id: 't2', type: 'npc_trade' })] });
    expect(notice('t2')).toBeUndefined();
  });

  it('aceitar e recusar chegam ao pai com o id da Troca', () => {
    const onAcceptTrade = vi.fn();
    const onRejectTrade = vi.fn();
    renderList({
      playerCharacters: players,
      activeTrades: [trade()],
      onAcceptTrade,
      onRejectTrade,
    });
    (notice('t1')!.onAccept as (id: string) => void)('t1');
    (notice('t1')!.onReject as (id: string) => void)('t1');
    expect(onAcceptTrade).toHaveBeenCalledWith('t1');
    expect(onRejectTrade).toHaveBeenCalledWith('t1');
  });
});
