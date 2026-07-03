# Tasks: Mecânica de Munição e Consumíveis

**Input**: Design documents from `/specs/047-consumiveis-armas/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Revisar e exportar os tipos de dados (ex. de `character_items`) em `src/types/database.types.ts` para o novo hook.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Criar hook/serviço `useAmmunition` em `src/features/character-management/api/useAmmunition.ts` com as funções de decremento e incremento atômico de `quantity` na tabela `character_items`.
- [x] T003 Atualizar ou confirmar tipos de `weapon_effects` e `is_consumable` caso seja necessário injetar json de configurações.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Gastar munição ao atacar (Priority: P1) 🎯 MVP

**Goal**: Permitir que o jogador gaste 1 unidade de munição (ex. flecha) com rapidez e facilidade, diminuindo `quantity` sem deletar o kit imediatamente.

**Independent Test**: Pode ser testado de forma independente criando um pacote de munição no inventário do personagem e confirmando que deduz 1 unidade ao atacar, sem excluir o pacote inteiro até que ele chegue a 0.

### Implementation for User Story 1

- [x] T004 [P] [US1] Adicionar botão "Gastar" em `src/components/inventory/InventoryList.tsx` que chame `useAmmunition.consume`.
- [x] T005 [US1] Adicionar validação em `InventoryList.tsx` (ou no item) para desabilitar o botão se `quantity === 0` e indicar visualmente item vazio.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Recuperar munição após combate (Priority: P2)

**Goal**: O jogador clica em "Recuperar" e o sistema roda um teste (50% de chance) para recuperar flechas gastas.

**Independent Test**: Clicar em "Recuperar" num item de flecha parcialmente gasto e ver a quantidade subir de acordo com o teste.

### Implementation for User Story 2

- [x] T006 [P] [US2] Implementar a lógica matemática de recuperação (chance de 50% por unidade faltante) em `useAmmunition.ts`.
- [x] T007 [US2] Inserir botão "Recuperar" na UI do inventário do jogador `src/components/inventory/InventoryList.tsx`.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Mestre repondo munições simples (Priority: P3)

**Goal**: Mestre pode repor munições simples diretamente para os jogadores sem chance de quebra, como ao dar pedras de funda ou comprar novas.

**Independent Test**: O Mestre pode clicar em um botão para adicionar X cargas ao item de um personagem.

### Implementation for User Story 3

- [x] T008 [P] [US3] Adicionar botão/ação "Repor Munição" na visualização do mestre sobre o inventário (ex. `src/components/session/MasterItemActions.tsx` ou equivalente).
- [x] T009 [US3] Integrar o botão do mestre para chamar `useAmmunition.addCharges` passando a quantidade escolhida.

**Checkpoint**: All user stories should now be independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T010 [P] Testar limites/overflow (ex: evitar consumir carga quando a mesma é = 0, evitar recuperar mais cargas do que o limite da munição).
- [x] T011 (Opcional, porém recomendado) Atualização otimista na UI.
- [x] T012 Atualizar `docs/regras-base.md` para incluir a regra de recuperação de flechas.

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

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depende de US1 (já que precisa que munições sejam gastas para ser testada plenamente).
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories.

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel
- O desenvolvedor de Backend/API pode fazer T006 enquanto o frontend monta os botões em T007.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready
