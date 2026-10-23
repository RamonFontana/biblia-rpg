#!/usr/bin/env bash
# Sobe e derruba o Supabase local (Postgres, Auth, Realtime, REST) que os testes E2E usam, em Podman
# ou Docker. Aplica todas as migrations em ordem e grava as chaves locais em e2e/.env.stack.
#   npm run e2e:up      sobe a pilha e grava e2e/.env.stack
#   npm run e2e:down    para os containers (o banco fica no volume)
#   npm run e2e:reset   recria o banco a partir das migrations
#
# O storage do Podman tem de ficar num disco com espaço: o script recusa subir com menos de
# E2E_MIN_FREE_GB (padrão 10) livres no `graphRoot` e mostra onde ele está.
set -euo pipefail

cd "$(dirname "$0")/.."

# Só o que o app usa: Postgres, Kong (gateway), Auth, Realtime e REST.
excluded="studio,imgproxy,vector,logflare,edge-runtime,storage-api,mailpit,postgres-meta,supavisor"
stack_env="e2e/.env.stack"

engine="${CONTAINER_ENGINE:-$(command -v podman || command -v docker || true)}"
[ -n "$engine" ] || { echo "Precisa de Podman ou Docker." >&2; exit 1; }

if [ "$(basename "$engine")" = "podman" ]; then
  systemctl --user start podman.socket 2>/dev/null || true
  export DOCKER_HOST="${DOCKER_HOST:-unix://${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/podman/podman.sock}"

  graph_root="$("$engine" info --format '{{.Store.GraphRoot}}')"
  free_gb="$(df --output=avail -BG "$graph_root" | tail -1 | tr -dc '0-9')"
  min_free_gb="${E2E_MIN_FREE_GB:-10}"
  echo "Storage do Podman: $graph_root ($(df --output=source "$graph_root" | tail -1), ${free_gb} GB livres)"
  if [ "$free_gb" -lt "$min_free_gb" ]; then
    echo "Menos de ${min_free_gb} GB livres no storage do Podman; mova-o para um disco maior." >&2
    exit 1
  fi
fi

case "${1:-}" in
  up)
    npx supabase start --agent no -x "$excluded"
    mkdir -p "$(dirname "$stack_env")"
    npx supabase status --agent no -o env 2>/dev/null \
      | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=' > "$stack_env"
    echo "Chaves locais gravadas em $stack_env"
    ;;
  down)
    npx supabase stop --agent no
    rm -f "$stack_env"
    ;;
  reset)
    npx supabase db reset --agent no --local
    ;;
  *)
    echo "Uso: $0 up|down|reset" >&2
    exit 1
    ;;
esac
