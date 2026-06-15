---
description: "Task list template for feature implementation"
---

# Tasks: Regra de Milagres e Revisão de Sacerdote

**Input**: Design documents from `specs/005-regra-milagres/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup & Foundational

**Purpose**: Project initialization and basic structure

*(Sem tarefas de infraestrutura/fundação, pois trata-se apenas de atualização de arquivos Markdown)*

---

## Phase 2: User Story 1 - Regra Base de Milagres (Priority: P1) 🎯 MVP

**Goal**: Criar a regra base para a ocorrência de milagres baseada em rolagem de dados usando a Fé.

**Independent Test**: Revisar o `regras-base.md` para assegurar que a mecânica de d100 e Dificuldades do Mestre esteja clara.

### Implementation for User Story 1

- [ ] T001 [US1] Adicionar a seção de regras mecânicas de "Milagres" em `docs/regras-base.md` (inserir regra do d100, alvos e penalidades de fé).

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 3: User Story 2 - Revisão da Vocação Sacerdote (Priority: P1)

**Goal**: Categorizar habilidades da vocação sacerdote como bênçãos/incentivos e remover poderes garantidos, atrelando as Intervenções Divinas à regra de milagres da US1.

**Independent Test**: Revisar as descrições da ficha do sacerdote no nível 1, 10 e 18 para confirmar a não-garantia dos poderes.

### Implementation for User Story 2

- [x] T002 [US2] Atualizar o bloco explicativo "Regra de Milagres" em `docs/vocacoes/sacerdote.md` para refletir as novas rolagens.
- [x] T003 [US2] Revisar as habilidades de Nível 10 (Intervenção Menor) e Nível 18 (Intervenção Maior) em `docs/vocacoes/sacerdote.md` para dependerem da sorte (d100) contra a Vontade Divina.
- [x] T004 [P] [US2] Revisar "Imposição de Mãos", "Oração de Proteção" e outras habilidades em `docs/vocacoes/sacerdote.md` reforçando-as como ritos ou bênçãos narrativas de incentivo, não milagres automáticos.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T005 Revisão final dos dois documentos atualizados para consistência narrativa com o restante da constituição.

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Stories (Phase 2 e 3)**: Podem começar imediatamente, pois não há setup de código. US2 deve preferencialmente ocorrer em paralelo ou após US1 para garantir que a terminologia se alinhe.

### Parallel Opportunities

- Atualização das habilidades menores do sacerdote (T004) pode ocorrer de forma paralela à reescrita da regra de milagres (T001), mas ambas as tarefas tocam `sacerdote.md`, logo deve-se manter um controle cuidadoso ou fazê-las sequencialmente.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar T001.
2. Validar a compreensão lendo a seção nova do `regras-base.md`.

### Incremental Delivery

1. Completar US1 (Mecânica base).
2. Completar US2 (Adaptar vocação do Sacerdote para a nova mecânica e revisar flavour text).
3. Revisão final.
