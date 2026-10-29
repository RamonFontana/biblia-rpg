// CARACTERIZAÇÃO: fixa o que a tela da sessão faz e mostra, com todos os filhos trocados por stubs
// que desenham as props recebidas. Cobre as três visões (Mestre, jogador, espectador), o avanço do
// tempo, as trocas, o fim da sessão e os avisos. Decisões: ROADMAP.md, Onda 4, passo 5b.
// Termos: CONTEXT.md (Mestre, Sessão).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const h = vi.hoisted(() => ({
  user: null as null | {
    id: string;
    email?: string;
    user_metadata?: Record<string, string>;
  },
  session: null as null | Record<string, unknown>,
  sessionListener: undefined as undefined | ((s: Record<string, unknown>) => void),
  unsubscribeSession: vi.fn(),
  combat: {
    activeCombat: null as null | object,
    attacks: [] as unknown[],
    abilityUses: [] as unknown[],
    initSubscriptions: vi.fn(),
    cleanupSubscriptions: vi.fn(),
  },
  tests: { activeTests: [] as unknown[], testResults: {} as Record<string, unknown[]> },
  roster: {
    playerCharacters: [] as unknown[],
    npcs: [] as unknown[],
    enemies: [] as unknown[],
    isLoading: false,
    refresh: vi.fn(),
    updateLocal: vi.fn(),
  },
  trades: { activeTrades: [] as unknown[], refresh: vi.fn(), trading: new Set<string>() },
  presenceArgs: [] as unknown[][],
  getGameSession: vi.fn(),
  updateGameSession: vi.fn(),
  createTrade: vi.fn(),
  acceptTrade: vi.fn(),
  cancelTrade: vi.fn(),
  endSession: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 's1' }),
  useNavigate: () => h.navigate,
}));
vi.mock('@/store/authStore', () => ({ useAuthStore: () => ({ user: h.user }) }));
vi.mock('@/store/combatStore', () => ({ useCombatStore: () => h.combat }));
vi.mock('@/hooks/useSessionTests', () => ({ useSessionTests: () => h.tests }));
vi.mock('@/hooks/useSessionCharacters', () => ({ useSessionCharacters: () => h.roster }));
vi.mock('@/hooks/useSessionTrades', () => ({
  useSessionTrades: () => ({
    activeTrades: h.trades.activeTrades,
    isCharacterTrading: (id: string | undefined | null) => !!id && h.trades.trading.has(id),
    refresh: h.trades.refresh,
  }),
}));
vi.mock('@/hooks/useSupabasePresence', () => ({
  useSupabasePresence: (...args: unknown[]) => {
    h.presenceArgs.push(args);
    return { onlineUsers: [{ user_id: 'u9', name: 'Online' }] };
  },
}));
vi.mock('@/data-access/sessions', () => ({
  getGameSession: h.getGameSession,
  updateGameSession: h.updateGameSession,
  subscribeToGameSession: (_id: string, cb: (s: Record<string, unknown>) => void) => {
    h.sessionListener = cb;
    return h.unsubscribeSession;
  },
}));
vi.mock('@/data-access/trades', () => ({
  createTrade: h.createTrade,
  acceptTrade: h.acceptTrade,
  cancelTrade: h.cancelTrade,
}));
vi.mock('@/services/sessionService', () => ({ endSession: h.endSession }));

vi.mock('@/components/session/SessionParticipantList', async () => ({
  SessionParticipantList: (await import('@/test/stubs')).makeStub('SessionParticipantList'),
}));
vi.mock('@/components/character/CharacterSheetView', async () => ({
  CharacterSheetView: (await import('@/test/stubs')).makeStub('CharacterSheetView'),
}));
vi.mock('@/components/session/SessionNPCList', async () => ({
  SessionNPCList: (await import('@/test/stubs')).makeStub('SessionNPCList'),
}));
vi.mock('@/components/session/SessionEnemyList', async () => ({
  SessionEnemyList: (await import('@/test/stubs')).makeStub('SessionEnemyList'),
}));
vi.mock('@/components/session/TradeDialog', async () => ({
  TradeDialog: (await import('@/test/stubs')).makeStub('TradeDialog'),
}));
vi.mock('@/components/session/MasterTestDialog', async () => ({
  MasterTestDialog: (await import('@/test/stubs')).makeStub('MasterTestDialog'),
}));
vi.mock('@/components/session/InspirationPanel', async () => ({
  InspirationPanel: (await import('@/test/stubs')).makeStub('InspirationPanel'),
}));
vi.mock('@/components/session/PlayerTestDialog', async () => ({
  PlayerTestDialog: (await import('@/test/stubs')).makeStub('PlayerTestDialog'),
}));
vi.mock('@/components/session/DiceRollerDialog', async () => ({
  DiceRollerDialog: (await import('@/test/stubs')).makeStub('DiceRollerDialog'),
}));
vi.mock('@/components/session/NewDayDialog', async () => ({
  NewDayDialog: (await import('@/test/stubs')).makeStub('NewDayDialog'),
}));
vi.mock('@/components/session/EndSessionDialog', async () => ({
  EndSessionDialog: (await import('@/test/stubs')).makeStub('EndSessionDialog'),
}));
vi.mock('@/components/session/ShortRestCard', async () => ({
  ShortRestCard: (await import('@/test/stubs')).makeStub('ShortRestCard'),
}));
vi.mock('@/hooks/useShortRestRecharge', () => ({ useShortRestRecharge: vi.fn() }));
vi.mock('@/components/session/SessionRestControls', async () => ({
  SessionRestControls: (await import('@/test/stubs')).makeStub('SessionRestControls'),
}));
vi.mock('@/components/session/PlayerRestIndicator', async () => ({
  PlayerRestIndicator: (await import('@/test/stubs')).makeStub('PlayerRestIndicator'),
}));
vi.mock('@/components/combat/CombatSetupModal', async () => ({
  CombatSetupModal: (await import('@/test/stubs')).makeStub('CombatSetupModal'),
}));
vi.mock('@/components/combat/CombatDashboard', async () => ({
  CombatDashboard: (await import('@/test/stubs')).makeStub('CombatDashboard'),
}));
vi.mock('@/components/combat/PlayerCombatView', async () => ({
  PlayerCombatView: (await import('@/test/stubs')).makeStub('PlayerCombatView'),
}));
vi.mock('@/components/combat/AttackLog', async () => ({
  AttackLog: (await import('@/test/stubs')).makeStub('AttackLog'),
}));
vi.mock('@/components/combat/DeathSavesModal', async () => ({
  DeathSavesModal: (await import('@/test/stubs')).makeStub('DeathSavesModal'),
}));

