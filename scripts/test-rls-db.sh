#!/usr/bin/env bash
# Testa o RLS e as funções do banco num Postgres descartável (imagem do Supabase), com todas as
# migrations aplicadas em ordem e depois supabase/tests/rls.sql. Precisa de Podman ou Docker.
#   npm run test:rls-db
set -euo pipefail

engine="${CONTAINER_ENGINE:-$(command -v podman || command -v docker || true)}"
[ -n "$engine" ] || { echo "Precisa de Podman ou Docker." >&2; exit 1; }

image="public.ecr.aws/supabase/postgres:17.6.1.127"
name="rls-test-$$"
psql_in() { "$engine" exec -i "$name" psql -U postgres -v ON_ERROR_STOP=1 -q "$@"; }

"$engine" run -d --rm --name "$name" -e POSTGRES_PASSWORD=postgres "$image" >/dev/null
trap '"$engine" rm -f "$name" >/dev/null 2>&1 || true' EXIT

# A imagem reinicia o Postgres ao inicializar: espera os papéis do Supabase existirem.
for _ in $(seq 1 60); do
  if psql_in -tAc "select 1 from pg_roles where rolname = 'authenticated'" 2>/dev/null | grep -q 1; then
    break
  fi
  sleep 2
done
sleep 2

for migration in supabase/migrations/*.sql; do
  psql_in -o /dev/null < "$migration"
done
psql_in < supabase/tests/rls.sql
