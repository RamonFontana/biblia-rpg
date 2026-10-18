#!/usr/bin/env node
// Gate: toda tabela do schema public criada em supabase/migrations precisa ter
// RLS habilitado em alguma migration, e nenhuma migration pode desabilitar RLS.
// Também: toda função SECURITY DEFINER do schema public precisa de um `revoke execute ... from
// anon` (ou public), porque o Postgres dá EXECUTE a todos por padrão e a função roda com os
// privilégios do dono (Onda 3, passo 7).
// Cobre o schema inteiro desde a migration-base (Onda 3, passo 1). Texto entre aspas e
// corpos de função ($$ ... $$) são ignorados, para que SQL citado não conte como tabela.
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
const stripQuoted = (sql) =>
  sql.replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, '').replace(/'(?:[^']|'')*'/g, "''");

const createFnRe = new RegExp(
  String.raw`^create\s+(?:or\s+replace\s+)?function\s+${ident}\s*\(`,
  'i',
);
const dropFnRe = new RegExp(String.raw`^drop\s+function\s+(?:if\s+exists\s+)?${ident}\s*\(`, 'i');
const revokeFnRe = /^revoke\s+(?:all|execute)\s+on\s+function\s+(.+?)\s+from\s+(.+)$/is;

const created = new Map(); // tabela -> migration que a criou
const definerFns = new Map(); // função SECURITY DEFINER -> migration que a criou
const revokedFns = new Set(); // funções sem EXECUTE para anon
const enabled = new Set();
const errors = [];

const files = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

for (const file of files) {
  const sql = stripQuoted(stripComments(readFileSync(join(dir, file), 'utf8')));
  for (const [, name] of sql.matchAll(createRe)) created.set(qualify(name), file);
  for (const [, name] of sql.matchAll(dropRe)) created.delete(qualify(name));
  for (const [, name] of sql.matchAll(enableRe)) enabled.add(qualify(name));
  if (disableRe.test(sql)) errors.push(`${file}: desabilita RLS`);
  disableRe.lastIndex = 0;

  for (const statement of sql.split(';').map((st) => st.trim())) {
    const create = statement.match(createFnRe);
    if (create && /security\s+definer/i.test(statement)) {
      const name = qualify(create[1]);
      if (name.startsWith('public.')) definerFns.set(name, file);
      continue;
    }
    const drop = statement.match(dropFnRe);
    if (drop) {
      definerFns.delete(qualify(drop[1]));
      revokedFns.delete(qualify(drop[1]));
      continue;
    }
    const revoke = statement.match(revokeFnRe);
    if (revoke && /\b(anon|public)\b/i.test(revoke[2])) {
      for (const [, name] of revoke[1].matchAll(new RegExp(String.raw`${ident}\s*\(`, 'g'))) {
        revokedFns.add(qualify(name));
      }
    }
  }
}

for (const [table, file] of created) {
  if (table.startsWith('public.') && !enabled.has(table)) {
    errors.push(`${file}: tabela ${table} sem "enable row level security"`);
  }
}

for (const [fn, file] of definerFns) {
  if (!revokedFns.has(fn)) {
    errors.push(
      `${file}: função SECURITY DEFINER ${fn} sem "revoke execute ... from public, anon"`,
    );
  }
}

if (errors.length > 0) {
  console.error('RLS check falhou:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log(
  `RLS check ok: ${created.size} tabelas e ${definerFns.size} funções SECURITY DEFINER em ${files.length} migrations.`,
);
