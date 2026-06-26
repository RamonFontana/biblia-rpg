# Tasks: 037-item-level-ac-realtime

**Input**: Design documents from `/specs/037-item-level-ac-realtime/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure (Existing project, so just environment prep)

- [ ] T001 Verify local environment and Supabase CLI setup per `specs/037-item-level-ac-realtime/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Create migration file `supabase/migrations/20260625000000_add_item_level.sql` to add `level` to `character_items` and `trade_items`
- [x] T003 [P] Update `src/types/database.types.ts` to include `level: number` on `CharacterItem` and `TradeItem` interfaces

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Visualizar Nível do Item e Bônus de CA Correspondente (Priority: P1) 🎯 MVP

**Goal**: Mostrar o nível de cada item no inventário e quanto de CA extra aquele nível confere.

**Independent Test**: Abrir o inventário de um personagem e verificar que cada armadura/escudo exibe seu nível atual (ex: "Nível 3").

### Implementation for User Story 1

- [ ] T004 [P] [US1] Update `src/components/inventory/EquipmentSlots.tsx` to display item level when equipped
- [ ] T005 [P] [US1] Update `src/components/inventory/CharacterInventory.tsx` to display item level in the inventory list

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - CA do Personagem Atualiza ao Equipar Item com Nível (Priority: P1)

**Goal**: Ao equipar ou desequipar uma armadura de determinado nível, a Classe de Armadura (CA) é recalculada imediatamente com o bônus do nível incluído.

**Independent Test**: Equipar uma armadura de nível 1, verificar a CA, depois simular (ou equipar) a mesma armadura de nível 5 e confirmar que a CA aumentou proporcionalmente (Nível - 1).

### Implementation for User Story 2

- [x] T006 [US2] Update `getCombatStats` in `src/lib/equipmentUtils.ts` to add `(level - 1)` from equipped armor and shields to total AC

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Todos os Jogadores Veem a Mudança de CA em Tempo Real (Priority: P1)

**Goal**: Alteração de CA deve ser visível imediatamente na ficha para todos os participantes da sessão, sem necessidade de recarregar a página.

**Independent Test**: Em dois navegadores, um jogador equipa uma armadura, e no outro dispositivo a CA atualizada aparece sem refresh.

### Implementation for User Story 3

- [x] T007 [US3] Verify `src/components/session/SessionParticipantList.tsx` and related state hooks successfully recalculate CA when `level` changes in DB

**Checkpoint**: All user stories 1, 2, 3 and 4 should now be independently functional

---

## Phase 6: User Story 4 - Definir/Alterar Nível do Item (Priority: P2)

**Goal**: O mestre pode definir ou alterar o nível de um item no inventário de um personagem. Apenas o mestre.

**Independent Test**: O mestre acessa o inventário de um personagem, seleciona um item, altera seu nível, e verifica que o bônus de CA reflete a mudança. O jogador não deve ver os botões de alterar nível.

### Implementation for User Story 4

- [x] T008 [US4] Add +/- buttons in `src/components/inventory/InventoryList.tsx` visible only to GM
- [x] T009 [US4] Implement Supabase update logic in `src/components/character/CharacterSheetView.tsx` and pass to `InventoryList.tsx` to persist level changes to `character_items`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T010 Code cleanup and refactoring (Fixed bug where CA calculation ignored level and items lacking effects JSON from DB)
- [ ] T011 Run quickstart.md validation locally to ensure DB migrations and UI behave correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially in priority order (P1 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P1)**: Can start after Foundational (Phase 2)
- **User Story 3 (P1)**: Depends on US2 being implemented to test real-time CA changes
- **User Story 4 (P2)**: Depends on US1 (UI list) to add the edit controls

### Parallel Opportunities

- T002 and T003 can run in parallel in Phase 2
- T004 and T005 can run in parallel in Phase 3
- US1 and US2 can theoretically be worked on in parallel by different developers

---

## Implementation Strategy

### MVP First (User Stories 1, 2 and 3)

1. Complete Phase 1 & 2
2. Complete Phase 3, 4, and 5 (Core functionality for viewing and recalculating AC)
3. **STOP and VALIDATE**: Test MVP independently
4. Proceed to Phase 6 (GM controls)
