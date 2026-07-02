# Tasks: 044 — Efeitos de Armas e Novos Itens

**Input**: Design documents from `specs/044-weapon-effects-items/`

**Prerequisites**: [plan.md](plan.md) ✅ | [spec.md](spec.md) ✅ | [research.md](research.md) ✅ | [data-model.md](data-model.md) ✅

**Testes**: Não solicitados — validação manual por checkpoint.

**Organização**: Tarefas agrupadas por User Story para entrega e teste independentes.

## Formato: `[ID] [P?] [Story] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: A qual User Story pertence (US1, US2, US3)

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Propósito**: Migration de banco e tipos TypeScript — base para todas as User Stories.

- [x] T001 Executar migration SQL via MCP Supabase para adicionar coluna `weapon_effects jsonb DEFAULT NULL` na tabela `character_items`
- [x] T002 Inserir os 3 novos itens de arma na tabela `items` do Supabase via MCP (Espada Grande de Ferro, Martelo de Guerra, Clava Grande) com os campos `id`, `name`, `category`, `damage`, `price`, `description`, `effects`, `is_consumable`, `requires_target`
- [x] T003 [P] Adicionar tipo `WeaponEffect` em `src/types/combat.ts` com campos `conditionId: string` e `trigger: 'natural_18_plus'`
- [x] T004 [P] Adicionar as 3 novas armas no array `ITEMS_DB` em `src/data/itemsDb.ts` com `properties: ['two-handed', 'heavy']` e slot `2h` inferido pela descrição "Duas mãos"

**Checkpoint**: Banco atualizado, tipos definidos e catálogo local sincronizado. Base pronta para as User Stories.

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Propósito**: Sincronização do inventário e utilidades que todas as User Stories dependem.

**⚠️ CRÍTICO**: Nenhuma User Story pode ser iniciada sem este bloco.

- [x] T005 Atualizar a função `getEffectsFromItemName` em `src/features/character-management/api/syncInventory.ts` para que armas com propriedade `two-handed` na descrição ou no `properties` gerem `slot: '2h'` no objeto `effects` ao sincronizar com o Supabase
- [x] T006 Atualizar a lógica de inferência de slot em `src/components/inventory/InventoryList.tsx` (linhas 59-70) para reconhecer a propriedade `two-handed` ou `heavy` no `effects.properties` e atribuir `itemSlot = '2h'`
- [x] T007 [P] Atualizar `src/types/database.types.ts` para refletir a nova coluna `weapon_effects` em `character_items` (campo `Row`, `Insert` e `Update`)

**Checkpoint**: Novas armas são exibidas corretamente no inventário com slot "2h" e o tipo do banco está sincronizado.

---

## Phase 3: User Story 2 — Novas Armas de Duas Mãos (Priority: P1) 🎯 MVP

> US2 é promovida a MVP pois é a mais simples e desbloqueia a validação visual imediata.

**Goal**: As 3 novas armas de duas mãos aparecem na loja e podem ser compradas, exibidas e equipadas.

**Independent Test**: Criar um personagem Guerreiro → Verificar que "Espada Grande de Ferro", "Martelo de Guerra" e "Clava Grande" aparecem na loja com dados de dano corretos (`2d6`, `2d6`, `1d10`) → Equipar uma → Confirmar que ocupa `mainHand` e `offHand`.

### Implementação para User Story 2

- [x] T008 [US2] Verificar que as novas armas aparecem no componente de loja `src/features/character-creation/components/steps/EquipmentMerchant.tsx` filtrando por categoria "Marcial" e "Simples" — sem modificação necessária se o catálogo estiver correto (confirmar)
- [x] T009 [US2] Confirmar que o botão "Duas Mãos" em `src/components/inventory/InventoryList.tsx` (linha 281-288, prop `two-handed` / slot `2h`) funciona para as novas armas, atribuindo `mainHand` e `offHand` simultaneamente
- [x] T010 [US2] Atualizar `docs/itens/armas.md` — adicionar as 3 novas armas na tabela existente com colunas: Arma, Dano, Propriedades, Preço (SP)

**Checkpoint**: Novas armas visíveis, equipáveis e documentadas. ✅ MVP entregável.

