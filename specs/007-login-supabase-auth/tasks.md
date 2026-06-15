# Tasks: Tela de Login e Autenticação

**Input**: Design documents from `/specs/007-login-supabase-auth/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Exact file paths are included.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Criar arquivo `.env.local` configurando a URL e Anon Key do Supabase baseado no `quickstart.md`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Implementar o client do Supabase (instanciação com as variáveis de ambiente) em `src/lib/supabase.ts`
- [x] T003 Implementar a store do Zustand para controle da sessão (`AuthState`) em `src/store/authStore.ts`
- [x] T004 Criar o componente `ProtectedRoute` que verifica a sessão do Zustand em `src/components/auth/ProtectedRoute.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Login com Credenciais (Priority: P1) 🎯 MVP

**Goal**: Permitir que usuários registrados façam login via Email/Senha.

**Independent Test**: Inserir email e senha num formulário local e ser redirecionado após o token ser salvo com sucesso pelo client do Supabase.

### Implementation for User Story 1

- [x] T005 [US1] Criar o componente `LoginPage` com React Hook Form e validação Zod em `src/pages/auth/LoginPage.tsx`
- [x] T006 [US1] Integrar `supabase.auth.signInWithPassword` no submit do `LoginPage`
- [x] T007 [US1] Atualizar o arquivo de roteamento principal (ex: `src/App.tsx` ou equivalente) para incluir a rota de login

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Cadastro de Novo Usuário (Priority: P1)

**Goal**: Permitir a criação de novas contas via Email/Senha.

**Independent Test**: Preencher o formulário, submeter, e validar que a conta foi criada no backend (Supabase) e gerou o redirecionamento.

### Implementation for User Story 2

- [x] T008 [P] [US2] Criar o componente `RegisterPage` com validação Zod e confirmação de senha em `src/pages/auth/RegisterPage.tsx`
- [x] T009 [US2] Integrar `supabase.auth.signUp` no submit do `RegisterPage`
- [x] T010 [US2] Atualizar o arquivo de roteamento principal para incluir a rota de cadastro

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 4 - Login com Google (Priority: P1)

**Goal**: Reduzir atrito permitindo o cadastro/login direto com Google.

**Independent Test**: Clicar em "Continuar com Google" e ser retornado ao `AuthCallbackPage` logado.

### Implementation for User Story 4

- [x] T011 [P] [US4] Adicionar o botão de login social via `signInWithOAuth` na `LoginPage` em `src/pages/auth/LoginPage.tsx`
- [x] T012 [P] [US4] Criar a página `AuthCallbackPage` para processar redirecionamentos do OAuth em `src/pages/auth/AuthCallbackPage.tsx`
- [x] T013 [US4] Atualizar o arquivo de roteamento principal para incluir a rota de callback do OAuth

**Checkpoint**: All P1 user stories should now be independently functional

---

## Phase 6: User Story 3 - Recuperação de Senha (Priority: P2)

**Goal**: Fornecer um fluxo seguro para esquecimento de senha.

**Independent Test**: Receber um email ao usar o form "Esqueci a Senha" e redefinir a senha através do formulário de reset.

### Implementation for User Story 3

- [x] T014 [P] [US3] Criar o componente `ForgotPasswordPage` (input de email) em `src/pages/auth/ForgotPasswordPage.tsx`
- [x] T015 [US3] Integrar `supabase.auth.resetPasswordForEmail` na `ForgotPasswordPage`
- [x] T016 [P] [US3] Criar o componente `ResetPasswordPage` (inputs de nova senha) em `src/pages/auth/ResetPasswordPage.tsx`
- [x] T017 [US3] Integrar `supabase.auth.updateUser` na `ResetPasswordPage`
- [x] T018 [US3] Atualizar o arquivo de roteamento principal para incluir as rotas de recuperação e reset

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T019 Validar se a loja Zustand está sendo sincronizada ao inicializar a aplicação (ex: lendo `getSession` no boot).
- [x] T020 Adicionar botões de navegação clara entre as telas (ex: "Não tem conta? Cadastre-se", "Esqueceu a senha?").
- [x] T021 Validar tipagem estática (TypeScript) global da interface AuthSession e User (conforme data-model.md).
- [x] T022 Conferir consistência visual entre todas as páginas utilizando os componentes Shadcn UI (`Input`, `Button`, `Label`, `Form`).

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
- **User Story 2 (P1)**: Can start after Foundational (Phase 2)
- **User Story 4 (P1)**: Can start after Foundational (Phase 2). Interage com a página da US1.
- **User Story 3 (P2)**: Can start after Foundational (Phase 2). Totalmente independente na UI, exceto pelos botões de redirecionamento.

### Within Each User Story

- UI and Validation before Auth Integration
- Integration before Routes

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Different user stories can be worked on in parallel by different team members

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 e 4 (P1) → Test independently → Deploy/Demo
4. Add User Story 3 (P2) → Test independently → Deploy/Demo
5. Each story adds value sem quebrar o fluxo anterior.
