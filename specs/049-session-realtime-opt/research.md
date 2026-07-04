# Phase 0: Research

**Goal:** Identify best practices and optimization opportunities for Supabase Realtime in the RPG session.

## Findings

1. **Current Pattern**: `useSessionCharacters`, `useSessionTrades` and `useSessionTests` are currently listening to `postgres_changes` but immediately calling a fetch function (e.g. `fetchCharacters`) on every change. This generates N+1 queries during rapid state changes (like losing HP).
2. **Optimized Pattern**: `combatStore.ts` currently uses `payload.new` to mutate the frontend state directly, avoiding additional database reads.
3. **Supabase Broadcast**: Broadcast provides low-latency, ephemeral pub/sub messaging without writing to PostgreSQL. This is ideal for typing indicators, chat, and dice roll events, given the requirement for them to be non-persistent.

## Decisions

- **Decision 1**: Refatorar hooks atuais para usar `payload.new` em vez de refetch.
  - **Rationale**: Reduz carga do banco de dados (0 reads) e melhora a percepção de latência na UI.
- **Decision 2**: Usar Supabase Broadcast no canal `session:<ID>` (ou sub-canal dedicado) para as mensagens OOC e indicadores visuais.
  - **Rationale**: Atende aos requisitos da especificação (efêmero) e reutiliza a conexão WebSocket já aberta para a sessão, não havendo custo de persistência.
