# Implementation Plan: Otimização de Realtime da Sessão

**Branch**: `049-session-realtime-opt` | **Date**: 2026-07-03 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/049-session-realtime-opt/spec.md)

**Input**: Feature specification from `/specs/049-session-realtime-opt/spec.md`

## Summary

Otimizar o fluxo de atualização em tempo real da sessão do RPG, substituindo os refetches (SELECTs) completos por atualizações puramente locais baseadas no `payload.new` do Supabase `postgres_changes`.

## Technical Context

**Language/Version**: TypeScript, React 18
**Primary Dependencies**: Supabase JS Client, Zustand, React (Hooks)
**Storage**: N/A
**Project Type**: Web Application
**Performance Goals**: Latência < 100ms percebidos, 0 chamadas adicionais de leitura (SELECT) pós alteração.

## Project Structure

### Documentation (this feature)

```text
specs/049-session-realtime-opt/
├── plan.md              # This file
├── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── hooks/
│   ├── useSessionCharacters.ts   # Atualizar para mutar estado local usando payload.new
│   ├── useSessionTrades.ts       # Atualizar para mutar estado local
│   └── useSessionTests.ts        # Atualizar para mutar estado local
```

**Structure Decision**: Refatorar os hooks existentes sem criar novas abstrações complexas, apenas aplicando a lógica já observada com sucesso no `combatStore.ts`.
