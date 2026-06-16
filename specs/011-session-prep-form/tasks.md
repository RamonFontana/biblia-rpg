# Tasks: Criação de Sessão

**Input**: Design documents from `/specs/011-session-prep-form/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Criar estrutura de diretórios em `src/components/session` e `src/pages/session`
- [x] T002 Instalar dependências se ausentes: `zustand`, `react-hook-form`, `@hookform/resolvers`, `zod`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Gerar migration do Supabase com tabelas `game_sessions`, `session_enemies`, `session_npcs`, `session_participants` em `supabase/migrations/`
- [x] T004 Criar Supabase RPC (Postgres Function) para inserção atômica da Sessão (Draft -> DB)
- [x] T005 [P] Criar o Zustand Store base `useSessionDraftStore` em `src/store/createSessionStore.ts`
- [x] T006 [P] Configurar layout base do formulário em passos em `src/components/session/CreateSessionForm/index.tsx`
- [x] T007 Criar página pai do multi-step form em `src/pages/session/create.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Acesso e Preparação Inicial (Priority: P1) 🎯 MVP

**Goal**: O Mestre clica no botão de criar sessão na Home e preenche a primeira etapa com o nome e uma breve descrição da sessão.

**Independent Test**: Pode ser verificado preenchendo os dados básicos e avançando de etapa, garantindo que o progresso é salvo localmente no frontend.

### Implementation for User Story 1

- [x] T008 [P] [US1] Adicionar botão na Home (`src/pages/index.tsx` ou equivalente) apontando para `/session/create`
- [x] T009 [P] [US1] Definir schemas Zod para a etapa 1 em `src/components/session/CreateSessionForm/Step1Preparation.tsx`
- [x] T010 [US1] Implementar interface do formulário Step 1 e integração com o store em `src/components/session/CreateSessionForm/Step1Preparation.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Seleção e Ajuste de Inimigos (Priority: P1)

**Goal**: O Mestre avança para a segunda etapa, onde pode listar, selecionar, modificar e adicionar inimigos para a sessão com base no Bestiário.

**Independent Test**: O Mestre deve poder adicionar um inimigo, alterar sua vida para a sessão, e remover um inimigo da lista em memória.

### Implementation for User Story 2

- [x] T011 [P] [US2] Criar schema Zod e lógica de adição de inimigos no Zustand Store `src/store/createSessionStore.ts`
- [x] T012 [US2] Implementar interface de CRUD local de Inimigos no formulário Step 2 em `src/components/session/CreateSessionForm/Step2Enemies.tsx`
- [x] T013 [US2] Mockar / Ligar dados do Bestiário no formulário para seleção.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Criação e Gerenciamento de NPCs (Priority: P2)

**Goal**: Na terceira etapa, o Mestre pode criar e gerenciar NPCs que participarão ativamente da sessão.

**Independent Test**: O Mestre consegue criar um NPC com atributos básicos e visualizá-lo na lista da etapa.

### Implementation for User Story 3

- [x] T014 [P] [US3] Atualizar estado de NPCs no `useSessionDraftStore` em `src/store/createSessionStore.ts`
- [x] T015 [US3] Implementar interface de CRUD local de NPCs no formulário Step 3 em `src/components/session/CreateSessionForm/Step3NPCs.tsx`

**Checkpoint**: All user stories up to US3 should now be independently functional

---

## Phase 6: User Story 4 - Convocação de Personagens/Jogadores (Priority: P1)

**Goal**: Na quarta etapa, o sistema lista usuários e seus personagens. O mestre escolhe quais participarão da história.

**Independent Test**: Selecionar um ou mais personagens da lista de personagens do Supabase e avançar, armazenando os IDs no Zustand.

### Implementation for User Story 4

- [x] T016 [P] [US4] Criar hook ou função de busca de Personagens (`useCharacters`) para ler da tabela `public.characters`
- [x] T017 [P] [US4] Adicionar array de `participantCharacterIds` no `src/store/createSessionStore.ts`
- [x] T018 [US4] Implementar interface de listagem e seleção no Step 4 em `src/components/session/CreateSessionForm/Step4Players.tsx`

---

## Phase 7: User Story 5 - Resumo e Inicialização da Sessão (Priority: P1)

**Goal**: Na última etapa, o Mestre vê um resumo e clica em "Criar Sessão", o que instancia a partida real-time no Supabase.

**Independent Test**: Após clicar em "Criar Sessão", o formulário consolida os dados e insere tudo no Supabase.

### Implementation for User Story 5

- [x] T019 [P] [US5] Implementar função Supabase client para chamar a RPC de inserção da sessão e tratar erros em `src/services/sessionService.ts`
- [x] T020 [US5] Implementar a tela de resumo consumindo o Zustand Store em `src/components/session/CreateSessionForm/Step5Summary.tsx`
- [x] T021 [US5] Adicionar loading state, trigger da RPC e redirecionamento para a tela da sessão ativa após o sucesso.

---

## Phase 8: User Story 6 - Ingresso do Jogador Convocado (Priority: P1)

**Goal**: Interface mínima de Sessão Ativa e opção para o Mestre finalizar.

**Independent Test**: Acessar a URL da sessão ativa, verificar o estado real-time e ter um botão para finalizar.

### Implementation for User Story 6

- [x] T022 [P] [US6] Configurar página dinâmica da sessão ativa em `src/pages/session/[id].tsx`
- [x] T023 [US6] Implementar tela e componente `src/components/session/ActiveSession/index.tsx`
- [x] T024 [US6] Criar botão e lógica para "Finalizar Sessão" (alterar status para 'finished').

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T025 Implementar transições de animação (Framer Motion ou Anime.js) entre os passos do formulário
- [ ] T026 Garantir tipagem forte no retorno da RPC do Supabase
- [ ] T027 Validar o fluxo com Mestre logado (Auth Context)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially em termos de fluxo de interface
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- Criação da Migration (T003) e RPC (T004) pode ser feita por um desenvolvedor Backend enquanto o Frontend inicia a estrutura Zustand (T005, T006).
- Os diferentes componentes de Step do formulário (Step 1, Step 2, etc.) podem ser desenvolvidos de maneira razoavelmente isolada após o Zustand estar definido.