import { clearStubs, stubProps } from '@/test/stubs';
import { ActiveSessionPage } from './ActiveSessionPage';

type Fn = (...args: unknown[]) => unknown;
type Obj = Record<string, unknown>;
const props = (name: string) => stubProps(name);
/** O valor de uma prop que a tela passou a um filho (a mesma referência, não uma cópia). */
const prop = (name: string, key: string): unknown => stubProps(name)?.[key];
/** Chama uma prop-função que a tela passou a um filho. */
const call = (name: string, key: string, ...args: unknown[]): unknown => {
  const fn = prop(name, key);
  if (typeof fn !== 'function') throw new Error(`${name}.${key} não é uma função`);
  return (fn as Fn)(...args);
};
/** Segue `path` em cada item de uma lista: pluck(lista, 'character', 'id'). */
const pluck = (list: unknown, ...path: string[]): unknown[] =>
  (list as unknown[]).map((item) => path.reduce((o, k) => (o as Obj)[k], item));
const hasStub = (name: string) => !!document.querySelector(`[data-stub="${name}"]`);

const character = (id: string, over: Obj = {}) => ({
  id,
  name: `Personagem ${id}`,
  stats: { pv: 10, current_pv: 10, ca: 11, faith: 50 },
  is_deleted: false,
  is_npc: false,
  is_enemy: false,
  is_dead: false,
  ...over,
});
const baseSession = {
  id: 's1',
  name: 'Cerco de Jericó',
  description: 'Sete voltas',
  gm_id: 'gm',
  status: 'active',
  current_day: 2,
  current_period: 'Manhã',
};
const me = { id: 'u1', email: 'ana@exemplo.com', user_metadata: { name: 'Ana' } };

const renderPage = async () => {
  render(<ActiveSessionPage />);
  await waitFor(() => expect(h.getGameSession).toHaveBeenCalled());
  await act(async () => {});
};
const asGm = () => (h.user = { id: 'gm' });

