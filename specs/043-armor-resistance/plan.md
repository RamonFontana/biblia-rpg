# Implementation Plan: Armor Resistance

**Branch**: `042-effects-conditions` | **Date**: 2026-06-30 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/043-armor-resistance/spec.md)

**Input**: Feature specification from `/specs/043-armor-resistance/spec.md`

## Summary

Adicionar mecânica de resistência a condições através de armaduras, escudos e elmos, onde o **nível da armadura (1 a 4+)** determina o grau de proteção (Vantagem -> Meia Duração -> Vantagem+Meia Duração -> Imunidade). Além disso, introduzir restrições de vocação para equipamentos pesados/específicos.

## Technical Context

**Language/Version**: TypeScript (React)
**Primary Dependencies**: React, Zustand (combatStore)
**Storage**: N/A (in-memory data `itemsDb.ts` + Supabase sync handled by `syncInventory`)
**Testing**: N/A
**Target Platform**: Web/Mobile App
**Project Type**: RPG Companion App
**Performance Goals**: Instantaneous combat resolution
**Constraints**: Keep UI clean, mobile-friendly.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I & II**: Sem Magia / Itens Mágicos. **PASS**: As resistências são justificadas por materiais pesados, grossos ou isolantes da Idade do Bronze/Ferro (ex: túnica grossa contra venenos de contato, armadura pesada contra sangramento). Não há "bônus mágico +1".
- **Principle IV & V**: Vocações/Tribos. **PASS**: As restrições de equipamento (`requiredVocation`) reforçam a identidade de cada classe.
- **Principle VI**: Documentação. **PASS**: A documentação `armaduras.md` será atualizada junto com o `itemsDb.ts`.

## Project Structure

### Documentation (this feature)

```text
specs/043-armor-resistance/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── tasks.md             # To be created
```

### Source Code

```text
src/
├── data/
│   ├── itemsDb.ts           # Adição das novas armaduras (head, body) com level, resistências e vocações
├── features/
│   ├── character-creation/
│   │   ├── types/index.ts   # Atualização da interface EquipmentItem
│   │   ├── components/steps/EquipmentMerchant.tsx # Atualização UI para checar requiredVocation
├── services/
│   ├── combatEngine.ts      # Lógica de cálculo de resistência e nível da armadura
├── components/
│   ├── combat/
│   │   ├── CombatDashboard.tsx # Onde o Toast de notificação será possivelmente despachado
└── types/
    ├── combat.ts            # Atualizar CharacterEquipment / ItemEffects
docs/
├── itens/
│   ├── armaduras.md         # Atualizar com as novas armaduras, elmos e mecânicas
```

**Structure Decision**: Utilizaremos a estrutura existente, expandindo o modelo de dados de itens e a lógica do motor de combate.

## Complexity Tracking

*Nenhuma violação da Constituição. Complexidade mantida baixa aproveitando o motor de combate já existente.*
