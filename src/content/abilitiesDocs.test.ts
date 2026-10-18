// @vitest-environment node
//
// As habilidades de src/content/abilities.ts vêm das tabelas "Resumo de Habilidades" de
// docs/tribos e docs/vocacoes, e docs/ é a fonte da verdade das regras. Este teste trava a
// divergência: cada habilidade tem a linha do doc, com o mesmo Caminho, o mesmo texto de efeito e
// o mesmo custo de Fé. Divergiu? Registre no ROADMAP e pergunte ao autor qual vale.
import { describe, expect, it } from 'vitest';
import { ABILITIES } from './abilities';

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

interface DocRow {
  effect: string;
  faithCost?: number;
}

// | Nome | Nível (Caminho) | Tipo Ação | Dado | Usos/Recarga | Efeito |
const ROW =
  /^\|\s*([^|]+?)\s*\|\s*(\d+)(?:\s*\(([AB])\))?\s*\|[^|]*\|[^|]*\|[^|]*\|\s*(.+?)\s*\|\s*$/;
const COST_PREFIX = /^\(Custo: (\d+) Fé\)\s*/;

function readDocRows(): Map<string, DocRow> {
  const files = import.meta.glob('../../docs/{tribos,vocacoes}/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  const rows = new Map<string, DocRow>();
  for (const [path, text] of Object.entries(files)) {
    const [, dir, file] = path.match(/docs\/(tribos|vocacoes)\/(.+)\.md$/) ?? [];
    if (!dir || file === 'README') continue;
    const sourceType = dir === 'tribos' ? 'tribe' : 'vocation';
    for (const line of text.split('\n')) {
      const match = line.match(ROW);
      if (!match) continue;
      const [, name, level, path, rawEffect] = match;
      const cost = rawEffect.match(COST_PREFIX);
      rows.set(`${sourceType}:${normalize(file)}:${normalize(name)}:${level}${path ?? ''}`, {
        effect: rawEffect.replace(COST_PREFIX, ''),
        faithCost: cost ? Number(cost[1]) : undefined,
      });
    }
  }
  return rows;
}

const keyOf = (a: (typeof ABILITIES)[number]) =>
  `${a.sourceType}:${a.sourceId}:${normalize(a.name)}:${a.minLevel}${a.path ?? ''}`;

describe('habilidades × tabelas dos docs', () => {
  const docRows = readDocRows();

  it('lê as tabelas dos docs', () => {
    expect(docRows.size).toBeGreaterThan(150);
  });

  it('toda habilidade tem a linha do doc (nome, nível e Caminho)', () => {
    expect(ABILITIES.filter((a) => !docRows.has(keyOf(a))).map((a) => a.id)).toEqual([]);
  });

  it('toda linha do doc tem a habilidade no conteúdo', () => {
    const keys = new Set(ABILITIES.map(keyOf));
    expect([...docRows.keys()].filter((key) => !keys.has(key))).toEqual([]);
  });

  it('o texto do efeito é o da tabela do doc', () => {
    const differs = ABILITIES.flatMap((a) => {
      const row = docRows.get(keyOf(a));
      return row && row.effect !== a.effect
        ? [`${a.id}\n  código: ${a.effect}\n  doc:    ${row.effect}`]
        : [];
    });
    expect(differs).toEqual([]);
  });

  it('o custo de Fé é o do "(Custo: N Fé)" da tabela do doc', () => {
    const differs = ABILITIES.flatMap((a) => {
      const row = docRows.get(keyOf(a));
      return row && row.faithCost !== a.faithCost
        ? [`${a.id}: código ${a.faithCost ?? '-'}, doc ${row.faithCost ?? '-'}`]
        : [];
    });
    expect(differs).toEqual([]);
  });
});