beforeEach(() => {
  clearStubs();
  h.user = me;
  h.session = { ...baseSession };
  h.sessionListener = undefined;
  h.combat.activeCombat = null;
  h.tests = { activeTests: [], testResults: {} };
  h.roster.playerCharacters = [
    { user_id: 'u1', character: character('c1') },
    { user_id: 'u2', character: character('c2') },
    { user_id: 'u3', character: character('cdead', { is_deleted: true }) },
  ];
  h.roster.npcs = [
    { id: 'n1', name: 'Mercador', is_playable: false, is_visible: true, stats: { pv: 5 } },
    { id: 'n2', name: 'Guarda', is_playable: true, is_visible: false, stats: { pv: 8 } },
  ];
  h.roster.enemies = [{ id: 'e1', name: 'Filisteu', stats: { pv: 12, current_pv: 9 } }];
  h.roster.isLoading = false;
  h.trades.activeTrades = [];
  h.trades.trading = new Set();
  h.presenceArgs = [];
  for (const fn of [
    h.unsubscribeSession,
    h.combat.initSubscriptions,
    h.combat.cleanupSubscriptions,
    h.roster.refresh,
    h.roster.updateLocal,
    h.trades.refresh,
    h.getGameSession,
    h.updateGameSession,
    h.createTrade,
    h.acceptTrade,
    h.cancelTrade,
    h.endSession,
    h.navigate,
  ]) {
    fn.mockReset();
  }
  h.getGameSession.mockImplementation(async () => h.session);
  h.updateGameSession.mockResolvedValue(undefined);
  h.createTrade.mockResolvedValue(undefined);
  h.acceptTrade.mockResolvedValue(undefined);
  h.cancelTrade.mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('estados antes da sessão', () => {
  it('mostra "Carregando sessão..." até a leitura terminar', () => {
    h.getGameSession.mockReturnValue(new Promise(() => {}));
    render(<ActiveSessionPage />);
    expect(screen.getByText('Carregando sessão...')).toBeInTheDocument();
  });

  it('sem usuário, pede autenticação', async () => {
    h.user = null;
    await renderPage();
    expect(screen.getByText('Autenticação necessária.')).toBeInTheDocument();
  });

  it('se a leitura da sessão falha, mostra "Sessão não encontrada."', async () => {
    h.getGameSession.mockRejectedValue(new Error('falhou'));
    await renderPage();
    expect(screen.getByText('Sessão não encontrada.')).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it('assina o combate e a sessão da mesa e cancela ao sair', async () => {
    const { unmount } = render(<ActiveSessionPage />);
    await act(async () => {});
    expect(h.combat.initSubscriptions).toHaveBeenCalledWith('s1');
    unmount();
    expect(h.combat.cleanupSubscriptions).toHaveBeenCalled();
    expect(h.unsubscribeSession).toHaveBeenCalled();
  });

  it('a presença usa o nome do usuário, ou o usuário do e-mail, ou "Jogador"', async () => {
    await renderPage();
    const last = () => h.presenceArgs[h.presenceArgs.length - 1];
    expect(last()[0]).toBe('s1');
    expect(last()[1]).toMatchObject({ user_id: 'u1', name: 'Ana' });
    expect(typeof (last()[1] as Obj).online_at).toBe('string');
    cleanup();
    h.user = { id: 'u1', email: 'bia@exemplo.com', user_metadata: { username: 'biab' } };
    await renderPage();
    expect(last()[1]).toMatchObject({ name: 'biab' });
    cleanup();
    h.user = { id: 'u1', email: 'bia@exemplo.com', user_metadata: {} };
    await renderPage();
    expect(last()[1]).toMatchObject({ name: 'bia' });
    cleanup();
    h.user = { id: 'u1' };
    await renderPage();
    expect(last()[1]).toMatchObject({ name: 'Jogador' });
  });
});

describe('cabeçalho', () => {
  it('mostra nome, descrição, dia, período e o estado da sessão', async () => {
    await renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cerco de Jericó');
    expect(screen.getByText('Sete voltas')).toBeInTheDocument();
    expect(screen.getByText('DIA 2')).toBeInTheDocument();
    expect(screen.getByText(/🌅/)).toHaveTextContent('Manhã');
    expect(screen.getByText('Ativa')).toBeInTheDocument();
  });

  it.each([
    ['Tarde', '☀️'],
    ['Noite', '🌙'],
  ])('o período %s tem o ícone %s', async (period, icon) => {
    h.session = { ...baseSession, current_period: period };
    await renderPage();
    expect(screen.getByText(new RegExp(icon))).toHaveTextContent(period);
  });

  it('sem dia nem período gravados, mostra DIA 1 e Manhã', async () => {
    h.session = { ...baseSession, current_day: null, current_period: null };
    await renderPage();
    expect(screen.getByText('DIA 1')).toBeInTheDocument();
    expect(screen.getByText(/🌅/)).toHaveTextContent('Manhã');
  });

  it('sessão finalizada: "Finalizada" e sem botão de dados nem de Mestre', async () => {
    asGm();
    h.session = { ...baseSession, status: 'finished' };
    await renderPage();
    expect(screen.getByText('Finalizada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Dados/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Solicitar Teste/ })).toBeNull();
  });

  it('jogador vê o botão de dados; o espectador não', async () => {
    await renderPage();
    expect(screen.getByRole('button', { name: /Dados/ })).toBeInTheDocument();
    cleanup();
    h.user = { id: 'u3' };
    await renderPage();
    expect(screen.queryByRole('button', { name: /Dados/ })).toBeNull();
    expect(screen.getByText('Modo Espectador', { selector: 'span' })).toBeInTheDocument();
  });

  it('só o Mestre vê os botões de gestão', async () => {
    await renderPage();
    expect(screen.queryByRole('button', { name: /Solicitar Teste/ })).toBeNull();
    cleanup();
    asGm();
    await renderPage();
    for (const name of [/Avançar/, /Solicitar Teste/, /Iniciar Combate/, /Finalizar Sessão/]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });
});

describe('os botões abrem os diálogos', () => {
  beforeEach(asGm);

  it('Dados, Solicitar Teste, Iniciar Combate e Finalizar Sessão', async () => {
    await renderPage();
    expect(prop('DiceRollerDialog', 'isOpen')).toBe(false);
    expect(prop('MasterTestDialog', 'isOpen')).toBe(false);
    expect(prop('EndSessionDialog', 'isOpen')).toBe(false);
    expect(hasStub('CombatSetupModal')).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: /Dados/ }));
    fireEvent.click(screen.getByRole('button', { name: /Solicitar Teste/ }));
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Combate/ }));
    fireEvent.click(screen.getByRole('button', { name: /Finalizar Sessão/ }));

    expect(prop('DiceRollerDialog', 'isOpen')).toBe(true);
    expect(prop('MasterTestDialog', 'isOpen')).toBe(true);
    expect(prop('EndSessionDialog', 'isOpen')).toBe(true);
    expect(hasStub('CombatSetupModal')).toBe(true);
    expect(prop('CombatSetupModal', 'sessionId')).toBe('s1');
  });

  it('os diálogos fecham pelo onClose', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Dados/ }));
    act(() => call('DiceRollerDialog', 'onClose'));
    expect(prop('DiceRollerDialog', 'isOpen')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Combate/ }));
    act(() => call('CombatSetupModal', 'onClose'));
    expect(hasStub('CombatSetupModal')).toBe(false);
  });

  it('o diálogo de Teste do Mestre recebe os Testes e os personagens', async () => {
    h.tests = { activeTests: [{ id: 't1', status: 'active' }], testResults: { t1: [] } };
    await renderPage();
    expect(prop('MasterTestDialog', 'sessionId')).toBe('s1');
    expect(prop('MasterTestDialog', 'activeTests')).toEqual([{ id: 't1', status: 'active' }]);
    expect(prop('MasterTestDialog', 'playerCharacters')).toBe(h.roster.playerCharacters);
  });
});

describe('avançar o tempo', () => {
  beforeEach(asGm);
  // Avançar o período fecha um Descanso Curto aberto (ADR 0006).
  const closedRest = {
    short_rest_id: null,
    short_rest_opened_by: null,
    short_rest_requested: [],
    short_rest_finished: [],
    short_rest_refused_at: null,
  };
  const advance = async () => {
    fireEvent.click(screen.getByRole('button', { name: /Avançar/ }));
    await act(async () => {});
  };

  it.each([
    ['Manhã', { current_period: 'Tarde', current_day: 2 }],
    ['Tarde', { current_period: 'Noite', current_day: 2 }],
    ['Noite', { current_period: 'Manhã', current_day: 3, short_rests_today: 0 }],
    ['Madrugada', { current_period: 'Manhã', current_day: 2 }],
  ])('de %s grava o próximo período', async (period, expected) => {
    h.session = { ...baseSession, current_period: period };
    await renderPage();
    await advance();
    expect(h.updateGameSession).toHaveBeenCalledWith('s1', { ...expected, ...closedRest });
  });

  it('sem dia gravado, conta a partir do dia 1', async () => {
    h.session = { ...baseSession, current_period: 'Noite', current_day: null };
    await renderPage();
    await advance();
    expect(h.updateGameSession).toHaveBeenCalledWith('s1', {
      current_period: 'Manhã',
      current_day: 2,
      short_rests_today: 0,
      ...closedRest,
    });
  });

  it('erro ao gravar é só registrado', async () => {
    h.updateGameSession.mockRejectedValue(new Error('falhou'));
    await renderPage();
    await advance();
    expect(console.error).toHaveBeenCalledWith('Erro ao avançar o tempo:', expect.any(Error));
  });

  it('virar de Noite para Manhã pelo realtime abre o aviso do novo dia', async () => {
    h.session = { ...baseSession, current_period: 'Noite' };
    await renderPage();
    expect(prop('NewDayDialog', 'isOpen')).toBe(false);
    act(() => h.sessionListener!({ ...baseSession, current_period: 'Manhã', current_day: 3 }));
    expect(prop('NewDayDialog', 'isOpen')).toBe(true);
    expect(prop('NewDayDialog', 'day')).toBe(3);
    act(() => call('NewDayDialog', 'onClose'));
    expect(prop('NewDayDialog', 'isOpen')).toBe(false);
  });

  it('compara sempre com a última versão recebida da sessão', async () => {
    await renderPage();
    act(() => h.sessionListener!({ ...baseSession, current_period: 'Noite' }));
    expect(prop('NewDayDialog', 'isOpen')).toBe(false);
    act(() => h.sessionListener!({ ...baseSession, current_period: 'Manhã', current_day: 3 }));
    expect(prop('NewDayDialog', 'isOpen')).toBe(true);
  });

  it('outras mudanças de período não abrem o aviso, mas atualizam a tela', async () => {
    await renderPage();
    act(() => h.sessionListener!({ ...baseSession, current_period: 'Tarde' }));
    expect(prop('NewDayDialog', 'isOpen')).toBe(false);
    expect(screen.getByText(/☀️/)).toHaveTextContent('Tarde');
  });
});

describe('visão do Mestre', () => {
  beforeEach(asGm);

  it('mostra o painel do Mestre com descanso, jogadores, inimigos e NPCs', async () => {
    await renderPage();
    expect(screen.getByText('Visão do Mestre')).toBeInTheDocument();
    expect(props('SessionRestControls')).toMatchObject({
      sessionId: 's1',
      sessionData: h.session,
      playerCharacters: h.roster.playerCharacters,
      npcs: h.roster.npcs,
    });
    expect(props('ShortRestCard')).toMatchObject({
      role: 'master',
      sessionId: 's1',
      session: h.session,
    });
    expect(props('SessionParticipantList')).toMatchObject({
      isGM: true,
      sessionId: 's1',
      gmId: 'gm',
    });
    expect(pluck(prop('SessionParticipantList', 'playerCharacters'), 'character', 'id')).toEqual([
      'c1',
      'c2',
    ]);
    expect(prop('SessionParticipantList', 'npcs')).toBeUndefined();
    expect(prop('SessionParticipantList', 'onlineUsers')).toEqual([
      { user_id: 'u9', name: 'Online' },
    ]);
    expect(props('SessionEnemyList')).toMatchObject({ sessionId: 's1', isLoading: false });
    expect(prop('SessionNPCList', 'npcs')).toBe(h.roster.npcs);
    expect(hasStub('CharacterSheetView')).toBe(false);
    expect(hasStub('CombatDashboard')).toBe(false);
  });

  it('com combate ativo, mostra o painel de combate com as entidades da mesa', async () => {
    h.combat.activeCombat = { id: 'cb1' };
    await renderPage();
    expect(prop('CombatDashboard', 'availableEntities')).toMatchObject([
      { type: 'player', id: 'c1', name: 'Personagem c1', hpCurrent: 10 },
      { type: 'player', id: 'c2', name: 'Personagem c2', hpCurrent: 10 },
      { type: 'npc', id: 'n2', name: 'Guarda', hpCurrent: 8 },
      { type: 'enemy', id: 'e1', name: 'Filisteu', hpCurrent: 9 },
    ]);
    expect(props('CombatSetupModal')).toBeUndefined();
  });

  it('as entidades deixam de fora excluídos, NPC não jogável e personagem marcado NPC/inimigo', async () => {
    h.combat.activeCombat = { id: 'cb1' };
    h.roster.playerCharacters = [
      { user_id: 'u1', character: character('ok') },
      { user_id: 'u2', character: character('npc', { is_npc: true }) },
      { user_id: 'u3', character: character('enemy', { is_enemy: true }) },
      { user_id: 'u4', character: character('gone', { is_deleted: true }) },
    ];
    h.roster.npcs = [{ id: 'n3', name: 'Morto', is_playable: true, is_deleted: true, stats: {} }];
    h.roster.enemies = [{ id: 'e2', name: '', stats: { pv: 3 } }];
    await renderPage();
    const entities = prop('CombatDashboard', 'availableEntities');
    expect(pluck(entities, 'id')).toEqual(['ok', 'e2']);
    expect(pluck(entities, 'name')[1]).toBe('Inimigo');
  });

  it('nomes vazios caem em "Jogador" e "NPC"', async () => {
    h.combat.activeCombat = { id: 'cb1' };
    h.roster.playerCharacters = [{ user_id: 'u1', character: character('c1', { name: '' }) }];
    h.roster.npcs = [{ id: 'n1', name: '', is_playable: true, stats: { pv: 5 } }];
    await renderPage();
    const entities = prop('CombatDashboard', 'availableEntities');
    expect(pluck(entities, 'name')).toEqual(['Jogador', 'NPC', 'Filisteu']);
  });

  it('encaixa as atualizações locais por tipo', async () => {
    await renderPage();
    call('SessionParticipantList', 'onUpdatePlayerData', 'c1', { a: 1 });
    call('SessionParticipantList', 'onUpdateNPCData', 'n1', { b: 2 });
    call('SessionEnemyList', 'updateLocalEnemy', 'e1', { c: 3 });
    call('SessionNPCList', 'onUpdateNPCData', 'n2', { d: 4 });
    expect(h.roster.updateLocal.mock.calls).toEqual([
      ['player', 'c1', { a: 1 }],
      ['npc', 'n1', { b: 2 }],
      ['enemy', 'e1', { c: 3 }],
      ['npc', 'n2', { d: 4 }],
    ]);
  });
});

/** Abre um Painel pelo trilho "Painéis". */
const openPanel = (name: string) =>
  fireEvent.click(
    within(screen.getByRole('navigation', { name: 'Painéis' })).getByRole('button', { name }),
  );

describe('moldura do jogador (Palco, trilho e Painéis)', () => {
  it('o trilho tem Ficha, Inventário, Grupo, Histórico e Descanso, nesta ordem', async () => {
    await renderPage();
    const rail = screen.getByRole('navigation', { name: 'Painéis' });
    expect(
      within(rail)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label')),
    ).toEqual(['Ficha', 'Inventário', 'Grupo', 'Histórico', 'Descanso']);
  });

  it('nenhum Painel abre sozinho: a ficha e o grupo só montam quando se toca no ícone', async () => {
    await renderPage();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(hasStub('CharacterSheetView')).toBe(false);
    expect(hasStub('SessionParticipantList')).toBe(false);
  });

  it('Ficha e Inventário abrem a ficha do jogador num Painel', async () => {
    await renderPage();
    openPanel('Ficha');
    expect(screen.getByRole('dialog', { name: 'Ficha' })).toBeInTheDocument();
    expect(props('CharacterSheetView')).toMatchObject({ userId: 'u1', sessionId: 's1' });
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    openPanel('Inventário');
    expect(screen.getByRole('dialog', { name: 'Inventário' })).toBeInTheDocument();
    expect(hasStub('CharacterSheetView')).toBe(true);
  });

  it('Grupo abre a lista com só os NPCs visíveis', async () => {
    await renderPage();
    openPanel('Grupo');
    expect(screen.getByRole('dialog', { name: 'Grupo' })).toBeInTheDocument();
    expect(prop('SessionParticipantList', 'isGM')).toBe(false);
    expect(pluck(prop('SessionParticipantList', 'npcs'), 'id')).toEqual(['n1']);
    expect(pluck(prop('SessionParticipantList', 'playerCharacters'), 'character', 'id')).toEqual([
      'c1',
      'c2',
    ]);
  });

  it('Descanso abre o cartão do Descanso Curto e o aviso do Descanso Longo', async () => {
    await renderPage();
    openPanel('Descanso');
    expect(screen.getByRole('dialog', { name: 'Descanso' })).toBeInTheDocument();
    expect(props('ShortRestCard')).toMatchObject({ role: 'player', sessionId: 's1' });
    expect(prop('PlayerRestIndicator', 'sessionData')).toBeTruthy();
    expect(hasStub('SessionRestControls')).toBe(false);
  });

  it('Histórico abre o histórico do combate', async () => {
    await renderPage();
    openPanel('Histórico');
    expect(screen.getByRole('dialog', { name: 'Histórico' })).toBeInTheDocument();
    expect(hasStub('AttackLog')).toBe(true);
  });

  it('abrir outro ícone troca o Painel, sem empilhar (Painel ao lado, a partir de lg)', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    await renderPage();
    openPanel('Ficha');
    openPanel('Grupo');
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: 'Grupo' })).toBeInTheDocument();
  });

  it('um selo marca o Descanso quando há descanso aberto, e o Grupo quando há troca pendente', async () => {
    h.session = { ...baseSession, short_rest_id: 'r1', short_rest_opened_by: 'master' };
    h.trades.activeTrades = [{ id: 't1', status: 'pending', initiator_user_id: 'u2' }];
    await renderPage();
    const rail = screen.getByRole('navigation', { name: 'Painéis' });
    expect(within(rail).getByRole('button', { name: 'Descanso' })).toHaveAttribute(
      'data-attention',
    );
    expect(within(rail).getByRole('button', { name: 'Grupo' })).toHaveAttribute('data-attention');
    expect(within(rail).getByRole('button', { name: 'Ficha' })).not.toHaveAttribute(
      'data-attention',
    );
  });

  it('o pedido recusado também marca o Descanso', async () => {
    h.session = { ...baseSession, short_rest_refused_at: '2026-10-29T10:00:00Z' };
    await renderPage();
    const rail = screen.getByRole('navigation', { name: 'Painéis' });
    expect(within(rail).getByRole('button', { name: 'Descanso' })).toHaveAttribute(
      'data-attention',
    );
  });

  it('os Testes de Morte ficam por cima de tudo, fora dos Painéis', async () => {
    h.roster.playerCharacters = [
      { user_id: 'u1', character: character('c1', { stats: { pv: 10, current_pv: 0 } }) },
    ];
    await renderPage();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(prop('DeathSavesModal', 'character')).toMatchObject({ id: 'c1' });
  });

  it('a Inspiração fica à mão, fora dos Painéis', async () => {
    await renderPage();
    expect(hasStub('InspirationPanel')).toBe(true);
  });
});

describe('visão do jogador e do espectador', () => {
  it('PV zero fora de combate e vivo: mostra os Testes de Morte', async () => {
    h.roster.playerCharacters = [
      { user_id: 'u1', character: character('c1', { stats: { pv: 10, current_pv: 0 } }) },
    ];
    await renderPage();
    expect(prop('DeathSavesModal', 'character')).toMatchObject({ id: 'c1' });
  });

  it.each([
    ['já morto', { is_dead: true }, null],
    ['PV acima de zero', {}, null],
    ['em combate', {}, { id: 'cb1' }],
  ])('sem Testes de Morte quando %s', async (_label, over, combat) => {
    h.combat.activeCombat = combat;
    h.roster.playerCharacters = [
      {
        user_id: 'u1',
        character: character('c1', {
          stats: { pv: 10, current_pv: _label === 'PV acima de zero' ? 4 : 0 },
          ...over,
        }),
      },
    ];
    await renderPage();
    expect(hasStub('DeathSavesModal')).toBe(false);
  });

  it('com combate ativo, o jogador vê a visão de combate com a sua ficha e os inimigos', async () => {
    h.combat.activeCombat = { id: 'cb1' };
    await renderPage();
    expect(props('PlayerCombatView')).toMatchObject({ isLoading: false });
    expect(prop('PlayerCombatView', 'character')).toMatchObject({ id: 'c1' });
    expect(prop('PlayerCombatView', 'enemies')).toBe(h.roster.enemies);
  });

  it('espectador (ficha excluída) vê a ficha apagada e nenhum controle', async () => {
    h.user = { id: 'u3' };
    await renderPage();
    expect(screen.getByText('Modo Espectador', { selector: 'h2 *, h2' })).toBeInTheDocument();
    expect(props('CharacterSheetView')).toMatchObject({ userId: 'u3', sessionId: 's1' });
    expect(hasStub('SessionParticipantList')).toBe(false);
    expect(hasStub('PlayerRestIndicator')).toBe(false);
  });
});

describe('Teste pedido pelo Mestre', () => {
  const pending = () => {
    h.tests = {
      activeTests: [{ id: 't1', status: 'active' }],
      testResults: {
        t1: [
          { id: 'r2', player_id: 'u2' },
          { id: 'r1', player_id: 'u1' },
        ],
      },
    };
  };

  it('o jogador com resultado pendente abre o diálogo com o seu resultado', async () => {
    pending();
    await renderPage();
    expect(props('PlayerTestDialog')).toMatchObject({
      isOpen: true,
      activeTest: { id: 't1' },
      testResult: { id: 'r1' },
    });
  });

  it('sem Teste ativo ou sem resultado do jogador, fica fechado', async () => {
    await renderPage();
    expect(props('PlayerTestDialog')).toMatchObject({
      isOpen: false,
      activeTest: null,
      testResult: null,
    });
    cleanup();
    h.tests = {
      activeTests: [{ id: 't1', status: 'active' }],
      testResults: { t1: [{ id: 'r2', player_id: 'u2' }] },
    };
    await renderPage();
    expect(prop('PlayerTestDialog', 'isOpen')).toBe(false);
  });

  it('o Mestre nunca abre o diálogo do jogador', async () => {
    asGm();
    h.tests = {
      activeTests: [{ id: 't1', status: 'active' }],
      testResults: { t1: [{ id: 'r1', player_id: 'gm' }] },
    };
    await renderPage();
    expect(prop('PlayerTestDialog', 'isOpen')).toBe(false);
  });

  it('Teste que não está "active" não conta', async () => {
    h.tests = {
      activeTests: [{ id: 't1', status: 'completed' }],
      testResults: { t1: [{ id: 'r1', player_id: 'u1' }] },
    };
    await renderPage();
    expect(prop('PlayerTestDialog', 'isOpen')).toBe(false);
  });
});

describe('fim da sessão', () => {
  beforeEach(asGm);

  it('confirmar encerra, e só navega para a Home se deu certo', async () => {
    h.endSession.mockResolvedValue(true);
    await renderPage();
    await act(async () => {
      await call('EndSessionDialog', 'onConfirm', ['c1']);
    });
    expect(h.endSession).toHaveBeenCalledWith('s1', ['c1']);
    expect(h.navigate).toHaveBeenCalledWith('/');
  });

  it('se a última gravação falhar, fica na tela', async () => {
    h.endSession.mockResolvedValue(false);
    await renderPage();
    await act(async () => {
      await call('EndSessionDialog', 'onConfirm', []);
    });
    expect(h.navigate).not.toHaveBeenCalled();
  });

  it('o diálogo recebe os jogadores para a escolha do level-up', async () => {
    await renderPage();
    expect(prop('EndSessionDialog', 'playerCharacters')).toBe(h.roster.playerCharacters);
  });
});

