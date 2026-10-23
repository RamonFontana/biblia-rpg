// As chaves do Supabase local, gravadas por `npm run e2e:up` em e2e/.env.stack. Os testes E2E só
// rodam contra a pilha local: qualquer outro endereço (o projeto real, por exemplo) aborta.
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const STACK_ENV = new URL('../.env.stack', import.meta.url);
const LOCAL_HOSTS = ['127.0.0.1', 'localhost'];

export interface Stack {
  apiUrl: string;
  anonKey: string;
  serviceRoleKey: string;
}

export function readStack(): Stack {
  let raw: string;
  try {
    raw = readFileSync(STACK_ENV, 'utf8');
  } catch {
    throw new Error('Supabase local não encontrado: rode `npm run e2e:up` antes dos testes.');
  }

  const { API_URL, ANON_KEY, SERVICE_ROLE_KEY } = parseEnv(raw);
  if (!API_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
    throw new Error('e2e/.env.stack incompleto: rode `npm run e2e:up` de novo.');
  }
  if (!LOCAL_HOSTS.includes(new URL(API_URL).hostname)) {
    throw new Error(`Os testes E2E só rodam contra o Supabase local; ${API_URL} não é local.`);
  }
  return { apiUrl: API_URL, anonKey: ANON_KEY, serviceRoleKey: SERVICE_ROLE_KEY };
}
