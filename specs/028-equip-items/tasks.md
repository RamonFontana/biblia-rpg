# Tasks: Sistema de Equipamentos e Inventário

**Input**: Design documents from `/specs/028-equip-items/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `src/`
- Paths shown below assume Web Application Single project structure per `plan.md`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure. Since the project exists, this involves type setups.

- [x] T001 Update `CharacterEquipment` type and related JSON interfaces in `src/types/combat.ts`
- [x] T002 Update `ItemEffects` to include `slot`, `damageDie`, and properties in `src/types/trade.ts` or `src/types/combat.ts` (whichever applies)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Implement helper functions for validating equipment slots in a new service or utility file (e.g., `src/lib/equipmentUtils.ts`)
- [x] T004 Update Supabase client operations in `src/lib/supabase.ts` to support safe updates to `characters.equipment`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Equipar Arma de Uma Mão e Escudo (Priority: P1) 🎯 MVP

**Goal**: O jogador quer equipar uma espada curta (uma mão) e um escudo (outra mão) no seu personagem.

**Independent Test**: Pode ser testado independentemente verificando se a interface permite selecionar os dois itens simultaneamente para cada slot das mãos, sem conflitos.

### Implementation for User Story 1

- [x] T005 [US1] Create or update `EquipmentSlots.tsx` in `src/components/inventory/` to display Main Hand and Off Hand slots.
- [x] T006 [US1] Update `InventoryList.tsx` in `src/components/inventory/` to include an "Equip" button for weapons/shields.
- [x] T007 [US1] Implement equip/unequip logic for 1H weapons and shields handling state in the component and via Supabase.
- [x] T008 [US1] Update `PlayerCombatView.tsx` in `src/components/combat/` to reflect the equipped 1H weapon and shield.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. You should be able to equip and unequip 1-handed weapons and shields.

---

## Phase 4: User Story 2 - Equipar Arma de Duas Mãos (Priority: P1)

**Goal**: O jogador quer equipar um Arco Longo (duas mãos) para atacar a distância.

**Independent Test**: Pode ser testado tentando equipar outros itens nas mãos após equipar a arma de duas mãos.

### Implementation for User Story 2

- [x] T009 [US2] Update equip logic in `src/components/inventory/InventoryList.tsx` to handle 2H weapons (occupying both Main and Off Hand slots).
- [x] T010 [US2] Implement automatic unequipping of conflicting items (like an existing shield) when a 2H weapon is equipped.
- [x] T011 [US2] Update `EquipmentSlots.tsx` to visually indicate that a 2H weapon occupies both slots.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. 2H weapons can be equipped properly.

---

## Phase 5: User Story 3 - Equipar Armadura Corporal e Cabeça (Priority: P2)

**Goal**: O jogador quer vestir uma "Cota de Escamas de Bronze" (Corpo) para melhorar sua defesa.

**Independent Test**: Vestir armadura e verificar se a CA do personagem reflete a mudança.

### Implementation for User Story 3

- [x] T012 [P] [US3] Update `EquipmentSlots.tsx` to display Head and Body slots.
- [x] T013 [P] [US3] Implement logic in `src/components/inventory/InventoryList.tsx` to equip Head and Body items.
- [x] T014 [US3] Update AC (Armor Class) calculation logic in `PlayerCombatView.tsx` to include equipped armor AC bonus.

**Checkpoint**: All equipment slots are functional and AC is calculating dynamically.

---

## Phase 6: User Story 4 - Atualização de Dano de Arma (Priority: P2)

**Goal**: Ao equipar uma arma, o sistema deve associar corretamente os dados de dano da arma para os rolamentos de combate.

**Independent Test**: Realizar um ataque com diferentes armas equipadas e conferir os dados rolados.

### Implementation for User Story 4

- [x] T015 [US4] Update `PhysicalRollForm.tsx` in `src/components/combat/` to default to the equipped weapon's damage die.
- [x] T016 [US4] Implement logic for "Versátil" properties: adjusting damage die automatically based on whether the off-hand is empty.

**Checkpoint**: Damage dice correctly map from the equipped items.

---

## Phase 7: User Story 5 - Equipamento Simplificado de Inimigos e Proficiência (Priority: P2)

**Goal**: O mestre quer visualizar rapidamente o dano que um inimigo causa sem gerenciar slots complexos, e o jogador quer ver sua proficiência.

**Independent Test**: Verificar se os inimigos mostram arma e dano diretamente, e se os personagens mostram a proficiência com a arma equipada.

### Implementation for User Story 5

- [x] T017 [P] [US5] Update `EnemyCard.tsx` (now `CombatDashboard.tsx`) in `src/components/combat/` to display a simplified weapon loadout and damage die.
- [x] T018 [P] [US5] Add proficiency indicator in `PlayerCombatView.tsx` (via `PhysicalRollForm.tsx`) based on the character's class/tribe proficiencies compared to the equipped weapon.

**Checkpoint**: All user stories are independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T019 Handle UI states for a full inventory or restrictions on equip changes during active combat turn.
- [x] T020 Code cleanup and performance verification.
- [x] T021 Run `quickstart.md` manual validation steps.

## Execution Complete

All tasks are completed.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - Proceed sequentially in priority order (P1 → P2).
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- Within Phase 5, T012 and T013 can be worked on in parallel.
- Within Phase 7, T017 (enemies) and T018 (proficiency) can be developed independently.
