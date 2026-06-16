# Tasks: Character Sheet Items and Actions

**Input**: Design documents from `/specs/015-session-character-sheet/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify project structure and verify Supabase connection

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Generate and write Supabase migration for `items`, `kit_items`, `character_items` tables and `add_kit_to_character`, `use_consumable_item` RPCs. Path: `supabase/migrations/[timestamp]_inventory.sql`
- [x] T003 Update TypeScript types from Supabase CLI in `src/types/supabase.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Categorized Item Display (Priority: P1) 🎯 MVP

**Goal**: Mostrar o inventário agrupado por categorias e expandir kits.

**Independent Test**: Personagem com "Kit" exibe itens individuais categorizados na ficha.

### Implementation for User Story 1

- [x] T004 [US1] Update data fetching in `src/components/character/CharacterSheetView.tsx` to fetch `character_items` joined with `items`.
- [x] T005 [US1] Refactor `src/components/character/CharacterSheetView.tsx` to group items by the `category` field and display headers.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Token Context Menu (Priority: P2)

**Goal**: Clique no token do jogador abre painel de itens/ações.

**Independent Test**: Clicar no próprio token abre painel com itens utilizáveis. Fechar clicando fora/Esc.

### Implementation for User Story 2

- [x] T006 [P] [US2] Create floating context menu component in `src/components/session/TokenContextMenu.tsx`
- [x] T007 [US2] Update `src/components/session/PlayerCard.tsx` and `OnlinePlayersList.tsx` to detect clicks on self and trigger `TokenContextMenu` relative to token position.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Consumable Item Utilization (Priority: P3)

**Goal**: Utilizar item consumível, decrementando ou apagando do banco e sincronizando.

**Independent Test**: Clicar "Usar" em uma poção remove-a do inventário imediatamente via realtime.

### Implementation for User Story 3

- [x] T008 [US3] Update `TokenContextMenu.tsx` to handle consumable items usage (`requires_target = false`). Call RPC `use_consumable_item`.
- [x] T009 [US3] Ensure state syncs so that item disappears from list when quantity becomes 0.`CharacterSheet.tsx` and `TokenContextMenu.tsx`.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple### Integration & Verification

- [x] T010 Build the app and check for build errors: `npm run build`mations, empty states)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete
