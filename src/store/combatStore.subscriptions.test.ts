// A assinatura do combate: o que a mesa carrega ao abrir e quando relê o combate. Um combate
// iniciado entre abrir a página e o servidor confirmar o canal não chega por evento nenhum, então o
// armazém o relê quando a confirmação chega. Termos: CONTEXT.md (Combate).
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  findSessionCombat: vi.fn(),
  listCombatParticipants: vi.fn(),
  subscribeToTables: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({ supabase: {} }));
vi.mock('@/data-access/combat', () => ({
  findSessionCombat: h.findSessionCombat,
  listCombatParticipants: h.listCombatParticipants,
}));
vi.mock('@/data-access/realtime', () => ({ subscribeToTables: h.subscribeToTables }));

import { useCombatStore, type Combat, type CombatParticipant } from './combatStore';

const combat = (over: Partial<Combat> = {}): Combat => ({
  created_at: '',
  current_turn_index: 0,
  id: 'combat-1',
  round_number: 1,
  session_id: 'session-1',
  status: 'active',
  updated_at: '',
  ...over,
});
const part = (over: Partial<CombatParticipant> = {}): CombatParticipant =>
  ({
    id: 'p1',
    combat_id: 'combat-1',
    initiative: 10,
    hp_current: 5,
    ...over,
  }) as CombatParticipant;

/** O combate que o banco guarda no momento da leitura, por estado. */
const database = (rows: { active?: Combat | null; setup?: Combat | null }) =>
  h.findSessionCombat.mockImplementation(async (_session: string, status: 'active' | 'setup') =>
    status === 'active' ? (rows.active ?? null) : (rows.setup ?? null),
  );

const store = () => useCombatStore.getState();
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const onSubscribed = () => h.subscribeToTables.mock.calls[0][2].onSubscribed as () => void;

beforeEach(() => {
  vi.clearAllMocks();
  h.subscribeToTables.mockReturnValue(h.unsubscribe);
  h.listCombatParticipants.mockResolvedValue([part()]);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  useCombatStore.setState({
    activeCombat: null,
    participants: [],
    currentTurnParticipant: null,
    combatUnsubscribe: null,
  });
});

describe('initSubscriptions: carregar o combate', () => {
  it('ao abrir a mesa, carrega o combate ativo e os participantes', async () => {
    database({ active: combat() });
    store().initSubscriptions('session-1');
    await settle();
    expect(store().activeCombat?.id).toBe('combat-1');
    expect(store().participants).toHaveLength(1);
    expect(h.listCombatParticipants).toHaveBeenCalledWith('combat-1');
  });

  it('sem combate ativo, cai no combate em preparação', async () => {
    database({ setup: combat({ status: 'setup' }) });
    store().initSubscriptions('session-1');
    await settle();
    expect(store().activeCombat?.status).toBe('setup');
  });

  it('sem combate nenhum, o estado fica vazio', async () => {
    database({});
    store().initSubscriptions('session-1');
    await settle();
    expect(store().activeCombat).toBeNull();
  });

  it('registra a falha de leitura sem lançar', async () => {
    h.findSessionCombat.mockRejectedValue(new Error('sem rede'));
    store().initSubscriptions('session-1');
    await settle();
    expect(console.error).toHaveBeenCalledWith('Failed to load the combat', expect.any(Error));
    expect(store().activeCombat).toBeNull();
  });
});

describe('initSubscriptions: o que se perde até o canal ser confirmado', () => {
  it('relê o combate quando o servidor confirma a assinatura', async () => {
    database({});
    store().initSubscriptions('session-1');
    await settle();
    expect(store().activeCombat).toBeNull();

    // O Mestre iniciou o combate antes de o canal estar no ar: nenhum evento chegou.
    database({ active: combat() });
    onSubscribed()();
    await settle();

    expect(store().activeCombat?.id).toBe('combat-1');
    expect(store().participants).toHaveLength(1);
  });

  it('relê de novo a cada reconexão', async () => {
    database({ active: combat() });
    store().initSubscriptions('session-1');
    await settle();
    h.findSessionCombat.mockClear();

    onSubscribed()();
    await settle();
    onSubscribed()();
    await settle();

    expect(h.findSessionCombat).toHaveBeenCalledTimes(2);
  });

  it('registra a falha da releitura sem lançar', async () => {
    database({});
    store().initSubscriptions('session-1');
    await settle();
    h.findSessionCombat.mockRejectedValue(new Error('sem rede'));
    onSubscribed()();
    await settle();
    expect(console.error).toHaveBeenCalledWith('Failed to load the combat', expect.any(Error));
  });

  it('guarda a função que cancela a assinatura', () => {
    database({});
    store().initSubscriptions('session-1');
    store().cleanupSubscriptions();
    expect(h.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
