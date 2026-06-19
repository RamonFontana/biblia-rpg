# Implementation Plan: combat-system

**Branch**: `026-combat-system` | **Date**: 2026-06-19 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/026-combat-system/spec.md)

**Input**: Feature specification from `/specs/026-combat-system/spec.md`

## Summary

Implementação do sistema de tracker de combate em tempo real para assistir mesas físicas de RPG. A abordagem técnica utiliza Supabase (tabelas de estado de combate e Realtime subscriptions) e Zustand (para estado de checklist local do jogador). Formulários e modais utilizarão Shadcn UI, React Hook Form e Zod para garantia de consistência e tipagem, obedecendo às restrições do cenário bíblico.

## Technical Context

**Language/Version**: TypeScript / React

**Primary Dependencies**: Supabase (@supabase/supabase-js), Zustand, Shadcn UI, React Hook Form, Zod.

**Storage**: Supabase PostgreSQL (`combats`, `combat_participants` tables)

**Testing**: Teste de fluxo manual documentado no quickstart e tipagem rigorosa Zod + TypeScript.

**Target Platform**: Web application (Browser: Desktop, Tablet, Mobile)

**Project Type**: Web application

**Performance Goals**: Updates de estado entre Mestre e Jogadores em menos de 2 segundos.

**Constraints**: Aplicação deve ser responsiva (jogadores geralmente usam celular na mesa).

**Scale/Scope**: Poucos participantes simultâneos por sessão, escala bem coberta pelo limite de conexões Realtime do Supabase.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Princípio I (Sem Magia Arcana)**: OK.
- **Princípio II (Materialismo Histórico)**: OK. 
- **Princípio VI (Documentação como Fonte de Verdade)**: OK.

Nenhum conflito encontrado. A feature é de gerenciamento de estado e interface de Mestre/Jogador, agnóstica em relação às mecânicas core proibidas.

## Project Structure

### Documentation (this feature)

```text
specs/026-combat-system/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (rotas do jogador e mestre dentro da /session/)
├── components/
│   ├── combat/
│   │   ├── CombatDashboard.tsx
│   │   ├── CombatSetupModal.tsx
│   │   └── PlayerCombatView.tsx
│   └── ui/ (Shadcn components)
├── store/
│   └── combatStore.ts
├── lib/
│   └── supabase/ (setup client)
└── types/
    └── combat.ts
```

**Structure Decision**: Padrão do projeto React, `components/combat` agrupará a interface. `store/combatStore.ts` centraliza a lógica do Zustand. Tipos e Schemas do Zod ficarão em `types/combat.ts`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*(Nenhuma violação identificada)*
