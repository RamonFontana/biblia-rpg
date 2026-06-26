# Tasks: combat-enemy-cards

**Input**: Design documents from `/specs/039-combat-enemy-cards/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create component skeletons in `src/components/combat/EnemyCombatList.tsx`, `src/components/combat/EnemyCard.tsx`, and `src/components/combat/EnemySheet.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

*(N/A - Data models and realtime syncing are already implemented em `combatStore`)*

---

## Phase 3: User Story 1 - Exibir Inimigos no Combate (Priority: P1) 🎯 MVP

**Goal**: Permitir que o jogador visualize a lista de inimigos presentes na cena do combate.

**Independent Test**: Pode ser testado independentemente iniciando uma cena de combate e verificando se os inimigos são listados na interface do jogador.

### Implementation for User Story 1

- [x] T002 [US1] Implement `EnemyCombatList` in `src/components/combat/EnemyCombatList.tsx` using `useCombatStore` to map participants
- [x] T003 [US1] Integrate `EnemyCombatList` into `src/components/combat/PlayerCombatView.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Consultar Card do Inimigo (Priority: P1)

**Goal**: Permitir interação com os inimigos na lista para visualizar o card (resumo) ou ficha completa.

**Independent Test**: Pode ser testado clicando em um inimigo listado na tela e verificando se o componente de card/ficha é exibido com os dados corretos e HP atualizado em tempo real.

### Implementation for User Story 2

- [x] T004 [P] [US2] Implement `EnemyCard` component in `src/components/combat/EnemyCard.tsx`
- [x] T005 [P] [US2] Implement `EnemySheet` component in `src/components/combat/EnemySheet.tsx`
- [x] T006 [US2] Update `EnemyCombatList` in `src/components/combat/EnemyCombatList.tsx` to render `EnemyCard` and open `EnemySheet` on interaction

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T007 Code cleanup and refactoring in combat components
- [x] T008 Validar layout responsivo (Edge Cases para scroll/quebra de linha com muitos inimigos)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: N/A
- **User Stories (Phase 3+)**: US1 is the foundation for US2.
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup.
- **User Story 2 (P1)**: Requires US1's list layout to exist.

### Parallel Opportunities

- T004 and T005 can be implemented in parallel with T002/T003 once the skeletons are in place.

---

## Parallel Example: User Story 2

```bash
# Launch components implementation for User Story 2 together:
Task: "Implement EnemyCard component in src/components/combat/EnemyCard.tsx"
Task: "Implement EnemySheet component in src/components/combat/EnemySheet.tsx"
```

---

## Implementation Strategy

### Incremental Delivery

1. Complete Setup
2. Add User Story 1 (Exibir Inimigos) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (Consultar Card) → Test independently → Deploy/Demo
4. Each story adds value sem quebrar histórias anteriores.
