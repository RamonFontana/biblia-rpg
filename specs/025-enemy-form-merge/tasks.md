# Tasks: Merge Enemy Creation Forms

**Input**: Design documents from `/specs/025-enemy-form-merge/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure updates

- [x] T001 Update `DraftCharacter` interface in `src/features/character-creation/types/index.ts` to include `skills?: { name: string, description: string }[]`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Create validation schema using Zod in `src/components/session/enemy-form/schema.ts`
- [x] T003 Create `UnifiedEnemyForm.tsx` scaffolding in `src/components/session/enemy-form/UnifiedEnemyForm.tsx` with basic props and export it in `src/components/session/enemy-form/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Unified Enemy Creation Form Component (Priority: P1) 🎯 MVP

**Goal**: O formulário de criação de inimigos seja o mesmo e padronizado em todo o sistema (tanto ao criar a sessão quanto dentro da sessão ativa).

**Independent Test**: Verificar se o formulário exibido na etapa 2 da criação de sessão é o mesmo utilizado no diálogo de criação de inimigos dentro da sessão ativa e se os dados são salvos no formato correto de EnemyFormValues.

### Implementation for User Story 1

- [x] T004 [US1] Implement full `react-hook-form` logic with `zodResolver` inside `UnifiedEnemyForm.tsx`, wiring up image upload, attributes, and basic inputs.
- [x] T005 [US1] Integrate `UnifiedEnemyForm` into `src/components/session/SessionStepEnemies.tsx` (Pre-Session Creation).
- [x] T006 [US1] Integrate `UnifiedEnemyForm` into `src/components/session/CreateEnemyDialog.tsx` (In-Session Creation).

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Ajuste dos Campos do Inimigo (Priority: P2)

**Goal**: O formulário não pede "Tribo (Raça)", mas sim permite a escolha de "Vocação (Classe)" e a definição de "Habilidades" dinamicamente. Também permite importar presets do bestiário.

**Independent Test**: Verificar que ao adicionar habilidades, elas podem ser adicionadas/removidas (useFieldArray). Verificar que ao selecionar um preset do Bestiário, os dados pré-preenchem o form.

### Implementation for User Story 2

- [x] T007 [US2] Implement dynamic `skills` array fields using `useFieldArray` inside `UnifiedEnemyForm.tsx`.
- [x] T008 [US2] Implement preset loading (Bestiário) in `UnifiedEnemyForm.tsx` to automatically populate HP, AC, attributes, vocation, and skills, while omitting tribe.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T009 [P] Compile code to check for regressions: run `npx tsc --noEmit`
- [x] T010 Validate the form submission shape against the global character logic to ensure no unexpected crashes.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Extends User Story 1 by adding the complex fields (useFieldArray and Bestiary logic) inside `UnifiedEnemyForm.tsx`. Should be implemented sequentially to build on top of US1.

### Parallel Opportunities

- T002 can be done in parallel with T001
- T009 can be run independently at the end

---

## Implementation Strategy

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!) (A working form with basic inputs everywhere)
3. Add User Story 2 → Test independently → Deploy/Demo (Form now has dynamic skills and presets)
4. Each story adds value without breaking previous stories
