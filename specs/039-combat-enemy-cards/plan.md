# Implementation Plan: combat-enemy-cards

**Branch**: `039-combat-enemy-cards` | **Date**: 2026-06-26 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/039-combat-enemy-cards/spec.md)

**Input**: Feature specification from `/specs/039-combat-enemy-cards/spec.md`

## Summary

O objetivo é exibir os inimigos ativos no combate na visão do jogador, permitindo que ele consulte um "card" resumido e a ficha completa dos inimigos. Com base na pesquisa, a sincronização do PV (HP) já ocorre via Supabase Realtime de forma nativa e automática no `combatStore.ts`.

## Technical Context

**Language/Version**: TypeScript / React

**Primary Dependencies**: React, TailwindCSS, Supabase (Realtime / Store), Zustand (`useCombatStore`)

**Storage**: Supabase PostgreSQL (Tabela `combat_participants` já reflete o PV em tempo real)

**Testing**: Validação visual manual dos componentes criados.

**Target Platform**: Web App (Browser)

**Project Type**: Web Application

**Performance Goals**: Exibir componentes sem lentidão e processar payload de realtime sem perdas.

**Constraints**: O layout deve se adequar a dispositivos responsivos para que a lista de inimigos não quebre a interface (Edge Cases).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I & II**: Sem magia arcana e itens mágicos. Os componentes criados apenas renderizam dados do inimigo e HP, portanto não desrespeitam a ambientação ou restrições de magia.
- **Principle III & IV & V**: Regras de fé, tribos e classes não são modificadas. Apenas interface de consulta.
- **Principle VI**: O design baseia-se na documentação existente de combate. O HP sincronizado foi pesquisado no código base. 

Nenhum conflito encontrado.

## Project Structure

### Documentation (this feature)

```text
specs/039-combat-enemy-cards/
├── plan.md              # This file
├── research.md          # Validada sincronização de PV
├── data-model.md        # Confirma uso da tabela combat_participants existente
└── quickstart.md        # Resumo da implementação base de interface
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── combat/
│   │   ├── PlayerCombatView.tsx     # Onde injetaremos a lista de inimigos
│   │   ├── EnemyCombatList.tsx      # Novo componente ou inserido no view
│   │   ├── EnemyCard.tsx            # Novo componente para o card
│   │   └── EnemySheet.tsx           # Ficha completa (Modal ou Drawer)
```

**Structure Decision**: Apenas adição de novos componentes sob `src/components/combat/` e integração no `PlayerCombatView.tsx` já existente. O store e o banco de dados permanecem inalterados, pois a infraestrutura do Realtime já resolve o espelhamento de dados (HP) nativamente.
