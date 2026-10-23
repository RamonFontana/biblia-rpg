import { readStack } from './support/stack';
import { ensureUsers } from './support/admin';

/** Confere que a pilha local responde e semeia os usuários de teste. */
export default async function globalSetup() {
  const { apiUrl, anonKey } = readStack();

  const health = await fetch(`${apiUrl}/auth/v1/health`, { headers: { apikey: anonKey } }).catch(
    () => null,
  );
  if (!health?.ok) {
    throw new Error(`Supabase local não responde em ${apiUrl}: rode \`npm run e2e:up\`.`);
  }

  await ensureUsers();
}
