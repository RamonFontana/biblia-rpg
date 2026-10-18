// Fixa o contrato da camada de autenticação: as funções lançam o erro do Supabase, devolvem só o
// que as telas usam e o cancelamento do listener chega ao Supabase.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithOAuth: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({ supabase: { auth } }));

import {
  getCurrentUser,
  getSession,
  onAuthStateChange,
  requestPasswordReset,
  signInWithGoogle,
  signInWithPassword,
  signOut,
  signUp,
  updatePassword,
} from './auth';

const failure = { message: 'falhou' };

beforeEach(() => {
  Object.values(auth).forEach((fn) => fn.mockReset());
});

describe('signInWithPassword', () => {
  it('envia e-mail e senha e devolve a sessão', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { session: { id: 's1' } }, error: null });
    await expect(signInWithPassword('a@b.com', 'segredo')).resolves.toEqual({ id: 's1' });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'segredo' });
  });

  it('lança o erro do Supabase', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: failure });
    await expect(signInWithPassword('a@b.com', 'x')).rejects.toBe(failure);
  });
});

describe('signUp', () => {
  it('devolve usuário e sessão (a sessão é nula até confirmar o e-mail)', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: 'u1' }, session: null }, error: null });
    await expect(signUp('a@b.com', 'segredo')).resolves.toEqual({
      user: { id: 'u1' },
      session: null,
    });
    expect(auth.signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'segredo' });
  });

  it('devolve a sessão quando a confirmação de e-mail está desligada', async () => {
    auth.signUp.mockResolvedValue({
      data: { user: { id: 'u1' }, session: { id: 's1' } },
      error: null,
    });
    await expect(signUp('a@b.com', 'segredo')).resolves.toEqual({
      user: { id: 'u1' },
      session: { id: 's1' },
    });
  });

  it('lança o erro do Supabase', async () => {
    auth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: failure });
    await expect(signUp('a@b.com', 'x')).rejects.toBe(failure);
  });
});

describe('signInWithGoogle', () => {
  it('abre o OAuth do Google com o retorno pedido', async () => {
    auth.signInWithOAuth.mockResolvedValue({ error: null });
    await signInWithGoogle('https://app/auth/callback');
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://app/auth/callback' },
    });
  });

  it('lança o erro do Supabase', async () => {
    auth.signInWithOAuth.mockResolvedValue({ error: failure });
    await expect(signInWithGoogle('https://app')).rejects.toBe(failure);
  });
});

describe('requestPasswordReset e updatePassword', () => {
  it('pedem a redefinição com o e-mail e o retorno', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    await requestPasswordReset('a@b.com', 'https://app/reset-password');
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.com', {
      redirectTo: 'https://app/reset-password',
    });
  });

  it('lançam o erro do Supabase', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: failure });
    await expect(requestPasswordReset('a@b.com', 'x')).rejects.toBe(failure);
    auth.updateUser.mockResolvedValue({ error: failure });
    await expect(updatePassword('nova')).rejects.toBe(failure);
  });

  it('grava a senha nova', async () => {
    auth.updateUser.mockResolvedValue({ error: null });
    await updatePassword('nova');
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'nova' });
  });
});

describe('sessão e usuário', () => {
  it('signOut encerra a sessão', async () => {
    auth.signOut.mockResolvedValue({ error: null });
    await signOut();
    expect(auth.signOut).toHaveBeenCalledOnce();
  });

  it('getSession devolve a sessão ou nulo', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { id: 's1' } } });
    await expect(getSession()).resolves.toEqual({ id: 's1' });
    auth.getSession.mockResolvedValue({ data: { session: null } });
    await expect(getSession()).resolves.toBeNull();
  });

  it('getCurrentUser devolve o usuário ou nulo', async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    await expect(getCurrentUser()).resolves.toEqual({ id: 'u1' });
    auth.getUser.mockResolvedValue({ data: { user: null } });
    await expect(getCurrentUser()).resolves.toBeNull();
  });
});

describe('onAuthStateChange', () => {
  it('entrega só a sessão ao ouvinte e devolve o cancelamento', () => {
    const unsubscribe = vi.fn();
    let supabaseListener: (event: string, session: unknown) => void = () => {};
    auth.onAuthStateChange.mockImplementation((listener) => {
      supabaseListener = listener;
      return { data: { subscription: { unsubscribe } } };
    });

    const listener = vi.fn();
    const stop = onAuthStateChange(listener);
    supabaseListener('SIGNED_IN', { id: 's1' });
    expect(listener).toHaveBeenCalledWith({ id: 's1' });

    expect(unsubscribe).not.toHaveBeenCalled();
    stop();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
