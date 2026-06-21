---
description: "Task list for Mobile & Dark Mode Layout Redesign"
---

# Tasks: Mobile & Dark Mode Layout Redesign

**Input**: Design documents from `/specs/030-mobile-dark-layout/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Configure global dark theme default settings in `src/index.css` (bg-slate-950, text-slate-100)
- [x] T002 [P] Update `tailwind.config.js` (if necessary) to enforce or expand dark palette

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

*(Nenhuma tarefa de fundação estrutural ou de banco de dados, visto que se trata apenas de UI)*

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Acessibilidade e Contraste (Priority: P1) 🎯 MVP

**Goal**: Garantir que as cores de fundo e os textos mantenham contraste WCAG 4.5:1.

**Independent Test**: Usar a ferramenta de inspeção do Chrome no `CombatDashboard` para verificar o "Contrast Ratio" de todos os textos informativos e botões.

### Implementation for User Story 1

- [x] T003 [P] [US1] Ajustar paleta de cores dos textos e botões no `src/components/combat/CombatDashboard.tsx`
- [x] T004 [P] [US1] Ajustar contrastes no formulário `src/components/combat/PhysicalRollForm.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Experiência Mobile Completa (Priority: P1)

**Goal**: O layout deve se adaptar ao mobile sem quebras ou rolagem horizontal da página, e os botões devem ter hitboxes touch-friendly.

**Independent Test**: Abrir no "Device Toolbar" (320px-390px width) e verificar se o grid quebra e se os cliques são confortáveis.

### Implementation for User Story 2

- [x] T005 [P] [US2] Reestruturar a página `src/pages/session/ActiveSessionPage.tsx` para usar layout colapsável (1 coluna) no mobile e colunas lado-a-lado em telas maiores.
- [x] T006 [P] [US2] Adicionar responsividade (scroll horizontal interno ou conversão para cards) e hitboxes de no mínimo `min-h-[44px]` na página `src/components/combat/CombatDashboard.tsx`.
- [x] T007 [P] [US2] Adaptar hitboxes e espaçamento de formulários como o `src/components/combat/PhysicalRollForm.tsx`.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Tema Dark Global (Priority: P2)

**Goal**: Uniformizar a interface com o tema escuro ("dark mode") presente na Criação de Personagens.

**Independent Test**: Navegar por todas as rotas ativas (Dashboard de Sessão, Combate) garantindo que nenhum painel exibe "fundo branco".

### Implementation for User Story 3

- [x] T008 [P] [US3] Substituir hardcoded `bg-white`, `text-black`, etc., nas views gerais do app (principalmente em `ActiveSessionPage.tsx` e menus) por fundos como `bg-slate-800`, bordas `border-slate-700`.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T009 Validar UI através do quickstart.md.
- [x] T010 Remover classes redundantes de "dark:" que possam ter ficado em componentes individuais caso o root já as controle.

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

- Ajustes em diferentes componentes React (Dashboard vs Formulários vs ActiveSessionPage) podem ser rodados em paralelo desde que abordem suas respectivas tasks de CSS.
