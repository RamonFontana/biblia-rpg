# Tasks: Itens e Equipamentos

**Input**: Design documents from `/specs/003-itens-equipamentos/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create directory `docs/itens/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Update `docs/regras-base.md` para adicionar os links de navegação para a nova pasta `docs/itens/` e preparar a remoção das tabelas base antigas.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Consulta e Seleção de Armas (Priority: P1) 🎯 MVP

**Goal**: Permitir aos jogadores consultarem a lista de armas disponíveis (dano, propriedades e preços).

**Independent Test**: Verificar se `docs/itens/armas.md` existe e possui a tabela de armas formatada corretamente e sem magia arcana/itens mágicos.

### Implementation for User Story 1

- [x] T003 [US1] Create `docs/itens/armas.md` com o cabeçalho e descrição do arquivo.
- [x] T004 [US1] Populate a tabela de armas em `docs/itens/armas.md` seguindo o `data-model.md`.
- [x] T005 [US1] Remover a tabela de armas do `docs/regras-base.md`.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Consulta de Armaduras e Defesa (Priority: P1)

**Goal**: Permitir aos jogadores consultarem as armaduras, escudos e CA (Classe de Armadura).

**Independent Test**: Verificar se `docs/itens/armaduras.md` existe e possui a tabela com bônus de CA, requisitos de Força/Furtividade e custos em SP.

### Implementation for User Story 2

- [x] T006 [US2] Create `docs/itens/armaduras.md` com o cabeçalho e descrição do arquivo.
- [x] T007 [US2] Populate a tabela de armaduras em `docs/itens/armaduras.md` seguindo o `data-model.md`.
- [x] T008 [US2] Remover a tabela de armaduras e escudos do `docs/regras-base.md`.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Utilização de Consumíveis e Itens Gerais (Priority: P2)

**Goal**: Permitir aos jogadores consultarem os itens comuns e consumíveis para sobrevivência.

**Independent Test**: Verificar se `docs/itens/utilizaveis.md` e `docs/itens/consumiveis.md` foram criados e populados corretamente de acordo com as regras de cura e sobrevivência.

### Implementation for User Story 3

- [x] T009 [P] [US3] Create `docs/itens/utilizaveis.md` com a tabela de itens que não se consomem (cordas, mochilas).
- [x] T010 [P] [US3] Create `docs/itens/consumiveis.md` com a tabela de itens consumíveis (rações, bálsamos, tochas).
- [x] T011 [US3] Remover a tabela de itens comuns do `docs/regras-base.md`.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T012 Revisar os quatro arquivos criados em `docs/itens/` para garantir consistência de formatação markdown.
- [x] T013 Garantir que não restou nenhuma menção a itens ou equipamentos antigos duplicados em `docs/regras-base.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P1)**: Can start after Foundational (Phase 2)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2)

### Parallel Opportunities

- Todos os `[P]` tasks em Setup podem rodar em paralelo.
- User Story 1, 2 e 3 podem ser feitas em paralelo pois mexem em arquivos separados (exceto na remoção das tabelas do `regras-base.md`, que deve ser gerida de forma síncrona ou mesclada).
