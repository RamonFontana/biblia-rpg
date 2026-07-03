---

description: "Task list for Level Progression Feature"
---

# Tasks: Sistema de Progressão de Nível

**Input**: Design documents from `/specs/048-level-progression/`

**Prerequisites**: plan.md, spec.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Supabase migration to add `pending_level_up` boolean column (default `false`) to `characters` table
- [x] T002 Update `src/types/database.types.ts` to include `pending_level_up`

---

## Phase 2: Foundational (Scaffolding & Flow)

**Purpose**: Creating the entry points and the structure for the wizard.

- [x] T003 Scaffold `LevelUpWizard` component in `src/features/character-management/components/LevelUpWizard.tsx`
- [x] T004 Adicionar suporte para navegação do CharacterCard até o LevelUpWizard em `src/features/character-management/pages/CharacterList.tsx` (exibir botão apenas se `pending_level_up` for true e bloquear se em sessão ativa com mensagem explicativa)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Mestre Concede Aumento de Nível (Priority: P1) 🎯 MVP

**Goal**: Permitir ao mestre marcar personagens para level up no encerramento da sessão.

**Independent Test**: Mestre encerra sessão e marca personagens; banco de dados reflete `pending_level_up = true` para os selecionados.

### Implementation for User Story 1

- [x] T005 [US1] Adicionar seleção de personagens para level up no modal de encerramento em `src/pages/session/ActiveSessionPage.tsx`
- [x] T006 [US1] Desabilitar checkbox de seleção para personagens que já são nível 20
- [x] T007 [US1] Atualizar lógica de encerramento (no `endSession`) para dar update no Supabase setando `pending_level_up = true` para os personagens selecionados

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 4 - Exibição Universal do Nível do Personagem (Priority: P1)

**Goal**: Exibir o nível atual do personagem em todos os locais relevantes.

**Independent Test**: Nível é visível no card da lista de personagens e dentro da sessão.

### Implementation for User Story 4

- [x] T008 [P] [US4] Exibir o nível do personagem no card em `src/features/character-management/components/CharacterCard.tsx`
- [x] T009 [P] [US4] Exibir o nível do personagem no card do jogador em `src/components/session/PlayerCard.tsx`
- [x] T010 [P] [US4] Exibir o nível do personagem na lista de participantes em `src/components/session/SessionParticipantList.tsx`

---

## Phase 5: User Story 2 - Jogador Visualiza Indicador de Level Up Disponível (Priority: P1)

**Goal**: O jogador vê claramente que seu personagem tem level up pendente.

**Independent Test**: Personagens com `pending_level_up = true` mostram um badge de "Level Up Disponível".

### Implementation for User Story 2

- [x] T011 [US2] Adicionar badge visual de level up no card em `src/features/character-management/components/CharacterCard.tsx` quando `pending_level_up` for `true`

---

## Phase 6: User Story 3 - Jogador Realiza a Progressão de Nível (Priority: P1)

**Goal**: Fluxo completo de progressão onde o jogador faz escolhas de habilidades e ASI, e o sistema atualiza stats e HP.

**Independent Test**: Jogador conclui fluxo e o personagem sobe de nível corretamente no banco de dados.

### Implementation for User Story 3

- [x] T012 [P] [US3] Implementar step de cálculo automático de HP (valor médio + Mod CON) e Bônus de Proficiência no `LevelUpWizard.tsx`
- [x] T013 [P] [US3] Adicionar step para escolha livre de Caminho da Tribo (A ou B) no `LevelUpWizard.tsx` (quando aplicável ao nível)
- [x] T014 [P] [US3] Adicionar step para escolha de Habilidades de Vocação no `LevelUpWizard.tsx` (quando aplicável ao nível)
- [x] T015 [P] [US3] Adicionar step de ASI (Ability Score Improvement) no `LevelUpWizard.tsx` (quando aplicável ao nível)
- [x] T016 [US3] Integrar cálculo retroativo de HP caso o ASI aumente a Constituição, processando o HP adicional por nível anterior no `LevelUpWizard.tsx`
- [x] T017 [US3] Conectar o Wizard ao Supabase para persistir as mudanças: nível incrementado, atributos/hp atualizados, habilidades inseridas no JSONB, e setar `pending_level_up = false`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Melhorias de edge cases e integridade do sistema.

- [x] T018 [P] Desabilitar seleção de personagens com level up pendente na criação de sessão (com mensagem de aviso) em `src/components/session/CreateSessionForm/SessionParticipantList.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 pode ser feita independente
  - User Story 4 e 2 dependem apenas da UI
  - User Story 3 é a maior carga de trabalho (o Wizard de level up)
- **Polish (Phase 7)**: Pode ser feita após US1 e US3.

### Parallel Opportunities

- Atualizações de UI para exibir o nível (Phase 4) podem ser feitas em paralelo aos fluxos de backend.
- Criação dos Steps do Wizard (Phase 6) podem ser desenvolvidos independentemente antes da persistência final.
