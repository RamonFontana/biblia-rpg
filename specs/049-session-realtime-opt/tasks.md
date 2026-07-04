# Tasks: Otimização de Realtime da Sessão

**Input**: Design documents from `/specs/049-session-realtime-opt/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: User Story 1 - Atualizações Síncronas Corretas e Sem Delay (Priority: P1) 🎯 MVP

**Goal**: Ao perder HP ou mudar status, interface atualiza instantaneamente (0 fetches ao DB), mutando estado local com `payload.new`.

**Independent Test**: Modificar HP de um personagem com 2 abas abertas e ver o update síncrono.

### Implementation for User Story 1

- [x] T001 [P] [US1] Refatorar `src/hooks/useSessionCharacters.ts` para mutar o cache local com `payload.new` em vez de chamar refetch.
- [x] T002 [P] [US1] Refatorar `src/hooks/useSessionTrades.ts` para mutar o cache local com `payload.new` em vez de chamar refetch.
- [x] T003 [P] [US1] Refatorar `src/hooks/useSessionTests.ts` para mutar o cache local com `payload.new` em vez de chamar refetch.

**Checkpoint**: At this point, the feature should be fully functional and testable independently.

---

## Dependencies & Execution Order

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies.

### Parallel Opportunities

- Todos os refactors de hooks na US1 podem ocorrer paralelamente.
