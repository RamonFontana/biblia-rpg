# Tasks: 040-ability-usage-system

**Input**: Design documents from `/specs/040-ability-usage-system/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify project structure per implementation plan

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Standardize docs in `docs/tribos/aser.md` to `docs/tribos/benjamim.md`
- [x] T003 [P] Standardize docs in `docs/tribos/da.md` to `docs/tribos/efraim.md`
- [x] T004 [P] Standardize docs in `docs/tribos/gade.md` to `docs/tribos/issacar.md`
- [x] T005 [P] Standardize docs in `docs/tribos/juda.md` to `docs/tribos/levi.md`
- [x] T006 [P] Standardize docs in `docs/tribos/manasses.md` to `docs/tribos/naftali.md`
- [x] T007 [P] Standardize docs in `docs/tribos/ruben.md` to `docs/tribos/simeao.md`
- [x] T008 [P] Standardize docs in `docs/tribos/zebulom.md`
- [x] T009 [P] Standardize docs in `docs/vocacoes/batedor.md` and `cacador.md`
- [x] T010 [P] Standardize docs in `docs/vocacoes/guerreiro.md` and verify `sacerdote.md`
- [x] T011 Create `src/data/abilities.ts` containing the `AbilityDefinition` interface and map all standardized documentation into a single exported static array
- [x] T012 Update `src/types/character.ts` to include the new `skills` JSONB types (path_choices and ability_uses)
- [x] T013 Update character fetching queries (if necessary) to ensure the `skills` column is explicitly selected and typed correctly in `src/hooks/useCharacter.ts` or similar

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Visualizar Habilidades com Detalhes de RPG (Priority: P1) 🎯 MVP

**Goal**: O jogador abre sua ficha durante uma sessão e vê suas habilidades com dado associado, tipo de ação e estado atual.

**Independent Test**: Abrir a ficha de um personagem, confirmar que as habilidades de sua tribo e vocação (filtradas pelo nível e caminho) aparecem com "2d8 + SAB", "Ação", etc.

### Implementation for User Story 1

- [x] T014 [US1] Implement a utility function in `src/utils/abilityUtils.ts` to filter available abilities from `src/data/abilities.ts` based on a character's level, tribe, vocation, and `path_choices`
- [x] T015 [US1] Create a new component `src/components/combat/AbilityCard.tsx` to render an individual ability's details (name, dice, action type, description)
- [x] T016 [US1] Update `src/components/combat/PlayerCombatView.tsx` to integrate the `AbilityCard` component in a new "Habilidades" section below existing actions

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (displaying read-only abilities).

---

## Phase 4: User Story 2 - Usar Habilidade com Botão de Utilização (Priority: P1)

**Goal**: O jogador clica no botão "Usar" da habilidade, decrementando o contador de usos restantes, com o botão desabilitando quando atinge 0.

**Independent Test**: Clicar em "Usar" no "Surto de Ação" (1/1), confirmar que vai para 0/1 e o botão é desativado visualmente.

### Implementation for User Story 2

- [ ] T017 [US2] Update `AbilityCard.tsx` in `src/components/combat/AbilityCard.tsx` to render a "Use" button that is disabled if `current_uses === 0` or if it's a passive ability
- [ ] T018 [US2] Create a function in `src/services/characterService.ts` or `src/store/combatStore.ts` to decrement ability uses via a Supabase RPC or JSONB update
- [ ] T019 [US2] Wire the "Use" button in `src/components/combat/PlayerCombatView.tsx` to trigger the update function and optimistically update local state

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently (players can use abilities and spend their uses).

---

## Phase 5: User Story 3 - Recarregar Habilidades por Descanso (Priority: P2)

**Goal**: Quando o Mestre aciona Descanso Curto/Longo, habilidades correspondentes são recarregadas.

**Independent Test**: Dar um descanso curto e verificar se habilidades com recarga "short_rest" voltam para usos máximos, enquanto "long_rest" permanecem inalteradas.

### Implementation for User Story 3

- [x] T020 [US3] Create a utility function in `src/utils/abilityUtils.ts` to calculate the new `ability_uses` JSONB state after a specific rest type (Short/Long)
- [x] T021 [US3] Update `src/components/session/SessionRestControls.tsx` to call Supabase and apply the new `ability_uses` state to all active characters when a rest is triggered

**Checkpoint**: All user stories up to US3 should now be independently functional.

---

## Phase 6: User Story 4 - Reset de Habilidades por Combate (Priority: P2)

**Goal**: Habilidades com recarga "por combate" são recarregadas ao iniciar um novo combate, e restritas de uso fora de combate.

**Independent Test**: Iniciar combate restaura habilidades "combat". Fora de combate, botão de uso de habilidades "combat" fica desabilitado.

### Implementation for User Story 4 (Priority: P2)

- [x] T022 [US4] Update `src/utils/abilityUtils.ts` to include a `resetCombatAbilities` function that clears usage for `usageType === 'combat'` abilities
- [x] T023 [US4] Update `startCombat` action in `src/store/combatStore.ts` to apply this reset function to all participants
- [x] T024 [US4] Update `AbilityCard.tsx` or `PlayerCombatView.tsx` to disable the "Use" button for `combat` abilities if the character is not currently in an active combat.

---

## Phase 7: User Story 5 - Mestre Visualiza e Gerencia Habilidades (Priority: P3)

**Goal**: O Mestre pode ver o estado atual das habilidades e restaurar ou gastar usos manualmente como override.

**Independent Test**: Mestre abre ficha do jogador, visualiza contadores e clica em um botão "Restaurar" para encher uma habilidade gasta.

### Implementation for User Story 5

- [x] T024: Update `AbilityCard.tsx` to show a "Restaurar" admin button if the current user is the DM.
- [x] T025: Wire the Restaurar button to a function that resets current_uses to max_uses in Supabase.
- [x] T026: Enhance the UX of the Use button, potentially adding feedback, toasts, or better visual states for when faith/uses are insufficient.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T026 Code cleanup and refactoring in `PlayerCombatView.tsx`
- [ ] T027 Run quickstart.md validation to ensure all steps are complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Sequential priority order (US1 → US2 → US3 → US4 → US5)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation needed.
- **User Story 2 (P1)**: Depends on User Story 1 (needs the ability cards).
- **User Story 3 (P2)**: Depends on User Story 2 (needs uses to be decremented to test recharge).
- **User Story 4 (P2)**: Depends on User Story 2.
- **User Story 5 (P3)**: Depends on User Story 2.

### Parallel Opportunities

- Document standardization (T002 to T010) can run in parallel.
- US4's UI update (T022) can run in parallel with combat reset logic (T023).

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: Test reading and using abilities in the combat view.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 & US2 → Test independently → Deploy/Demo (MVP!)
3. Add US3 (Rests) → Test independently → Deploy/Demo
4. Add US4 (Combat Reset) → Test independently → Deploy/Demo
5. Add US5 (DM Override) → Test independently → Deploy/Demo
