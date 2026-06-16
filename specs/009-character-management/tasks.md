# Tasks: Gerenciamento de Personagens

**Input**: Design documents from `/specs/009-character-management/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure para a nova feature.

- [x] T001 Criar estrutura de diretórios `src/features/character-management/api`, `components`, `pages` e `types`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura e RLS no Supabase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Aplicar migração/policy RLS no Supabase para travar UPDATE onde `has_participated_in_session = true`.
- [x] T003 [P] Criar o serviço `src/features/character-management/api/characterApi.ts` com funções base: `getCharacters`, `getCharacterById` e `updateCharacter`.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Listagem de Personagens (Priority: P1) 🎯 MVP

**Goal**: Permitir que o usuário acesse e visualize todos os seus personagens criados.

**Independent Test**: Navegar para `/characters` deve exibir a lista de personagens vindos do Supabase.

### Implementation for User Story 1

- [x] T004 [US1] Criar componente `CharacterCard.tsx` em `src/features/character-management/components/CharacterCard.tsx`.
- [x] T005 [US1] Criar página `CharacterList.tsx` em `src/features/character-management/pages/CharacterList.tsx` integrando com `getCharacters`.
- [x] T006 [US1] Adicionar a rota `/characters` no arquivo principal de roteamento (ex: `src/App.tsx`).
- [x] T007 [US1] Adicionar link/botão na página inicial (Home) para a página `/characters`.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Edição de Personagem Pré-Sessão (Priority: P1)

**Goal**: Permitir que o usuário faça alterações em personagens que não participaram de sessões.

**Independent Test**: Clicar em um personagem "pré-sessão" leva a um formulário que salva os dados no Supabase.

### Implementation for User Story 2

- [x] T008 [US2] Criar página `CharacterEdit.tsx` em `src/features/character-management/pages/CharacterEdit.tsx` com formulário preenchido via `getCharacterById`.
- [x] T009 [US2] Adicionar rota `/characters/:id/edit` no roteador.
- [x] T010 [US2] Atualizar `CharacterCard` e `CharacterList` para navegar para `/characters/:id/edit` quando clicado em personagem editável.
- [x] T011 [US2] Integrar botão de salvar no formulário com o método `updateCharacter` na API e tratar erros/sucesso.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Visualização de Personagem Pós-Sessão (Priority: P2)

**Goal**: Visualizar personagens que já participaram de sessão sem permitir edição.

**Independent Test**: Clicar em um personagem "pós-sessão" leva a uma tela somente leitura, e tentativa de acesso à rota de edição bloqueia/redireciona.

### Implementation for User Story 3

- [x] T012 [P] [US3] Criar página `CharacterDetails.tsx` em `src/features/character-management/pages/CharacterDetails.tsx` (Read-Only).
- [x] T013 [US3] Adicionar rota `/characters/:id` no roteador.
- [x] T014 [US3] Atualizar a navegação na Listagem (`CharacterList`) para direcionar para `/characters/:id` caso `has_participated_in_session === true`.
- [x] T015 [US3] Adicionar proteção na rota `/characters/:id/edit` para redirecionar se tentar editar personagem bloqueado.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T016 Melhorar UI/UX da diferenciação visual entre personagens editáveis e bloqueados na Listagem.
- [x] T017 Revisar tipagens compartilhadas caso seja necessário importar de `src/features/character-creation/types`.

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: Inicia imediatamente.
- **Foundational (Phase 2)**: Depende do Setup. Configura RLS e a base da API.
- **US1**: Depende do Foundational. Implementa a Listagem, Home link.
- **US2 e US3**: Dependem da US1. Podem ser implementadas em paralelo por possuírem endpoints/telas separadas, ou sequencialmente.

---

## Implementation Strategy

### Incremental Delivery

1. Setup + Foundational -> Foundation Ready.
2. US1 -> Navegação principal pronta e Listagem renderizando (MVP).
3. US2 -> Adiciona o CRUD (Edição) para personagens elegíveis.
4. US3 -> Trava o fluxo para personagens já engajados em sessão.
