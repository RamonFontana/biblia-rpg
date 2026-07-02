# Tasks: Bloqueio e Melhoria na Edição de Personagem

**Input**: Design documents from `/specs/045-character-edit-lock/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Review component logic of the Character Wizard flow (such as `Tribes` step, `Summary` step, and layout wrapper) to map which fields should be locked.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Injetar o status `has_participated_in_session` no state manager do formulário do Wizard (React Hook Form ou context atual do personagem) a partir do Supabase data.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Bloqueio de Edição Pós-Sessão (Priority: P1) 🎯 MVP

**Goal**: Permitir que os jogadores vejam os passos e alterem detalhes narrativos de personagens que já jogaram, bloqueando a edição dos atributos mecânicos.

**Independent Test**: Editar um personagem e verificar que na tela de tribo, classe e estatísticas as opções estão desabilitadas, não sendo possível alterar a seleção. E a tela de história e aparência pode ser modificada e avançada.

### Implementation for User Story 1

- [x] T003 [P] [US1] Modificar o componente do passo "Tribo" no Wizard de criação para aceitar e obedecer a prop `disabled` se o personagem `has_participated_in_session`.
- [x] T004 [P] [US1] Modificar os componentes de passo mecânicos (como Classes/Proficiências/Atributos) para desabilitar a edição e mostrar tooltip explicativo se bloqueado.
- [x] T005 [P] [US1] Garantir que os componentes do passo narrativo (História, Aparência, Retrato) fiquem SEMPRE livres para edição, mesmo com o personagem bloqueado.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Salvamento Descomplicado durante a Edição (Priority: P2)

**Goal**: Permitir salvar o progresso da edição de um personagem em qualquer aba (passo) sem a necessidade de navegar até a tela de resumo.

**Independent Test**: Alterar a tribo ou história do personagem numa aba intermediária e apertar o botão "Salvar". Recarregar a página e garantir que a alteração foi persistida com sucesso.

### Implementation for User Story 2

- [x] T006 [P] [US2] Criar hook genérico (ou método) para "Salvar e Continuar Editando" nos forms individuais usando `react-hook-form` e o state parcial.
- [x] T007 [P] [US2] Adicionar um botão auxiliar "Salvar" no rodapé das abas e chamar a função do T006, lidando com erro e estado de loading.
- [x] T008 [P] [US2] Implementar feedback visual de que os dados daquela aba específica foram salvos.

### Corrections

- [x] T009 [B] [US1] Corrigir falha em `sessionService.ts` em que o backend não estava atualizando o `has_participated_in_session` do personagem ao incluí-lo em uma nova sessão. Atualizado DB retroativamente para "Ricardo".
- [x] T010 [P] [US2] Refinar o UX/UI do botão "Salvar" vs "Avançar" para não confundir a jornada padrão. (Pode ser um botão Outline com ícone de disquete).

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T009 Refinar o UX/UI dos inputs bloqueados (`opacity-50`, pointer events none) e do novo botão "Salvar" com as diretrizes do Tailwind adotadas no projeto.
- [ ] T010 Testes manuais do fluxo completo: Editar personagem in-session, alterar aparência e salvar numa aba isolada; verificar que atributos não mudam.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) and User Story 2 (P2) can proceed sequentially.
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Can start after Foundational (Phase 2)

---

## Parallel Example

```bash
# Launch mechanical blocks modification for User Story 1 together:
Task: "Modificar o componente do passo Tribo..."
Task: "Modificar os componentes de passo mecânicos..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (Travar dados mecânicos do form)
4. **STOP and VALIDATE**: Editar um personagem e verificar bloqueios.

### Incremental Delivery

1. Foundation ready.
2. Add US1 → Test independently.
3. Add US2 → Implementar os botões de Salvar isolados → Test independently.
