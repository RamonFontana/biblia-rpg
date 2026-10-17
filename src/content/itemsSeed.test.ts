// @vitest-environment node
//
// O seed da tabela `items` sai do conteúdo (ADR 0003). Estes testes fixam o formato do SQL e
// travam o esquecimento: mudar src/content/items.ts sem rodar `npm run gen:items-seed` falha aqui.
import { describe, expect, it } from 'vitest';
import { ITEMS_DB } from './items';
import { buildItemsSeedSql } from './itemsSeed';
import type { ContentItem } from './schemas';

const item = (overrides: Partial<ContentItem>): ContentItem => ({
  id: 'x',
  name: 'X',
  type: 'Utilidade',
  category: 'Todas',
  description: 'desc',
  cost: 1,
  ...overrides,
});

describe('buildItemsSeedSql', () => {
  it('dobra aspas simples nos textos', () => {
    const sql = buildItemsSeedSql([item({ name: "Cajado d'Água", description: "it's" })]);
    expect(sql).toContain(`'Cajado d''Água', 'it''s'`);
  });

  it('grava o tipo do item em category e marca só o Consumível como consumível', () => {
    const sql = buildItemsSeedSql([
      item({ id: 'a', type: 'Arma', category: 'Marcial', damage: '1d6 cortante' }),
      item({ id: 'b', type: 'Consumível' }),
    ]);
    expect(sql).toContain(`('a', 'X', 'desc', 'Arma', false, 1,`);
    expect(sql).toContain(`('b', 'X', 'desc', 'Consumível', true, 1,`);
  });

  it('preserva o preço fracionado e escreve as Resistências a Condição como array', () => {
    const sql = buildItemsSeedSql([
      item({ id: 'a', cost: 0.025 }),
      item({ id: 'b', conditionResistances: ['sangrando', 'envenenado'] }),
    ]);
    expect(sql).toContain(`false, 0.025, '{}'::text[])`);
    expect(sql).toContain(`array['sangrando', 'envenenado']::text[])`);
  });

  it('atualiza por slug quando a linha já existe', () => {
    expect(buildItemsSeedSql([item({})])).toContain('on conflict (slug) do update set');
  });
});

describe('seed de itens versionado', () => {
  const seeds = import.meta.glob('../../supabase/migrations/*_seed_items.sql', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  it('a migration de seed mais recente reflete o conteúdo atual', () => {
    const latest = Object.keys(seeds).sort().at(-1);
    expect(latest, 'nenhuma migration *_seed_items.sql').toBeDefined();
    expect(
      seeds[latest!],
      'src/content/items.ts mudou: rode `npm run gen:items-seed` e confirme a migration',
    ).toBe(buildItemsSeedSql(ITEMS_DB));
  });
});
