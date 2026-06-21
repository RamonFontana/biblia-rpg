# Tasks: Mostrar Dano de Armas no Inventário

**Input**: Design documents from `/specs/034-mostrar-dano-armas/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

*(Nenhuma tarefa de setup necessária para esta feature, pois a infraestrutura do projeto já existe e a alteração é focada em UI).*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

*(Nenhuma tarefa fundacional adicional necessária).*

---

## Phase 3: User Story 1 - Visualizar Dado de Dano no Inventário (Priority: P1) 🎯 MVP

**Goal**: Mostrar claramente o dado de dano associado à arma (ex: "1d6 cortante") no inventário ativo da sessão, para que o mestre/jogadores não precisem recorrer às regras base de forma externa.

**Independent Test**: Abra o inventário de um personagem na sessão ativa e verifique se as armas estão exibindo seus dados de dano e que itens que não são armas (ex: armaduras, consumíveis) não exibem campos de dano vazios ou incorretos.

### Implementation for User Story 1

- [x] T001 [US1] Importar a constante `ITEMS_DB` do banco de dados local em `src/components/inventory/InventoryList.tsx`.
- [x] T002 [US1] No mapeamento de itens do `InventoryList.tsx`, buscar o item base do dicionário local `ITEMS_DB` através da propriedade `name`.
- [x] T003 [US1] Determinar o `displayDamage` combinando ou utilizando como fallback as propriedades `damage` do banco de itens (`dbItem.damage`) ou o próprio `normalizedEffects.damageDie` em `src/components/inventory/InventoryList.tsx`.
- [x] T004 [US1] Modificar o bloco JSX de renderização condicional do Dano para exibir o `displayDamage` calculado no componente `src/components/inventory/InventoryList.tsx`.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T005 Remover logs desnecessários ou limpar o código ajustado.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: N/A
- **Foundational (Phase 2)**: N/A
- **User Stories (Phase 3+)**: Can start immediately.

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies. Can start immediately.

### Parallel Opportunities

- The tasks inside User Story 1 are sequential as they modify the same file `InventoryList.tsx`.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1
2. **STOP and VALIDATE**: Test User Story 1 independently in the browser
3. Done!