---

## Phase 4: User Story 1 — Mestre Atribui Efeito a uma Arma (Priority: P1)

**Goal**: O Mestre consegue selecionar uma arma no inventário de um personagem e configurar que ela causa uma condição (ex: Sangrando) com gatilho Natural 18+.

**Independent Test**: Abrir o painel de inventário como GM → Selecionar uma arma → Clicar no novo botão de efeitos (ícone Zap) → Marcar "Sangrando" → Fechar → Verificar que o badge "⚡ Sangrando" aparece na arma e que o valor foi salvo em `character_items.weapon_effects`.

### Implementação para User Story 1

- [x] T011 [US1] Criar função `updateWeaponEffects(characterItemId: string, effects: WeaponEffect[])` em `src/services/characterItemService.ts` (ou equivalente existente)
- [x] T012 [US1] Em `src/components/inventory/InventoryList.tsx`, adicionar prop `onChangeWeaponEffects?: (characterItemId: string, effects: WeaponEffect[]) => void`
- [x] T013 [US1] Em `src/components/inventory/InventoryList.tsx`, no bloco `isGM`, adicionar um botão (ícone `Zap`) para itens do tipo "Arma" que abre um `DropdownMenu` populado com `CONDITIONS` de `src/data/conditions.ts`
- [x] T014 [US1] Em `src/components/inventory/InventoryList.tsx`, garantir que o botão `ShieldPlus` de resistências de armadura só apareça se o item **não** for arma (para evitar confusão)
- [x] T015 [US1] Em `src/components/inventory/InventoryList.tsx`, renderizar badges dos `weapon_effects` aplicados (com nome da condição e ícone `Zap`) abaixo do item, visível para todos (Mestre e Jogador)
- [x] T016 [US1] Em `src/components/character/CharacterSheetView.tsx`, adicionar estado/handler `handleChangeWeaponEffects` que chama o service e passa a prop para o `InventoryList`
- [x] T017 [US1] Em `src/components/character/CharacterSheetView.tsx`, garantir que a query do Supabase que busca os itens do inventário traga também o novo campo `weapon_effects`

**Checkpoint**: Mestre consegue configurar efeitos em armas com 3 cliques e visualizar o badge. ✅

---

## Phase 5: User Story 3 — Efeito Aplicado no Combate (Priority: P2)

**Goal**: Quando um ataque com uma arma com efeito atinge Natural 18+, o sistema alerta o Mestre para aplicar a condição.

**Independent Test**: Iniciar combate → Atacante tem arma com efeito "Sangrando" (Natural 18+) → Jogador informa `naturalRoll = 19` no formulário → Sistema exibe toast/alerta "⚔️ Sangrando pode ser aplicado ao alvo!" → Mestre confirma e condição é adicionada ao alvo.

### Implementação para User Story 3

- [x] T018 [US3] Atualizar a interface do banco ou `src/types/combat.ts` de forma que `combatEngine` possa acessar os efeitos aplicados na arma do agressor (passado via params no trigger)
- [x] T019 [US3] Implementar em `src/services/combatEngine.ts` uma função `checkWeaponEffects(weaponEffects: WeaponEffect[], naturalRoll: number, targetParticipantId: string)`:
  - Verificar se `naturalRoll >= 18`
  - Para cada efeito, verificar resistências do alvo na armadura e se houver imunidade, bloquear.
  - Caso contrário, chamar `conditionsService.mergeCondition` no alvo.
  - Disparar `window.dispatchEvent(new CustomEvent('combat-toast', ...))` com mensagem de efeito ativado
