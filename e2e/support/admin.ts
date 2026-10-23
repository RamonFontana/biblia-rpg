// Cliente com a chave de serviço do Supabase local, para montar e limpar os dados de cada teste
// sem passar pela interface (que é o que os testes verificam).
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database.types';
import { readStack } from './stack';

export const PASSWORD = 'e2e-senha-123';

export const USERS = {
  master: 'mestre@e2e.test',
  player1: 'jogador1@e2e.test',
  player2: 'jogador2@e2e.test',
} as const;

export type UserKey = keyof typeof USERS;

export function adminClient() {
  const { apiUrl, serviceRoleKey } = readStack();
  return createClient<Database>(apiUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cria os usuários de teste que ainda não existem e devolve o id de cada um. */
export async function ensureUsers(): Promise<Record<UserKey, string>> {
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;

  const ids = {} as Record<UserKey, string>;
  for (const key of Object.keys(USERS) as UserKey[]) {
    const email = USERS[key];
    const existing = data.users.find((user) => user.email === email);
    if (existing) {
      ids[key] = existing.id;
      continue;
    }
    const created = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (created.error) throw created.error;
    ids[key] = created.data.user.id;
  }
  return ids;
}
