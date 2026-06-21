# Implementation Plan: Sistema de Equipamentos e Inventário

**Branch**: `028-equip-items` | **Date**: 2026-06-19 | **Spec**: [specs/028-equip-items/spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/028-equip-items/spec.md)

**Input**: Feature specification from `specs/028-equip-items/spec.md`

## Summary

Implementar a interface e lógica para equipar/desequipar itens no inventário do personagem. O sistema atualizará reativamente a Classe de Armadura (CA) e aplicará o dado de dano oficial das armas (1d4, 1d8, etc) aos ataques. Também irá simplificar a exibição da arma dos inimigos/NPCs.

## Technical Context

**Language/Version**: TypeScript, React (Vite)

**Primary Dependencies**: Supabase Client, TailwindCSS, React Context/Hooks

**Storage**: PostgreSQL (Supabase) via JSONB column `characters.equipment`

**Testing**: N/A (Manual tests per User Stories)

**Target Platform**: Web Browser

**Project Type**: Web Application

**Performance Goals**: N/A

**Constraints**: Frontend validation of equipment state before saving to the backend. Will utilize Supabase client to enforce persistence correctly.

**Scale/Scope**: Frontend component updates and Supabase real-time sync via existing context.

## Constitution Check

*GATE: Passed. Complies with the RPG constitution.*
- Não há magia envolvida.
- Itens refletem o padrão histórico.

## Project Structure

### Documentation (this feature)

```text
specs/028-equip-items/
├── plan.md              # This file
├── research.md          # Data structure & rationale
├── data-model.md        # Entities definition
├── quickstart.md        # Testing instructions
├── contracts/           # Frontend UI components behavior
└── tasks.md             # (Will be generated next)
```

### Source Code

```text
src/
├── types/
│   └── combat.ts           # Adicionar/atualizar as interfaces para Equipment
├── components/
│   ├── inventory/          # Componentes relacionados a exibir e equipar itens
│   │   ├── InventoryList.tsx
│   │   └── EquipmentSlots.tsx
│   └── combat/             # Atualizar para refletir CA dinâmico e dado de dano
│       ├── PlayerCombatView.tsx
│       ├── EnemyCard.tsx
│       └── PhysicalRollForm.tsx
└── lib/
    └── supabase.ts         # Se houver alguma atualização no setup de DB (embora improvável, os inserts usam isto)
```

**Structure Decision**: Option 1 (Single project, Web Application based React Vite structure). The focus is entirely in the `src/components` and `src/types` directory, extending the existing frontend architecture and using the existing Supabase integration.