- [x] T020 [US3] Em `src/components/combat/PhysicalRollForm.tsx`, adicionar o campo "Dado Natural (Opcional, 1-20)" no Zod schema (`naturalRoll`) e no formulário.
- [x] T021 [US3] Em `src/components/combat/PhysicalRollForm.tsx`, no `onSubmit`, verificar se `values.naturalRoll` foi informado e a arma tem efeitos, então chamar `combatEngine.checkWeaponEffects(weaponCharacterItemId, values.naturalRoll, targetParticipantId)` — passar `targetParticipantId` via nova prop opcional
- [x] T022 [US3] Em `src/components/inventory/InventoryList.tsx` e `src/lib/equipmentUtils.ts`, garantir que o `weapon_effects` da arma equipada na `mainHand` seja exposto na função `getCombatStats` para uso no `PhysicalRollForm`
- [x] T023 [US3] Adicionar na documentação `docs/itens/armas.md` uma seção "Efeitos de Arma" explicando: definição, gatilho Natural 18+, como o Mestre configura, e como interage com Resistência de Armadura

**Checkpoint**: Loop completo de combate com efeito de arma funcionando end-to-end. ✅

---

## Phase Final: Polish & Cross-Cutting

- [ ] T024 [P] Revisar `src/data/itemsDb.ts` — confirmar que `conditionResistances` está ausente em todos os itens do tipo `Arma` (garantia de separação de conceitos)
- [ ] T025 [P] Verificar visualmente que o botão `ShieldPlus` (resistências) não aparece em armas no `InventoryList` e que o botão `Zap` (efeitos) não aparece em armaduras
- [ ] T026 Testar fluxo completo: criação de personagem → equipe arma nova → mestre configura efeito → combate → rolagem natural 18+ → condição aplicada

---

## Dependencies & Execution Order

### Dependências por Fase

- **Phase 1 (Setup)**: Sem dependências — pode iniciar imediatamente. T003 e T004 são paralelos.
- **Phase 2 (Foundational)**: Depende de Phase 1 completo — bloqueia todas as User Stories.
- **Phase 3 (US2 — Novas Armas)**: Depende de Phase 1 + 2. **MVP — entregar primeiro.**
- **Phase 4 (US1 — Efeitos pelo Mestre)**: Depende de Phase 1 + 2.
- **Phase 5 (US3 — Combate)**: Depende de Phase 4 (US1) completo.
- **Phase Final (Polish)**: Depende de todas as fases anteriores.

### Dependências Internas

- T011 → T012 → T013 (serviço antes da UI)
- T014 e T015 podem ser feitos em paralelo com T013 (mesmo arquivo, mas seções diferentes)
- T018 → T019 → T020 → T021 (formulário → schema → motor → integração)
- T022 depende de T020 (motor precisa existir)

### Oportunidades de Paralelização

```
# Phase 1 — Paralelo:
Task T001: Migration SQL (Supabase)
Task T003: Tipo WeaponEffect em combat.ts
Task T004: Novas armas em itemsDb.ts

# Phase 2 — Paralelo após T001:
Task T005: syncInventory.ts
Task T006: InventoryList.tsx (slot inference)
Task T007: database.types.ts
```

---

## Implementation Strategy

### MVP First (Phase 3 — Novas Armas)

1. ✅ Completar Phase 1: Setup (migration + tipos + catálogo)
2. ✅ Completar Phase 2: Foundational (sync + slot inference)
3. ✅ Completar Phase 3: Novas armas visíveis e equipáveis
4. **PARAR E VALIDAR**: Testar as 3 armas no fluxo de criação de personagem
5. Prosseguir para Phase 4 (Efeitos pelo Mestre) após validação

### Entrega Incremental

1. **MVP**: Novas armas (Phase 3) — valor imediato, sem dependências complexas
2. **Extensão 1**: Configuração de efeitos pelo Mestre (Phase 4)
3. **Extensão 2**: Ativação de efeitos no combate (Phase 5)
4. Cada fase entrega valor sem quebrar o anterior

---

## Notes

- `[P]` = arquivos diferentes, sem dependências entre si — podem ser executados em paralelo
- O botão `ShieldPlus` (resistências) é **exclusivo de armaduras/escudos/elmos**
- O botão `Zap` (efeitos ofensivos) é **exclusivo de armas** — nunca exibir em armaduras
- `weapon_effects` em `character_items` nunca existirá em registros de armaduras por convenção
- Natural 18+ refere-se ao **dado bruto** (antes de modificadores), portanto o campo no formulário deve ser o d20 puro
- Ao aplicar efeito de arma, sempre respeitar o Sistema de Resistência de Armadura (feature 043)
