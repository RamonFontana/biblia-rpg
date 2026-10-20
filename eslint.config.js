import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

// O client do Supabase só pode ser importado pela camada de dados (ver AGENTS.md).
const supabaseClientImport = {
  group: ['@/lib/supabase', '**/lib/supabase'],
  message: 'Acesse o Supabase pela camada de dados (src/data-access).',
};

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/**', 'src/data-access/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [supabaseClientImport] }],
      // `no-restricted-imports` não enxerga `await import('@/lib/supabase')`.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression[source.value=/lib\\/supabase$/]',
          message: supabaseClientImport.message,
        },
      ],
    },
  },
  {
    // Motor do jogo: puro, sem React, sem Supabase, aleatoriedade injetada.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            supabaseClientImport,
            {
              group: ['react', 'react-dom', 'react/*', '@supabase/*', 'zustand', '@tanstack/*'],
              message: 'src/domain é puro: sem React, Supabase ou estado global.',
            },
            {
              group: [
                '@/components/*',
                '@/features/*',
                '@/hooks/*',
                '@/lib/*',
                '@/pages/*',
                '@/services/*',
                '@/store/*',
                '**/components/**',
                '**/features/**',
                '**/hooks/**',
                '**/lib/**',
                '**/pages/**',
                '**/services/**',
                '**/store/**',
              ],
              message:
                'src/domain só importa de src/domain, src/content e src/types. O que precisa do app fica fora do motor.',
            },
          ],
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Receba um Rng por parâmetro para os testes serem determinísticos.',
        },
      ],
    },
  },
]);
