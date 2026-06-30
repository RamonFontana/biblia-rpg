# Tasks: Armor Resistance Mechanic

**Input**: Design documents from `/specs/043-armor-resistance/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Update the core types to support the new item properties.

- [x] T001 Update `EquipmentItem` and `ShopItem` interfaces in `src/features/character-creation/types/index.ts` to include `level: number`, `conditionResistances: string[]`, and `slot: string`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Provide the data that all user stories will consume.

- [x] T002 Add new armors (heavy, light) and helmets to `ITEMS_DB` in `src/data/itemsDb.ts`, including the new properties (`level`, `conditionResistances`). Use new categories if needed para exclusividade (ex: categoria 'Sagrada' apenas na proficiência do Sacerdote).

**Checkpoint**: Core types and items database are ready.

---

## Phase 3: User Story 1 - Equip Vocation-Restricted Armor (Priority: P1) 🎯 MVP

**Goal**: Permitir apenas que personagens de vocações específicas equipem armaduras restritas.

### Implementation for User Story 1

- [x] T003 Implement validation logic in `src/features/character-creation/components/steps/EquipmentMerchant.tsx` (or inventory UI) to enforce that players can only purchase/equip items if their `vocation` has the matching `category` in `VOCATION_PROFICIENCIES`. (Note: Existing filter `allowedCategories.includes(item.category)` already handles this natively since we updated VOCATION_PROFICIENCIES).).

**Checkpoint**: Restrições de vocação aplicadas na interface.

---

## Phase 4: User Story 2 - Automated Armor Resistance in Combat (Priority: P1)

**Goal**: O sistema de combate deve checar a armadura e o elmo para mitigar/reduzir condições automaticamente.

### Implementation for User Story 2

- [x] T004 Update `executeAbilityOnTarget` in `src/services/combatEngine.ts` to fetch target's equipped items (`head`, `body`) and retrieve their definitions from `ITEMS_DB`.
- [x] T005 Implement logic in `combatEngine.ts` to find max level among resisting items and apply mitigation:
- [x] T006 Dispatch a toast notification to the Combat UI when a resistance is triggered (Option A) `window.dispatchEvent(new CustomEvent('combat-toast', { detail: { message: ... } }))` e exiba via componente Toast. triggered, alerting the GM and players.

**Checkpoint**: Mitigação automática no motor de combate está 100% funcional.

---

## Phase 5: User Story 3 - View Armor Properties (Priority: P2)

**Goal**: O jogador precisa ver visualmente quais as restrições e resistências do item antes de comprá-lo/equipá-lo.

### Implementation for User Story 3

- [x] T007 [US3] Update item card UI components (e.g., `src/features/character-creation/components/ItemCard.tsx` or similar) to show badges for "Nível de Resistência: X" and "Resistência contra: [Condições]".

**Checkpoint**: Propriedades visíveis no shop e inventário.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T008 [US3] Documentation updates in `docs/itens/armaduras.md` to reflect the new resistance level logic and the mapping of armors to their corresponding condition resistances.

---

## Dependencies & Execution Order

- **Phase 1 & 2** blocks everything else.
- **US1**, **US2**, and **US3** can be executed in parallel after Phase 2 is complete. US2 is the core mechanic.

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Phase 1 & 2.
2. Complete Phase 3 (US1) -> Verify restricted items can't be equipped.
3. Complete Phase 4 (US2) -> Verify combat engine applies mitigation correctly.
4. Complete Phase 5 (US3) -> Verify UI badges.
5. Update docs.