describe('trocas', () => {
  const trade = (over: Obj = {}) => ({
    id: 'tr1',
    status: 'active',
    type: 'player_trade',
    initiator_user_id: 'u2',
    target_character_id: null,
    target_npc_id: null,
    ...over,
  });

  describe('qual troca abre o diálogo', () => {
    it.each([
      ['sou o iniciador', trade({ initiator_user_id: 'u1' }), 'u1'],
      ['o alvo é o meu personagem', trade({ target_character_id: 'c1' }), 'u1'],
      ['o Mestre numa lojinha', trade({ type: 'shop' }), 'gm'],
      ['o Mestre numa troca com NPC', trade({ type: 'npc_trade' }), 'gm'],
    ])('abre quando %s', async (_label, t, userId) => {
      h.user = { id: userId };
      h.trades.activeTrades = [t];
      await renderPage();
      expect(prop('TradeDialog', 'trade')).toMatchObject({ id: 'tr1' });
      expect(props('TradeDialog')).toMatchObject({ currentUserId: userId, isOpen: true });
    });

    it.each([
      ['troca de outros', trade({ initiator_user_id: 'u2', target_character_id: 'c2' })],
      ['troca ainda pendente', trade({ initiator_user_id: 'u1', status: 'pending' })],
      ['lojinha, sendo jogador', trade({ type: 'shop' })],
    ])('não abre: %s', async (_label, t) => {
      h.trades.activeTrades = [t];
      await renderPage();
      expect(hasStub('TradeDialog')).toBe(false);
    });

    it('mostra o nome do NPC da troca e atualiza tudo ao fechar', async () => {
      asGm();
      h.trades.activeTrades = [trade({ type: 'npc_trade', target_npc_id: 'n1' })];
      await renderPage();
      expect(prop('TradeDialog', 'npcName')).toBe('Mercador');
      expect(prop('TradeDialog', 'isGM')).toBe(true);
      call('TradeDialog', 'onClose');
      call('TradeDialog', 'onTradeUpdated');
      expect(h.trades.refresh).toHaveBeenCalledTimes(2);
      expect(h.roster.refresh).toHaveBeenCalledTimes(2);
    });
  });

  describe('negociar com outro jogador', () => {
    it('cria uma troca pendente entre as duas fichas', async () => {
      await renderPage();
      openPanel('Grupo');
      await act(async () => {
        await call('SessionParticipantList', 'onNegotiate', 'u2');
      });
      expect(h.createTrade).toHaveBeenCalledWith({
        sessionId: 's1',
        type: 'player_trade',
        initiatorUserId: 'u1',
        initiatorCharacterId: 'c1',
        targetCharacterId: 'c2',
        status: 'pending',
      });
      expect(h.trades.refresh).toHaveBeenCalled();
    });

    it('não cria se alguém já está em troca ou se falta uma ficha', async () => {
      h.trades.trading = new Set(['c2']);
      await renderPage();
      openPanel('Grupo');
      await act(async () => {
        await call('SessionParticipantList', 'onNegotiate', 'u2');
        await call('SessionParticipantList', 'onNegotiate', 'desconhecido');
      });
      h.trades.trading = new Set(['c1']);
      cleanup();
      await renderPage();
      await act(async () => {
        await call('SessionParticipantList', 'onNegotiate', 'u2');
      });
      expect(h.createTrade).not.toHaveBeenCalled();
    });

    it('erro ao criar é só registrado e não atualiza a lista', async () => {
      h.createTrade.mockRejectedValue(new Error('falhou'));
      await renderPage();
      openPanel('Grupo');
      await act(async () => {
        await call('SessionParticipantList', 'onNegotiate', 'u2');
      });
      expect(console.error).toHaveBeenCalledWith('Erro ao criar negociação:', expect.any(Error));
      expect(h.trades.refresh).not.toHaveBeenCalled();
    });
  });

  describe('lojinha do Mestre', () => {
    beforeEach(asGm);

    it('abre uma troca já ativa, sem ficha do lado do Mestre', async () => {
      await renderPage();
      await act(async () => {
        await call('SessionParticipantList', 'onShop', 'u2');
      });
      expect(h.createTrade).toHaveBeenCalledWith({
        sessionId: 's1',
        type: 'shop',
        initiatorUserId: 'gm',
        initiatorCharacterId: null,
        targetCharacterId: 'c2',
        status: 'active',
      });
    });

    it('não abre para quem já está em troca ou não existe', async () => {
      h.trades.trading = new Set(['c2']);
      await renderPage();
      await act(async () => {
        await call('SessionParticipantList', 'onShop', 'u2');
        await call('SessionParticipantList', 'onShop', 'desconhecido');
      });
      expect(h.createTrade).not.toHaveBeenCalled();
    });

    it('erro é registrado com a mensagem da lojinha', async () => {
      h.createTrade.mockRejectedValue(new Error('falhou'));
      await renderPage();
      await act(async () => {
        await call('SessionParticipantList', 'onShop', 'u2');
      });
      expect(console.error).toHaveBeenCalledWith('Erro ao abrir lojinha:', expect.any(Error));
    });
  });

  describe('negociar com NPC', () => {
    it('NPC jogável vira troca com a ficha; NPC simples, com o NPC da sessão', async () => {
      await renderPage();
      openPanel('Grupo');
      await act(async () => {
        await call('SessionParticipantList', 'onNPCNegotiate', { id: 'n2', is_playable: true });
        await call('SessionParticipantList', 'onNPCNegotiate', { id: 'n1', is_playable: false });
      });
      expect(h.createTrade.mock.calls[0][0]).toEqual({
        sessionId: 's1',
        type: 'npc_trade',
        initiatorUserId: 'u1',
        initiatorCharacterId: 'c1',
        status: 'pending',
        targetCharacterId: 'n2',
      });
      expect(h.createTrade.mock.calls[1][0]).toEqual({
        sessionId: 's1',
        type: 'npc_trade',
        initiatorUserId: 'u1',
        initiatorCharacterId: 'c1',
        status: 'pending',
        targetNpcId: 'n1',
      });
    });

    it('erro é registrado com a mensagem da negociação com NPC', async () => {
      h.createTrade.mockRejectedValue(new Error('falhou'));
      await renderPage();
      openPanel('Grupo');
      await act(async () => {
        await call('SessionParticipantList', 'onNPCNegotiate', { id: 'n1' });
      });
      expect(console.error).toHaveBeenCalledWith(
        'Erro ao solicitar negociação com NPC:',
        expect.any(Error),
      );
    });

    it('não cria se o jogador já está em troca ou não tem ficha', async () => {
      h.trades.trading = new Set(['c1']);
      await renderPage();
      openPanel('Grupo');
      await act(async () => {
        await call('SessionParticipantList', 'onNPCNegotiate', { id: 'n1' });
      });
      expect(h.createTrade).not.toHaveBeenCalled();
    });

    it('a lista de NPCs do Mestre usa o mesmo caminho', async () => {
      asGm();
      h.roster.playerCharacters = [{ user_id: 'gm', character: character('cg') }];
      await renderPage();
      await act(async () => {
        await call('SessionNPCList', 'onNPCNegotiate', { id: 'n1' });
      });
      expect(h.createTrade.mock.calls[0][0]).toMatchObject({ initiatorCharacterId: 'cg' });
    });
  });

  describe('aceitar e recusar', () => {
    it('aceitar e recusar chamam a camada de dados e atualizam as trocas', async () => {
      await renderPage();
      openPanel('Grupo');
      await act(async () => {
        await call('SessionParticipantList', 'onAcceptTrade', 'tr1');
        await call('SessionParticipantList', 'onRejectTrade', 'tr2');
      });
      expect(h.acceptTrade).toHaveBeenCalledWith('tr1');
      expect(h.cancelTrade).toHaveBeenCalledWith('tr2');
      expect(h.trades.refresh).toHaveBeenCalledTimes(2);
    });

    it('erros são registrados com a mensagem de cada ação', async () => {
      h.acceptTrade.mockRejectedValue(new Error('x'));
      h.cancelTrade.mockRejectedValue(new Error('y'));
      await renderPage();
      openPanel('Grupo');
      await act(async () => {
        await call('SessionParticipantList', 'onAcceptTrade', 'tr1');
        await call('SessionParticipantList', 'onRejectTrade', 'tr2');
      });
      expect(console.error).toHaveBeenCalledWith('Erro ao aceitar negociação:', expect.any(Error));
      expect(console.error).toHaveBeenCalledWith('Erro ao recusar negociação:', expect.any(Error));
      expect(h.trades.refresh).not.toHaveBeenCalled();
    });
  });

  describe('limpeza ao sair da tela', () => {
    it('cancela as trocas abertas que chegaram depois do primeiro render', async () => {
      const { unmount, rerender } = render(<ActiveSessionPage />);
      await act(async () => {});
      h.trades.activeTrades = [trade({ id: 'tardia', initiator_user_id: 'u1', status: 'pending' })];
      rerender(<ActiveSessionPage />);
      unmount();
      expect(h.cancelTrade.mock.calls.map((c) => c[0])).toEqual(['tardia']);
    });

    it('não cancela a troca que já saiu da lista antes de a pessoa sair', async () => {
      h.trades.activeTrades = [trade({ id: 'concluida', initiator_user_id: 'u1' })];
      const { unmount, rerender } = render(<ActiveSessionPage />);
      await act(async () => {});
      h.trades.activeTrades = [];
      rerender(<ActiveSessionPage />);
      unmount();
      expect(h.cancelTrade).not.toHaveBeenCalled();
    });

    it('cancela as do usuário: as que ele iniciou e as pedidas à sua ficha', async () => {
      h.trades.activeTrades = [
        trade({ id: 'minha', initiator_user_id: 'u1', status: 'pending' }),
        trade({ id: 'para-mim', initiator_user_id: 'u2', target_character_id: 'c1' }),
        trade({ id: 'dos-outros', initiator_user_id: 'u2', target_character_id: 'c2' }),
        trade({ id: 'velha', initiator_user_id: 'u1', status: 'completed' }),
      ];
      const { unmount } = render(<ActiveSessionPage />);
      await act(async () => {});
      unmount();
      expect(h.cancelTrade.mock.calls.map((c) => c[0])).toEqual(['minha', 'para-mim']);
    });
  });
});

describe('aviso de combate', () => {
  it('aparece com a mensagem do evento e some depois de 4 segundos', async () => {
    await renderPage();
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    act(() => {
      window.dispatchEvent(new CustomEvent('combat-toast', { detail: { message: 'Rodada 2!' } }));
    });
    expect(screen.getByText('Rodada 2!')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3900);
    });
    expect(screen.getByText('Rodada 2!')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText('Rodada 2!')).toBeNull();
  });

  it('para de ouvir o evento quando a tela sai', async () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ActiveSessionPage />);
    await act(async () => {});
    unmount();
    expect(remove).toHaveBeenCalledWith('combat-toast', expect.any(Function));
  });
});
