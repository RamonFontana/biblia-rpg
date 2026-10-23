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
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    env: { VITE_SUPABASE_URL: stack.apiUrl, VITE_SUPABASE_ANON_KEY: stack.anonKey },
  },
});
