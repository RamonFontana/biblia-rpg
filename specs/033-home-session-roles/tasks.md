# Tasks: Ajuste de Botões da Sessão (Home)

**Input**: Design documents from `specs/033-home-session-roles/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- Nenhum setup adicional de infraestrutura é necessário para essa feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- Nenhum trabalho fundacional é estritamente necessário. O bugfix do hook é a base das User Stories subsequentes.

---

## Phase 3: User Story 3 - Correção de Duplicação (Priority: P2)

**Goal**: Como usuário, quero ver a lista de sessões sem duplicações, para não ficar confuso sobre qual opção clicar.

**Independent Test**: Can be fully tested by reproducing the state that caused duplicated entries and verifying they now appear deduplicated.

### Implementation for User Story 3

- [x] T001 [US3] Desduplicar retorno do hook de sessões no arquivo `src/hooks/useActiveSession.ts`

**Checkpoint**: At this point, a lista de sessões retornadas não terá entradas duplicadas.

---

## Phase 4: User Story 1 & 2 - Visão do Mestre e do Jogador (Priority: P1)

**Goal**: Exibir os botões corretos para Mestres (apenas verde) e Jogadores (convites).

**Independent Test**: Verificar com uma conta Mestre e uma conta Jogador as exibições na tela Home.

### Implementation for User Story 1 & 2

- [x] T002 [US1] Adicionar filtro na iteração `activeSessions.map` em `src/App.tsx` para ocultar itens se `session.gm_id === user.id`.

**Checkpoint**: At this point, os botões e regras visuais de todos os tipos de usuários estarão funcionando.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T003 Validar comportamento clicando nos links em `src/App.tsx` pela interface da Home.

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 3**: Não tem dependências. (Modifica hook)
- **User Story 1 & 2**: Dependem da estabilidade do hook, porém podem ser realizadas em paralelo.

### Within Each User Story

- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- Modificação de estado global (`useActiveSession.ts`) e alteração no componente de view (`App.tsx`) podem ocorrer simultaneamente sem grande conflito.

---

## Implementation Strategy

### Incremental Delivery

1. Aplicar correção do hook (`T001`).
2. Aplicar correção de visualização (`T002`).
3. Fazer testes manuais na tela principal para validar resultados.
