// @vitest-environment node
// Gate de paleta (scripts/check-palette.mjs): o que conta como cor fora da paleta, o que fica de
// fora, a comparação com a baseline e o fluxo do comando (saída 0 ou 1, --update).
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { compare, findOffPalette, scan } from './check-palette.mjs';

const SCRIPT = resolve('scripts/check-palette.mjs');
const classes = (source) => findOffPalette(source).map((u) => u.match);

describe('findOffPalette: o que conta', () => {
  it.each([
    'bg-blue-500',
    'text-gray-400',
    'border-slate-700',
    'ring-orange-500',
    'from-purple-500',
    'via-pink-500',
    'to-indigo-900',
    'divide-zinc-700',
    'outline-teal-500',
    'fill-cyan-400',
    'stroke-sky-300',
    'placeholder-rose-300',
    'accent-lime-500',
    'caret-fuchsia-500',
    'decoration-violet-500',
    'shadow-yellow-500',
    'shadow-emerald-900',
    'text-neutral-300',
  ])('%s é fora da paleta', (cls) => {
    expect(classes(`<div className="${cls}" />`)).toEqual([cls]);
  });

  it.each(['border-t-blue-500', 'border-x-gray-700', 'ring-offset-blue-500'])(
    '%s (variação de lado ou deslocamento) conta',
    (cls) => {
      expect(classes(`"${cls}"`)).toEqual([cls]);
    },
  );

  it('conta com variantes e opacidade, e guarda a classe inteira', () => {
    expect(classes('"md:hover:bg-blue-600/20 group-hover:text-indigo-300"')).toEqual([
      'md:hover:bg-blue-600/20',
      'group-hover:text-indigo-300',
    ]);
  });

  it('conta cor hexadecimal arbitrária', () => {
    expect(classes('"bg-[#1C1C24] text-[#fff] border-[#12345678]"')).toEqual([
      'bg-[#1C1C24]',
      'text-[#fff]',
      'border-[#12345678]',
    ]);
  });

  it('conta cada uso, mesmo repetido na mesma linha', () => {
    expect(classes('"bg-blue-500 bg-blue-500"')).toHaveLength(2);
  });

  it('informa a linha do uso, a partir de 1', () => {
    const source = 'const a = 1;\nconst b = "x";\nconst c = "bg-blue-500";\n';
    expect(findOffPalette(source)).toEqual([{ line: 3, match: 'bg-blue-500' }]);
  });
});

describe('findOffPalette: branco e preto', () => {
  it.each(['text-white', 'bg-black', 'bg-black/60', 'hover:text-white', 'border-white/10'])(
    '%s conta (a paleta usa pedra no lugar)',
    (cls) => {
      expect(classes(`"${cls}"`)).toEqual([cls]);
    },
  );

  it('o nome dentro de outra palavra não conta', () => {
    expect(classes('"text-whitespace bg-blackout my-text-white"')).toEqual([]);
  });
});

describe('findOffPalette: o que não conta', () => {
  it.each([
    'bg-stone-900',
    'text-amber-500',
    'border-amber-500/50',
    'text-red-400',
    'bg-red-900/30',
    'text-green-400',
    'bg-green-900/30',
    'border-green-700/50',
    'bg-transparent',
    'text-muted-foreground',
    'bg-primary/10',
    'shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    'bg-[url(/x.png)]',
  ])('%s é da paleta ou fica de fora', (cls) => {
    expect(classes(`"${cls}"`)).toEqual([]);
  });

  it('o nome da cor dentro de outra palavra não conta', () => {
    expect(classes('"my-bg-blue-500 bg-blue-500x text-blueberry-500 data-bg-blue-500"')).toEqual(
      [],
    );
  });

  it('número fora do padrão de cor não conta', () => {
    expect(classes('"bg-blue-5 text-blue-12345 bg-blue"')).toEqual([]);
  });
});

describe('compare', () => {
  it('subiu: arquivo com mais usos ou novo', () => {
    const { increased, decreased } = compare({ 'a.tsx': 2 }, { 'a.tsx': 3, 'b.tsx': 1 });
    expect(increased).toEqual([
      { file: 'a.tsx', before: 2, now: 3 },
      { file: 'b.tsx', before: 0, now: 1 },
    ]);
    expect(decreased).toEqual([]);
  });

  it('desceu: arquivo com menos usos ou que sumiu', () => {
    const { increased, decreased } = compare({ 'a.tsx': 3, 'b.tsx': 1 }, { 'a.tsx': 2 });
    expect(increased).toEqual([]);
    expect(decreased).toEqual([
      { file: 'a.tsx', before: 3, now: 2 },
      { file: 'b.tsx', before: 1, now: 0 },
    ]);
  });

  it('igual: nada sobe nem desce', () => {
    expect(compare({ 'a.tsx': 2 }, { 'a.tsx': 2 })).toEqual({ increased: [], decreased: [] });
  });

  it('subir num arquivo não é compensado por descer em outro', () => {
    const { increased, decreased } = compare(
      { 'a.tsx': 5, 'b.tsx': 0 },
      { 'a.tsx': 4, 'b.tsx': 1 },
    );
    expect(increased).toHaveLength(1);
    expect(decreased).toHaveLength(1);
  });
});

describe('scan e o comando', () => {
  let root;
  const write = (rel, content) => {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), content);
  };
  const run = (...args) => {
    const done = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: root, encoding: 'utf8' });
    return { code: done.status, out: done.stdout, err: done.stderr };
  };
  const baseline = () => JSON.parse(readFileSync(join(root, 'palette-baseline.json'), 'utf8'));

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'palette-'));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('lê .ts, .tsx e .css de src/, em qualquer profundidade', () => {
    write('src/a.tsx', '"bg-blue-500"');
    write('src/deep/er/b.ts', '"text-gray-400 text-gray-500"');
    write('src/c.css', '.x { @apply bg-purple-500; }');
    write('src/d.js', '"bg-blue-500"');
    write('src/e.json', '"bg-blue-500"');
    const counts = Object.fromEntries(
      Object.entries(scan(root)).map(([file, list]) => [file, list.length]),
    );
    expect(counts).toEqual({ 'src/a.tsx': 1, 'src/c.css': 1, 'src/deep/er/b.ts': 2 });
  });

  it('devolve os arquivos em ordem de caminho, seja qual for a ordem do disco', () => {
    for (const rel of ['src/a.tsx', 'src/m/x.tsx', 'src/n.tsx', 'src/z.tsx', 'src/B.tsx']) {
      write(rel, '"bg-blue-500"');
    }
    expect(Object.keys(scan(root))).toEqual([
      'src/B.tsx',
      'src/a.tsx',
      'src/m/x.tsx',
      'src/n.tsx',
      'src/z.tsx',
    ]);
  });

  it('deixa de fora os testes, src/test e as cores de Condição', () => {
    write('src/a.test.tsx', '"bg-blue-500"');
    write('src/b.test.ts', '"bg-blue-500"');
    write('src/test/helper.tsx', '"bg-blue-500"');
    write('src/content/conditions.ts', '"bg-blue-500"');
    write('src/content/items.ts', '"bg-blue-500"');
    write('scripts/x.tsx', '"bg-blue-500"');
    expect(Object.keys(scan(root))).toEqual(['src/content/items.ts']);
  });

  it('sem violação e com a baseline igual: sai com 0', () => {
    write('src/a.tsx', '"bg-blue-500"');
    write('palette-baseline.json', JSON.stringify({ 'src/a.tsx': 1 }));
    const { code, out } = run();
    expect(code).toBe(0);
    expect(out).toContain('Paleta ok: 1 usos fora da paleta em 1 arquivos');
  });

  it('uso novo num arquivo da baseline: falha e aponta a linha', () => {
    write('src/a.tsx', 'x\n"bg-blue-500 text-gray-400"');
    write('palette-baseline.json', JSON.stringify({ 'src/a.tsx': 1 }));
    const { code, err } = run();
    expect(code).toBe(1);
    expect(err).toContain('src/a.tsx: 1 → 2');
    expect(err).toContain('src/a.tsx:2  text-gray-400');
  });

  it('arquivo novo com cor fora da paleta: falha', () => {
    write('src/a.tsx', '"bg-stone-900"');
    write('src/b.tsx', '"bg-blue-500"');
    write('palette-baseline.json', JSON.stringify({}));
    const { code, err } = run();
    expect(code).toBe(1);
    expect(err).toContain('src/b.tsx: 0 → 1');
  });

  it('a dívida diminuiu e a baseline não: falha pedindo o --update', () => {
    write('src/a.tsx', '"bg-blue-500"');
    write('palette-baseline.json', JSON.stringify({ 'src/a.tsx': 3 }));
    const { code, err } = run();
    expect(code).toBe(1);
    expect(err).toContain('src/a.tsx: 3 → 1');
    expect(err).toContain('npm run check:palette -- --update');
  });

  it('--update baixa a baseline e a deixa em ordem alfabética', () => {
    write('src/z.tsx', '"bg-blue-500"');
    write('src/a.tsx', '"bg-blue-500 text-gray-400"');
    write(
      'palette-baseline.json',
      JSON.stringify({ 'src/a.tsx': 5, 'src/z.tsx': 1, 'src/gone.tsx': 2 }),
    );
    const { code } = run('--update');
    expect(code).toBe(0);
    expect(Object.entries(baseline())).toEqual([
      ['src/a.tsx', 2],
      ['src/z.tsx', 1],
    ]);
    expect(run().code).toBe(0);
  });

  it('--update se recusa a subir um número', () => {
    write('src/a.tsx', '"bg-blue-500 text-gray-400"');
    write('palette-baseline.json', JSON.stringify({ 'src/a.tsx': 1 }));
    const { code, err } = run('--update');
    expect(code).toBe(1);
    expect(err).toContain('src/a.tsx: 1 → 2');
    expect(baseline()).toEqual({ 'src/a.tsx': 1 });
  });

  it('--update sem baseline cria a primeira com o que existe', () => {
    write('src/a.tsx', '"bg-blue-500"');
    const { code } = run('--update');
    expect(code).toBe(0);
    expect(baseline()).toEqual({ 'src/a.tsx': 1 });
  });

  it('sem baseline e sem --update, o que existe é violação', () => {
    write('src/a.tsx', '"bg-blue-500"');
    expect(run().code).toBe(1);
  });

  it('sem nenhuma cor fora da paleta e sem baseline: sai com 0', () => {
    write('src/a.tsx', '"bg-stone-900 text-green-400"');
    const { code, out } = run();
    expect(code).toBe(0);
    expect(out).toContain('Paleta ok: 0 usos fora da paleta em 0 arquivos');
  });
});
