// A assinatura do combate: o que a mesa carrega ao abrir e quando relê o combate. Um combate
// iniciado entre abrir a página e o servidor confirmar o canal não chega por evento nenhum, então o
// armazém o relê quando a confirmação chega. Termos: CONTEXT.md (Combate).
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  findSessionCombat: vi.fn(),
  listCombatParticipants: vi.fn(),
  listCombatAttacks: vi.fn(),
  listCombatAbilityUses: vi.fn(),
  subscribeToTables: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({ supabase: {} }));
vi.mock('@/data-access/combat', () => ({
  findSessionCombat: h.findSessionCombat,
  listCombatParticipants: h.listCombatParticipants,
  listCombatAttacks: h.listCombatAttacks,
  listCombatAbilityUses: h.listCombatAbilityUses,
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
  h.listCombatAttacks.mockResolvedValue([]);
  h.listCombatAbilityUses.mockResolvedValue([]);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  useCombatStore.setState({
    activeCombat: null,
    participants: [],
    currentTurnParticipant: null,
    combatUnsubscribe: null,
    attacks: [],
    abilityUses: [],
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

describe('ataques do combate', () => {
  const attackRow = (over: Record<string, unknown> = {}) => ({
    id: 'a1',
    combat_id: 'combat-1',
    attacker_name: 'Eliabe',
    target_name: 'Filisteu',
    hit: true,
    critical: false,
    fumble: false,
    damage: 7,
    ...over,
  });
  const attackHandler = () =>
    h.subscribeToTables.mock.calls[0][1].find(
      (s: { table: string }) => s.table === 'combat_attacks',
    ).onChange as (payload: unknown) => void;
  const toasts: string[] = [];
  const onToast = (e: Event) => toasts.push((e as CustomEvent).detail.message);

  beforeEach(() => {
    toasts.length = 0;
    window.addEventListener('combat-toast', onToast);
    return () => window.removeEventListener('combat-toast', onToast);
  });

  it('ao abrir a mesa, carrega os últimos ataques do combate', async () => {
    database({ active: combat() });
    h.listCombatAttacks.mockResolvedValue([attackRow()]);
    store().initSubscriptions('session-1');
    await settle();
    expect(h.listCombatAttacks).toHaveBeenCalledWith('combat-1', 10);
    expect(store().attacks).toHaveLength(1);
  });

  it('um ataque novo entra no começo da lista e avisa a mesa', async () => {
    database({ active: combat() });
    h.listCombatAttacks.mockResolvedValue([attackRow({ id: 'a0' })]);
    store().initSubscriptions('session-1');
    await settle();
    attackHandler()({ eventType: 'INSERT', new: attackRow({ id: 'a1' }) });
    expect(store().attacks.map((a) => a.id)).toEqual(['a1', 'a0']);
    expect(toasts).toEqual(['Eliabe acertou Filisteu: 7 de dano.']);
  });

  it('um ataque ao vivo também chega à tela como evento do ataque inteiro', async () => {
    database({ active: combat() });
    store().initSubscriptions('session-1');
    await settle();
    const seen: { id: string }[] = [];
    const listener = (e: Event) => seen.push((e as CustomEvent).detail);
    window.addEventListener('combat-attack', listener);
    attackHandler()({ eventType: 'INSERT', new: attackRow({ id: 'a7' }) });
    attackHandler()({ eventType: 'INSERT', new: attackRow({ id: 'a8', combat_id: 'outro' }) });
    window.removeEventListener('combat-attack', listener);
    expect(seen.map((a) => a.id)).toEqual(['a7']);
  });

  it('o histórico carregado ao abrir não dispara o evento do ataque', async () => {
    database({ active: combat() });
    h.listCombatAttacks.mockResolvedValue([attackRow({ id: 'velho' })]);
    const seen: unknown[] = [];
    const listener = (e: Event) => seen.push(e);
    window.addEventListener('combat-attack', listener);
    store().initSubscriptions('session-1');
    await settle();
    window.removeEventListener('combat-attack', listener);
    expect(seen).toEqual([]);
  });

  it('o aviso do ataque leva o efeito de arma', async () => {
    database({ active: combat() });
    store().initSubscriptions('session-1');
    await settle();
    attackHandler()({
      eventType: 'INSERT',
      new: attackRow({
        weapon_effect_triggered: true,
        weapon_effect_conditions: [{ conditionId: 'sangrando', duration: 3 }],
      }),
    });
    expect(toasts).toEqual(['Eliabe acertou Filisteu: 7 de dano. Efeito de arma: Sangrando.']);
  });

  it('guarda só os 10 últimos', async () => {
    database({ active: combat() });
    store().initSubscriptions('session-1');
    await settle();
    for (let i = 0; i < 12; i++) {
      attackHandler()({ eventType: 'INSERT', new: attackRow({ id: `a${i}` }) });
    }
    expect(store().attacks).toHaveLength(10);
    expect(store().attacks[0].id).toBe('a11');
  });

  it('ignora o ataque de outro combate e não avisa', async () => {
    database({ active: combat() });
    store().initSubscriptions('session-1');
    await settle();
    attackHandler()({ eventType: 'INSERT', new: attackRow({ combat_id: 'outro' }) });
    expect(store().attacks).toEqual([]);
    expect(toasts).toEqual([]);
  });

  it('falhar ao ler os ataques não impede de abrir o combate', async () => {
    database({ active: combat() });
    h.listCombatAttacks.mockRejectedValue(new Error('sem rede'));
    store().initSubscriptions('session-1');
    await settle();
    expect(store().activeCombat?.id).toBe('combat-1');
    expect(store().attacks).toEqual([]);
  });

  it('o desempate da iniciativa é determinístico (criação, depois id)', () => {
    store().setCombatState(combat(), [
      part({ id: 'b', initiative: 10, created_at: '2026-01-01T00:00:02Z' }),
      part({ id: 'a', initiative: 10, created_at: '2026-01-01T00:00:02Z' }),
      part({ id: 'c', initiative: 10, created_at: '2026-01-01T00:00:01Z' }),
      part({ id: 'd', initiative: 15, created_at: '2026-01-01T00:00:09Z' }),
    ]);
    expect(store().participants.map((p) => p.id)).toEqual(['d', 'c', 'a', 'b']);
  });
});

describe('usos de Habilidade do combate', () => {
  const useRow = (over: Record<string, unknown> = {}) => ({
    id: 'u1',
    combat_id: 'combat-1',
    user_name: 'Eliabe',
    ability_name: 'Palavra de Autoridade',
    status: 'applied',
    targets: [
      { participantId: 'p2', name: 'Filisteu', conditions: [{ conditionId: 'paralisado' }] },
    ],
    ...over,
  });
  const useHandler = () =>
    h.subscribeToTables.mock.calls[0][1].find(
      (s: { table: string }) => s.table === 'combat_ability_uses',
    ).onChange as (payload: unknown) => void;
  const toasts: string[] = [];
  const onToast = (e: Event) => toasts.push((e as CustomEvent).detail.message);

  beforeEach(() => {
    toasts.length = 0;
    window.addEventListener('combat-toast', onToast);
    return () => window.removeEventListener('combat-toast', onToast);
  });

  it('ao abrir a mesa, carrega os últimos usos do combate', async () => {
    database({ active: combat() });
    h.listCombatAbilityUses.mockResolvedValue([useRow()]);
    store().initSubscriptions('session-1');
    await settle();
    expect(h.listCombatAbilityUses).toHaveBeenCalledWith('combat-1', 10);
    expect(store().abilityUses).toHaveLength(1);
  });

  it('ler mal os usos não impede de abrir o combate', async () => {
    database({ active: combat() });
    h.listCombatAbilityUses.mockRejectedValue(new Error('sem rede'));
    store().initSubscriptions('session-1');
    await settle();
    expect(store().activeCombat?.id).toBe('combat-1');
    expect(store().abilityUses).toEqual([]);
  });

  it('um uso novo entra no começo da lista e avisa a mesa', async () => {
    database({ active: combat() });
    h.listCombatAbilityUses.mockResolvedValue([useRow({ id: 'u0' })]);
    store().initSubscriptions('session-1');
    await settle();
    useHandler()({ eventType: 'INSERT', new: useRow({ id: 'u1' }) });
    expect(store().abilityUses.map((u) => u.id)).toEqual(['u1', 'u0']);
    expect(toasts).toEqual(['Eliabe usou Palavra de Autoridade: Filisteu ficou Paralisado.']);
  });

  it('um uso de outro combate é ignorado', async () => {
    database({ active: combat() });
    store().initSubscriptions('session-1');
    await settle();
    useHandler()({ eventType: 'INSERT', new: useRow({ combat_id: 'outro' }) });
    expect(store().abilityUses).toEqual([]);
    expect(toasts).toEqual([]);
  });

  it('um uso ao vivo chega à tela como evento do uso inteiro', async () => {
    database({ active: combat() });
    store().initSubscriptions('session-1');
    await settle();
    const seen: { id: string }[] = [];
    const listener = (e: Event) => seen.push((e as CustomEvent).detail);
    window.addEventListener('combat-ability', listener);
    useHandler()({ eventType: 'INSERT', new: useRow({ id: 'u7' }) });
    window.removeEventListener('combat-ability', listener);
    expect(seen.map((u) => u.id)).toEqual(['u7']);
  });

  it('um uso com TR chega pendente: o aviso diz o TR e a CD que o Mestre vai lançar', async () => {
    database({ active: combat() });
    store().initSubscriptions('session-1');
    await settle();
    useHandler()({
      eventType: 'INSERT',
      new: useRow({
        status: 'pending',
        cd: 13,
        save_attribute: 'sab',
        ability_name: 'Tática do Cântaro Quebrado',
        targets: [{ participantId: 'p2', name: 'Filisteu', conditions: [] }],
      }),
    });
    expect(toasts).toEqual([
      'Eliabe usou Tática do Cântaro Quebrado: aguardando o Mestre lançar o TR de Sabedoria (CD 13).',
    ]);
  });

  it('o Mestre resolve o TR: o uso é trocado no lugar e o resultado avisa a mesa', async () => {
    database({ active: combat() });
    h.listCombatAbilityUses.mockResolvedValue([
      useRow({ id: 'u0' }),
      useRow({ id: 'u1', status: 'pending' }),
    ]);
    store().initSubscriptions('session-1');
    await settle();
    useHandler()({
      eventType: 'UPDATE',
      new: useRow({
        id: 'u1',
        status: 'resolved',
        ability_name: 'Tática do Cântaro Quebrado',
        targets: [
          {
            participantId: 'p2',
            name: 'Filisteu',
            conditions: [{ conditionId: 'amedrontado' }],
            natural: 4,
            total: 9,
            failed: true,
          },
          {
            participantId: 'p3',
            name: 'Bandido',
            conditions: [],
            natural: 15,
            total: 19,
            failed: false,
          },
        ],
      }),
    });
    expect(store().abilityUses.map((u) => [u.id, u.status])).toEqual([
      ['u0', 'applied'],
      ['u1', 'resolved'],
    ]);
    expect(toasts).toEqual([
      'Eliabe usou Tática do Cântaro Quebrado: Filisteu ficou Amedrontado; Bandido passou no TR.',
    ]);
  });

  it('uma atualização que não resolve nada (expirou) troca o uso e não avisa', async () => {
    database({ active: combat() });
    h.listCombatAbilityUses.mockResolvedValue([useRow({ id: 'u1', status: 'pending' })]);
    store().initSubscriptions('session-1');
    await settle();
    useHandler()({ eventType: 'UPDATE', new: useRow({ id: 'u1', status: 'expired' }) });
    expect(store().abilityUses[0].status).toBe('expired');
    expect(toasts).toEqual([]);
  });

  it('a atualização de um uso de outro combate é ignorada', async () => {
    database({ active: combat() });
    h.listCombatAbilityUses.mockResolvedValue([useRow({ id: 'u1', status: 'pending' })]);
    store().initSubscriptions('session-1');
    await settle();
    useHandler()({
      eventType: 'UPDATE',
      new: useRow({ id: 'u1', combat_id: 'outro', status: 'resolved' }),
    });
    expect(store().abilityUses[0].status).toBe('pending');
  });

  it('limpar a assinatura esvazia os usos', async () => {
    database({ active: combat() });
    h.listCombatAbilityUses.mockResolvedValue([useRow()]);
    store().initSubscriptions('session-1');
    await settle();
    store().cleanupSubscriptions();
    expect(store().abilityUses).toEqual([]);
  });
});
