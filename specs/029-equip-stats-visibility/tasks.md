# Tasks: Equip Stats Visibility

**Feature**: `[029-equip-stats-visibility]`

This file tracks the implementation progress for the Equip Stats Visibility feature.

## Phase 1: Setup

- [ ] T001 Verify project state and run any preliminary code checks.

## Phase 2: Foundational

- [x] T002 Extract `getEntityCombatStats` logic from `src/pages/session/ActiveSessionPage.tsx` into a new exported function `getCombatStats(character: any)` in `src/lib/equipmentUtils.ts`.
- [x] T003 Update `src/pages/session/ActiveSessionPage.tsx` to import and use the new `getCombatStats` function from `equipmentUtils.ts`.

## Phase 3: [US1] Exibir Aumento de CA e Dado de Dano na Listagem de Itens

**Goal**: Mostrar CA e Dado de dano nos slots de equipamento.
**Independent Test**: Abrir inventário e confirmar que armaduras mostram o bônus de CA e armas o dado de dano.

- [x] T004 [P] [US1] Update `src/components/inventory/EquipmentSlots.tsx` to extract and display `effects.damageDie` and `effects.acBonus`/`effects.ca` under the item names for currently equipped items.

## Phase 4: [US2] Atualizar CA Dinamicamente ao Equipar

**Goal**: Garantir que as listagens de sessão exibam o CA total atualizado e reativo.
**Independent Test**: Equipar um item que aumenta o CA e checar se o número é atualizado no card do player e listas de NPC/Inimigos.

- [x] T005 [P] [US2] Update `src/components/session/PlayerCard.tsx` to calculate and render CA using `getCombatStats(character).totalAc`.
- [x] T006 [P] [US2] Update `src/components/session/SessionEnemyList.tsx` to calculate and render CA using `getCombatStats(enemy).totalAc`.
- [x] T007 [P] [US2] Update `src/components/session/SessionNPCList.tsx` to calculate and render CA using `getCombatStats(npc).totalAc`.

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T008 [P] Run linter and verify typescript types for the updated components.
- [x] T009 [P] Test UI reactivity and verify that equipment changes correctly propagate to `totalAc` rendering across all views.
