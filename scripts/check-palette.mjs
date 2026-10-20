#!/usr/bin/env node
// Gate (ratchet): conta, por arquivo de src/, as classes Tailwind de cor fora da paleta de
// docs/DESIGN.md (pedra, âmbar, vermelho e o verde de sucesso). A dívida existente fica em
// palette-baseline.json e só diminui: um arquivo com mais usos que a baseline falha, e um com
// menos também, até a baseline ser baixada (`npm run check:palette -- --update`, que se recusa a
// subir qualquer número). Onda 4, passo 6b.
//
// Conta: bg/text/border/ring/from/via/to/divide/outline/fill/stroke/placeholder/accent/caret/
// decoration/shadow com uma cor fora da paleta (`bg-blue-500`, `md:hover:text-indigo-300/70`) e
// cor hexadecimal arbitrária (`bg-[#1C1C24]`). Não conta: `white`/`black` (fundos de diálogo e
// texto sobre botão), `rgba(...)` dentro de sombras arbitrárias e as exceções abaixo.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const BASELINE_FILE = 'palette-baseline.json';

const OFF_PALETTE = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'orange',
  'yellow',
  'lime',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
];
const UTILITIES = [
  'bg',
  'text',
  'border(?:-[xytblrse])?',
  'ring(?:-offset)?',
  'from',
  'via',
  'to',
  'divide',
  'outline',
  'fill',
  'stroke',
  'placeholder',
  'accent',
  'caret',
  'decoration',
  'shadow',
].join('|');
const OFF_PALETTE_RE = new RegExp(
  String.raw`(?<![\w-])(?:[\w-]+:)*(?:${UTILITIES})-(?:(?:${OFF_PALETTE.join('|')})-\d{2,3}(?:/\d+)?|\[#[0-9a-fA-F]{3,8}\])(?![\w-])`,
  'g',
);

// Fora da contagem: testes (citam classes para provar a receita), o diretório de apoio aos
// testes e as cores semânticas de Condição, exceção prevista em docs/DESIGN.md.
const EXEMPT = [/\.test\.tsx?$/, /^src\/test\//, /^src\/content\/conditions\.ts$/];
const SCANNED = /\.(?:tsx?|css)$/;

/** Cada uso de cor fora da paleta num texto: `{ line, match }`. */
export function findOffPalette(source) {
  const found = [];
  for (const m of source.matchAll(OFF_PALETTE_RE)) {
    const line = source.slice(0, m.index).split('\n').length;
    found.push({ line, match: m[0] });
  }
  return found;
}

function listFiles(dir, root) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full, root);
    const rel = relative(root, full).split(sep).join('/');
    return SCANNED.test(rel) && !EXEMPT.some((re) => re.test(rel)) ? [rel] : [];
  });
}

/** Usos por arquivo de `src/`: `{ 'src/a.tsx': [{ line, match }, ...] }`, só quem tem algum. */
export function scan(root = '.') {
  const result = {};
  for (const rel of listFiles(join(root, 'src'), root).sort()) {
    const found = findOffPalette(readFileSync(join(root, rel), 'utf8'));
    if (found.length > 0) result[rel] = found;
  }
  return result;
}

/** Compara a contagem de agora com a baseline: arquivos que subiram e arquivos que desceram. */
export function compare(baseline, counts) {
  const increased = [];
  const decreased = [];
  for (const file of new Set([...Object.keys(baseline), ...Object.keys(counts)])) {
    const before = baseline[file] ?? 0;
    const now = counts[file] ?? 0;
    if (now > before) increased.push({ file, before, now });
    else if (now < before) decreased.push({ file, before, now });
  }
  return { increased, decreased };
}

const toCounts = (usages) =>
  Object.fromEntries(Object.entries(usages).map(([file, list]) => [file, list.length]));

function main(argv) {
  const update = argv.includes('--update');
  const usages = scan();
  const counts = toCounts(usages);
  const hasBaseline = existsSync(BASELINE_FILE);
  const baseline = hasBaseline ? JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) : {};
  const { increased, decreased } = compare(baseline, counts);
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  if (increased.length > 0 && !(update && !hasBaseline)) {
    console.error('Cor fora da paleta de docs/DESIGN.md (a dívida só pode diminuir):');
    for (const { file, before, now } of increased) {
      console.error(`\n  ${file}: ${before} → ${now}`);
      for (const { line, match } of usages[file]) console.error(`    ${file}:${line}  ${match}`);
    }
    console.error(
      '\nUse pedra, âmbar, vermelho (erro) ou verde (sucesso). Cores de estado: docs/DESIGN.md.',
    );
    return 1;
  }

  if (update) {
    // `scan` já ordena os caminhos por ordem de código, igual em qualquer máquina.
    writeFileSync(BASELINE_FILE, `${JSON.stringify(counts, null, 2)}\n`);
    console.log(
      `${BASELINE_FILE} atualizada: ${total} usos em ${Object.keys(counts).length} arquivos.`,
    );
    return 0;
  }

  if (decreased.length > 0) {
    console.error('A baseline de cores está desatualizada (a dívida diminuiu):');
    for (const { file, before, now } of decreased) console.error(`  ${file}: ${before} → ${now}`);
    console.error('\nRode `npm run check:palette -- --update` e commite a baseline.');
    return 1;
  }

  console.log(`Paleta ok: ${total} usos fora da paleta em ${Object.keys(counts).length} arquivos.`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
