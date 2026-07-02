# Tasks: 046-skills-proficiency-system

**Input**: Design documents from `/specs/046-skills-proficiency-system/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create `specs/046-skills-proficiency-system/tasks.md` based on plan (Completed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Create Supabase migration to add `level` and `proficiencies` columns in `supabase/migrations/`
- [x] T003 [P] Update `src/types/database.types.ts` to include `level` and `proficiencies`
- [x] T004 Update `src/features/character-management/types/index.ts` to include `level` and `proficiencies` on `Character` and `DraftCharacter`
- [x] T005 [P] Create/Update `src/features/character-management/utils/characterMath.ts` to include standard 5e skills list and proficiency calculation `Math.floor((level - 1) / 4) + 2`
- [x] T006 [P] Create/Update `src/features/character-management/utils/rules/vocations.ts` to map eligible skills and saving throws by vocation
- [x] T006a [P] Implement unit tests for `characterMath.ts` in `src/features/character-management/utils/characterMath.test.ts`
- [x] T006b [P] Implement unit tests for `vocations.ts` in `src/features/character-management/utils/vocations.test.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Escolher Perícias na Criação do Personagem (Priority: P1) 🎯 MVP

**Goal**: Permitir que o jogador escolha perícias elegíveis durante a criação, baseado na vocação, persistindo no banco de dados.

**Independent Test**: Pode ser testado criando um personagem completo e verificando que as perícias selecionadas foram gravadas corretamente no banco de dados.

### Implementation for User Story 1

- [x] T007 [P] [US1] Update `src/features/character-creation/store/useCharacterCreationStore.ts` to handle `proficiencies` state and reset logic on vocation change
- [x] T008 [US1] Create `src/features/character-creation/components/steps/SkillsStep.tsx` UI step
- [x] T009 [US1] Update wizard layout to include the new `SkillsStep`
- [x] T010 [US1] Add logic to limit maximum selectable skills based on vocation in `SkillsStep.tsx`
- [x] T011 [US1] Implement edge case handling: Reset skills automatically when vocation changes during edit mode

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Visualizar Proficiência e Perícias na Ficha (Priority: P1)

**Goal**: Exibir as 18 perícias na ficha do personagem com o cálculo total e destaque para proficiências.

**Independent Test**: Pode ser testado abrindo a ficha de um personagem com perícias registradas e verificando que o destaque visual e os valores calculados estão corretos.

### Implementation for User Story 2

- [ ] T012a [US2] Create `CharacterSkillsList.tsx` and `CharacterSavingThrows.tsx` components to avoid bloating `CharacterSheetView.tsx`
- [ ] T012 [US2] Update `src/components/character/CharacterSheetView.tsx` and its new child components to render the 18 standard 5e skills
- [ ] T013 [US2] Calculate total skill modifier (`attribute modifier + proficiency bonus`) for each skill
- [ ] T014 [US2] Add visual indicator (filled icon/badge) and tooltip for skills with proficiency in `CharacterSheetView.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Ver Testes de Resistência com Proficiência (Priority: P2)

**Goal**: Destacar visualmente na ficha os testes de resistência (saving throws) da vocação.

**Independent Test**: Pode ser testado abrindo a ficha e verificando que os testes de resistência corretos estão destacados conforme a vocação do personagem.

### Implementation for User Story 3

- [ ] T015 [US3] Update `src/components/character/CharacterSheetView.tsx` saving throws section
- [ ] T016 [US3] Add visual proficiency indicator for saving throws mapped to the character's vocation
- [ ] T017 [US3] Ensure saving throws without proficiency render correctly (+ mod only)

**Checkpoint**: All user stories up to P2 should now be independently functional

---

## Phase 6: User Story 4 - Cálculo Automático do Bônus de Proficiência por Nível (Priority: P2)

**Goal**: O bônus de proficiência deve escalar com o nível e refletir automaticamente na interface.

**Independent Test**: Pode ser testado mudando o nível de um personagem (no banco ou via interface) e verificando a atualização.

### Implementation for User Story 4

- [ ] T018 [US4] Ensure the proficiency bonus is dynamically calculated in the Character Sheet header using the character's `level` field
- [ ] T019 [US4] Verify that level scaling cascades correctly into all skill and saving throw components in `CharacterSheetView.tsx`

---

## Phase 7: User Story 5 - Indicador de Proficiência nas Rolagens (Priority: P3)

**Goal**: Refatorar o sistema de rolagem da sessão (Mestre e Jogador) para categorias e adicionar o bônus de proficiência em rolagens de perícias aplicáveis.

**Independent Test**: Pode ser testado solicitando um teste de perícia durante uma sessão e verificando que o resultado exibe a decomposição do bônus.

### Implementation for User Story 5

- [ ] T020 [P] [US5] Refactor `TEST_TYPES` in `src/components/session/PlayerTestDialog.tsx` into 3 groups: Attributes, Skills, Faith
- [ ] T021 [P] [US5] Refactor `TEST_TYPES` in `src/components/session/MasterTestDialog.tsx` into 3 groups
- [ ] T022 [US5] Update the dice rolling logic to append proficiency bonus when a skill test is rolled and the character is proficient
- [ ] T023 [US5] Format the chat output message to explicitly show `1d20 + AttrMod + ProfBonus = Total`
- [ ] T024 [US5] Ensure Faith rolls (d100) explicitly bypass any proficiency logic

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T025 [P] Run linter and formatting checks
- [ ] T026 Verify retrocompatibility handling for characters without `level` or `proficiencies`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- Migration, Types update, Math rules and Vocation mappings can be implemented in parallel within Phase 2.
- UI modifications to Master/Player Dialogs in Phase 7 can happen in parallel to Character Creation in Phase 3.
