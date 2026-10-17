#!/usr/bin/env node
// Gate: toda tabela do schema public criada em supabase/migrations precisa ter
// RLS habilitado em alguma migration, e nenhuma migration pode desabilitar RLS.
// Limite conhecido: tabelas criadas pelo dashboard (ex.: characters) não aparecem
// aqui até existir uma migration-base (ver docs/ROADMAP.md, Onda 3).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'supabase/migrations';
const ident = String.raw`((?:"?\w+"?\.)?"?\w+"?)`;
const createRe = new RegExp(String.raw`create\s+table\s+(?:if\s+not\s+exists\s+)?${ident}`, 'gi');
const dropRe = new RegExp(String.raw`drop\s+table\s+(?:if\s+exists\s+)?${ident}`, 'gi');
const enableRe = new RegExp(
  String.raw`alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?${ident}\s+enable\s+row\s+level\s+security`,
  'gi',
);
const disableRe = /disable\s+row\s+level\s+security/gi;

const qualify = (name) => {
  const clean = name.replaceAll('"', '').toLowerCase();
  return clean.includes('.') ? clean : `public.${clean}`;
};
const stripComments = (sql) => sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');

const created = new Map(); // tabela -> migration que a criou
const enabled = new Set();
const errors = [];

const files = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

for (const file of files) {
  const sql = stripComments(readFileSync(join(dir, file), 'utf8'));
  for (const [, name] of sql.matchAll(createRe)) created.set(qualify(name), file);
  for (const [, name] of sql.matchAll(dropRe)) created.delete(qualify(name));
  for (const [, name] of sql.matchAll(enableRe)) enabled.add(qualify(name));
  if (disableRe.test(sql)) errors.push(`${file}: desabilita RLS`);
  disableRe.lastIndex = 0;
}

for (const [table, file] of created) {
  if (table.startsWith('public.') && !enabled.has(table)) {
    errors.push(`${file}: tabela ${table} sem "enable row level security"`);
  }
}

if (errors.length > 0) {
  console.error('RLS check falhou:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log(`RLS check ok: ${created.size} tabelas em ${files.length} migrations.`);
