// Uma tabela fora da publicação `supabase_realtime` derruba o canal inteiro que a assina: o servidor
// responde "Unable to subscribe to changes" e nenhum outro evento do canal chega. Foi o que
// escondeu a falta de `session_participants` (ROADMAP, Onda 4, passo 8d). Este teste liga o que o
// app assina ao que as migrations publicam.
import { describe, expect, it } from 'vitest';

const migrations = import.meta.glob('../../supabase/migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const sources = import.meta.glob(
  ['../**/*.ts', '../**/*.tsx', '!../**/*.test.ts', '!../**/*.test.tsx'],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
) as Record<string, string>;

/** Tabelas que alguma migration põe na publicação, nas duas grafias (`"public"."t"` e `public.t`). */
function publishedTables(): Set<string> {
  const sql = Object.values(migrations).join('\n');

  const tables = new Set<string>();
  const statement =
    /alter\s+publication\s+"?supabase_realtime"?\s+add\s+table\s+(?:only\s+)?([^;]+);/gi;
  for (const match of sql.matchAll(statement)) {
    for (const name of (match[1] ?? '').split(',')) {
      tables.add(name.replace(/["\s]/g, '').replace(/^public\./, ''));
    }
  }
  return tables;
}

/** Tabelas que o app assina: o `table: '...'` de cada arquivo que chama `subscribeToTables`. */
function subscribedTables(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  for (const [file, text] of Object.entries(sources)) {
    if (!text.includes('subscribeToTables(')) continue;
    for (const match of text.matchAll(/table:\s*'([a-z_]+)'/g)) {
      const table = match[1] ?? '';
      found.set(table, [...(found.get(table) ?? []), file]);
    }
  }
  return found;
}

describe('publicação do Realtime', () => {
  it('as migrations publicam as tabelas que o teste conhece', () => {
    expect([...publishedTables()]).toEqual(expect.arrayContaining(['trades', 'session_npcs']));
  });

  it('o app encontra as tabelas que assina', () => {
    expect([...subscribedTables().keys()]).toEqual(
      expect.arrayContaining(['trades', 'session_npcs', 'session_participants']),
    );
  });

  it('toda tabela que o app assina está na publicação', () => {
    const published = publishedTables();
    const missing = [...subscribedTables()].filter(([table]) => !published.has(table));

    expect(missing).toEqual([]);
  });
});
