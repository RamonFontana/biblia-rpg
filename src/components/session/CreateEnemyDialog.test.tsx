// CARACTERIZAÇÃO: fixa o que "Criar Inimigo" (durante a sessão) grava hoje: a ficha do inimigo e o
// vínculo com a sessão, com um Supabase falso que só registra as chamadas.
// Termos: CONTEXT.md (Inimigo, Mestre).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FakeCall, FakeResult } from '@/test/fakeSupabase';

const state = vi.hoisted(() => ({
  calls: [] as FakeCall[],
  respond: undefined as ((call: FakeCall) => FakeResult | undefined) | undefined,
}));

vi.mock('@/lib/supabase', async () => {
  const { createFakeSupabase } = await import('@/test/fakeSupabase');
  return {
    supabase: createFakeSupabase({
      calls: state.calls,
      respond: (call) => state.respond?.(call),
    }),
  };
});

vi.mock('@/data-access/auth', () => ({ getCurrentUser: vi.fn() }));

import { getCurrentUser } from '@/data-access/auth';
import { callsOf } from '@/test/fakeSupabase';
import { CreateEnemyDialog } from './CreateEnemyDialog';

beforeEach(() => {
  state.calls.length = 0;
  vi.mocked(getCurrentUser).mockResolvedValue({ id: 'gm-1' } as never);
  state.respond = (call) =>
    call.table === 'characters' && call.op === 'insert' ? { data: { id: 'enemy-1' } } : undefined;
});
afterEach(cleanup);

const submitEnemy = async (onEnemyCreated?: (enemy: { id: string }) => void) => {
  render(<CreateEnemyDialog sessionId="session-1" onEnemyCreated={onEnemyCreated} />);
  fireEvent.click(screen.getByRole('button', { name: /Criar Inimigo/ }));
  fireEvent.change(await screen.findByPlaceholderText('Ex: Lobo Selvagem'), {
    target: { value: 'Lobo Selvagem' },
  });
  const buttons = screen.getAllByRole('button', { name: 'Criar Inimigo' });
  fireEvent.click(buttons[buttons.length - 1]);
};

const createEnemy = async (onEnemyCreated?: (enemy: { id: string }) => void) => {
  await submitEnemy(onEnemyCreated);
  await waitFor(() =>
    expect(callsOf(state.calls, 'session_participants', 'insert')).toHaveLength(1),
  );
};

describe('CreateEnemyDialog', () => {
  it('grava a ficha do inimigo do Mestre, igual à do assistente', async () => {
    await createEnemy();
    const [insert] = callsOf(state.calls, 'characters', 'insert');
    expect(insert.payload).toEqual({
      user_id: 'gm-1',
      is_enemy: true,
      name: 'Lobo Selvagem',
      vocation: '',
      tribe: 'Inimigo',
      has_participated_in_session: true,
      attributes: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
      stats: { pv: 10, current_pv: 10, ca: 10, faith: 0, current_faith: 0 },
      skills: [],
      narrative: { imageUrl: '' },
    });
  });

  it('põe o inimigo na sessão e avisa quem chamou', async () => {
    const onEnemyCreated = vi.fn();
    await createEnemy(onEnemyCreated);
    const [participant] = callsOf(state.calls, 'session_participants', 'insert');
    expect(participant.payload).toEqual({
      session_id: 'session-1',
      character_id: 'enemy-1',
      user_id: 'gm-1',
    });
    expect(onEnemyCreated).toHaveBeenCalledWith({ id: 'enemy-1' });
  });

  it('sem usuário logado não grava nada e deixa o formulário aberto', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await submitEnemy();
    await waitFor(() => expect(getCurrentUser).toHaveBeenCalled());
    await act(async () => {});
    expect(callsOf(state.calls, 'characters', 'insert')).toEqual([]);
    expect(callsOf(state.calls, 'session_participants', 'insert')).toEqual([]);
    expect(screen.getByPlaceholderText('Ex: Lobo Selvagem')).toBeInTheDocument();
    expect(screen.queryByText('Salvando...')).not.toBeInTheDocument();
  });

  it('criar 3 grava 3 fichas independentes, numeradas, e as põe na sessão', async () => {
    const onEnemyCreated = vi.fn();
    render(<CreateEnemyDialog sessionId="session-1" onEnemyCreated={onEnemyCreated} />);
    fireEvent.click(screen.getByRole('button', { name: /Criar Inimigo/ }));
    fireEvent.change(await screen.findByPlaceholderText('Ex: Lobo Selvagem'), {
      target: { value: 'Lobo' },
    });
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '3' } });
    const buttons = screen.getAllByRole('button', { name: 'Criar Inimigo' });
    fireEvent.click(buttons[buttons.length - 1]);
    await waitFor(() =>
      expect(callsOf(state.calls, 'session_participants', 'insert')).toHaveLength(3),
    );
    const names = callsOf(state.calls, 'characters', 'insert').map(
      (call) => (call.payload as { name: string }).name,
    );
    expect(names).toEqual(['Lobo 1', 'Lobo 2', 'Lobo 3']);
    expect(callsOf(state.calls, 'characters', 'insert')[0].payload).not.toHaveProperty('quantity');
    expect(onEnemyCreated).toHaveBeenCalledTimes(3);
  });

  it('a numeração continua a dos inimigos que a sessão já tem', async () => {
    render(<CreateEnemyDialog sessionId="session-1" existingNames={['Lobo 1', 'Lobo 2']} />);
    fireEvent.click(screen.getByRole('button', { name: /Criar Inimigo/ }));
    fireEvent.change(await screen.findByPlaceholderText('Ex: Lobo Selvagem'), {
      target: { value: 'Lobo' },
    });
    const buttons = screen.getAllByRole('button', { name: 'Criar Inimigo' });
    fireEvent.click(buttons[buttons.length - 1]);
    await waitFor(() =>
      expect(callsOf(state.calls, 'session_participants', 'insert')).toHaveLength(1),
    );
    expect((callsOf(state.calls, 'characters', 'insert')[0].payload as { name: string }).name).toBe(
      'Lobo 3',
    );
  });
});
