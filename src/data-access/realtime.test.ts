// Fixa o encanamento do realtime: cada assinatura vira um listener `postgres_changes` do canal, a
// presença anuncia o usuário e só entrega o estado enquanto o canal está ativo.
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface FakeChannel {
  name: string;
  options?: unknown;
  listeners: { type: string; filter: unknown; callback: (payload: unknown) => void }[];
  presenceStateValue: Record<string, unknown>;
  track: ReturnType<typeof vi.fn>;
  subscribeCallback?: (status: string) => Promise<void> | void;
  subscribed: boolean;
  on: (type: string, filter: unknown, callback: (payload: unknown) => void) => FakeChannel;
  subscribe: (callback?: (status: string) => Promise<void> | void) => FakeChannel;
  presenceState: () => Record<string, unknown>;
}

const state = vi.hoisted(() => ({
  channels: [] as unknown[],
  removed: [] as unknown[],
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: (name: string, options?: unknown) => {
      const channel: FakeChannel = {
        name,
        options,
        listeners: [],
        presenceStateValue: {},
        track: vi.fn().mockResolvedValue('ok'),
        subscribed: false,
        on(type, filter, callback) {
          channel.listeners.push({ type, filter, callback });
          return channel;
        },
        subscribe(callback) {
          channel.subscribed = true;
          channel.subscribeCallback = callback;
          return channel;
        },
        presenceState: () => channel.presenceStateValue,
      };
      state.channels.push(channel);
      return channel;
    },
    removeChannel: (channel: unknown) => {
      state.removed.push(channel);
    },
  },
}));

import { joinSessionPresence, subscribeToTables, uniquePresenceUsers } from './realtime';

const channels = () => state.channels as FakeChannel[];

beforeEach(() => {
  state.channels.length = 0;
  state.removed.length = 0;
});

describe('subscribeToTables', () => {
  it('cria um canal com um listener por tabela e assina', () => {
    subscribeToTables('canal', [
      { table: 'characters', onChange: () => {} },
      { table: 'trades', filter: 'session_id=eq.s1', onChange: () => {} },
    ]);

    const [channel] = channels();
    expect(channel.name).toBe('canal');
    expect(channel.subscribed).toBe(true);
    expect(channel.listeners.map((l) => l.type)).toEqual(['postgres_changes', 'postgres_changes']);
    expect(channel.listeners[0].filter).toStrictEqual({
      event: '*',
      schema: 'public',
      table: 'characters',
    });
    expect(channel.listeners[1].filter).toEqual({
      event: '*',
      schema: 'public',
      table: 'trades',
      filter: 'session_id=eq.s1',
    });
  });

  it('respeita o evento pedido', () => {
    subscribeToTables('canal', [{ table: 'characters', event: 'UPDATE', onChange: () => {} }]);
    expect(channels()[0].listeners[0].filter).toMatchObject({ event: 'UPDATE' });
  });

  it('entrega o payload ao onChange da assinatura', () => {
    const onChange = vi.fn();
    subscribeToTables('canal', [{ table: 'characters', onChange }]);
    channels()[0].listeners[0].callback({ new: { id: 'c1' } });
    expect(onChange).toHaveBeenCalledWith({ new: { id: 'c1' } });
  });

  it('o cancelamento remove o canal', () => {
    const stop = subscribeToTables('canal', [{ table: 'characters', onChange: () => {} }]);
    expect(state.removed).toEqual([]);
    stop();
    expect(state.removed).toEqual([channels()[0]]);
  });
});

describe('uniquePresenceUsers', () => {
  const user = (id: string, onlineAt: string) => ({ user_id: id, online_at: onlineAt });

  it('fica com o último registro de cada usuário, na ordem em que o usuário apareceu', () => {
    expect(
      uniquePresenceUsers([user('a', '1'), user('b', '2'), user('a', '3')]).map((u) => [
        u.user_id,
        u.online_at,
      ]),
    ).toEqual([
      ['a', '3'],
      ['b', '2'],
    ]);
  });
});

describe('joinSessionPresence', () => {
  const me = { user_id: 'u1', online_at: 'agora', name: 'Ana' };

  it('entra no canal da sessão com a chave do usuário', () => {
    joinSessionPresence('s1', me, () => {});
    const [channel] = channels();
    expect(channel.name).toBe('presence_session_s1');
    expect(channel.options).toEqual({ config: { presence: { key: 'u1' } } });
    expect(channel.listeners[0]).toMatchObject({
      type: 'presence',
      filter: { event: 'sync' },
    });
  });

  it('anuncia o usuário quando o canal assina', async () => {
    joinSessionPresence('s1', me, () => {});
    const [channel] = channels();
    await channel.subscribeCallback?.('SUBSCRIBED');
    expect(channel.track).toHaveBeenCalledWith(me);
  });

  it('não anuncia em outro estado do canal', async () => {
    joinSessionPresence('s1', me, () => {});
    const [channel] = channels();
    await channel.subscribeCallback?.('CHANNEL_ERROR');
    expect(channel.track).not.toHaveBeenCalled();
  });

  it('registra o erro de anunciar sem derrubar a presença', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    joinSessionPresence('s1', me, () => {});
    const [channel] = channels();
    channel.track.mockRejectedValue(new Error('rede'));
    await channel.subscribeCallback?.('SUBSCRIBED');
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('entrega os usuários online, um por usuário, a cada sincronização', () => {
    const onSync = vi.fn();
    joinSessionPresence('s1', me, onSync);
    const [channel] = channels();
    channel.presenceStateValue = {
      u1: [{ user_id: 'u1', online_at: '1' }],
      u2: [
        { user_id: 'u2', online_at: '2' },
        { user_id: 'u2', online_at: '3' },
      ],
      lixo: 'não é lista',
    };
    channel.listeners[0].callback({});
    expect(onSync).toHaveBeenCalledWith([
      { user_id: 'u1', online_at: '1' },
      { user_id: 'u2', online_at: '3' },
    ]);
  });

  it('depois de sair, remove o canal e ignora sincronizações e anúncios atrasados', async () => {
    const onSync = vi.fn();
    const leave = joinSessionPresence('s1', me, onSync);
    const [channel] = channels();
    leave();
    expect(state.removed).toEqual([channel]);

    channel.listeners[0].callback({});
    await channel.subscribeCallback?.('SUBSCRIBED');
    expect(onSync).not.toHaveBeenCalled();
    expect(channel.track).not.toHaveBeenCalled();
  });
});
