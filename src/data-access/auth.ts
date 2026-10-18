// Autenticação: toda chamada a `supabase.auth` passa por aqui. As funções lançam o erro do
// Supabase; quem chama decide a mensagem (ver `getErrorMessage`).
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type { Session, User };

export async function signInWithPassword(email: string, password: string): Promise<Session | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export interface SignUpResult {
  user: User | null;
  /** Nula enquanto o e-mail não foi confirmado. */
  session: Session | null;
}

export async function signUp(email: string, password: string): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return { user: data.user, session: data.session };
}

/** Abre o fluxo OAuth do Google; o navegador sai da página e volta em `redirectTo`. */
export async function signInWithGoogle(redirectTo: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw error;
}

export async function requestPasswordReset(email: string, redirectTo: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** O usuário logado, ou nulo. */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Avisa de cada mudança de sessão (login, logout, renovação). Devolve a função que cancela. */
export function onAuthStateChange(listener: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => listener(session));
  return () => data.subscription.unsubscribe();
}
