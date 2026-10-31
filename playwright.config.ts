import { defineConfig, devices } from '@playwright/test';
import { readStack } from './e2e/support/stack';

// Porta própria e `reuseExistingServer: false`: nunca reaproveita um `npm run dev` que aponte para o
// Supabase real. O servidor sobe com as chaves da pilha local (variáveis do processo vencem o .env).
const port = 5174;
const stack = readStack();

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // O celular (Pixel 7, Chromium nativo): a moldura da sessão muda de forma abaixo de `md`.
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testMatch: ['session.spec.ts', 'ability.spec.ts', 'combat.spec.ts', 'map.spec.ts'],
    },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    env: { VITE_SUPABASE_URL: stack.apiUrl, VITE_SUPABASE_ANON_KEY: stack.anonKey },
  },
});
