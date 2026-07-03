# Implementation Plan: Sistema de Progressão de Nível

**Branch**: `048-level-progression` | **Date**: 2026-07-03 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/048-level-progression/spec.md)

**Input**: Feature specification from `/specs/048-level-progression/spec.md`

**Note**: This plan was generated following the `speckit-plan` guidelines.

## Summary

Implementar o sistema de progressão de nível no RPG Bíblico. O mestre poderá indicar os personagens aptos ao level up ao encerrar uma sessão. Os jogadores verão um indicador de progressão e realizarão um fluxo guiado para atualizar os status (Nível, PV), escolhendo novas habilidades de Vocação/Tribo e melhoria de atributos (ASI), mantendo tudo persistido no Supabase. O nível será visível universalmente nos cards.

## Technical Context

**Language/Version**: TypeScript / React

**Primary Dependencies**: Supabase (Database + Auth), Tailwind CSS, React Router

**Storage**: Supabase PostgreSQL (`characters`, `game_sessions`, `session_participants` tables)

**Testing**: N/A (Manual Testing)

**Target Platform**: Web Application (Mobile-first responsive)

**Project Type**: Web Application

**Performance Goals**: UI updates should be optimistic and fast.

**Constraints**: O level up deve ser bloqueado durante sessões ativas para garantir integridade. HP retroativo deve ser calculado no aumento de CON.

**Scale/Scope**: Modificação no fluxo de fim de sessão (mestre), listagem de personagens e criação de um Wizard de Level Up.

## Constitution Check

*GATE: Passed*

- **Fidelidade Bíblica / Sem Magia Arcana**: Não se aplica (não estamos adicionando magia).
- **Materialismo Histórico**: Não se aplica (sem itens).
- **Sistema de Fé**: A progressão de nível não altera diretamente a Fé, mas usa a barra normal.
- **Tribos como Raças**: A progressão respeita os marcos de nível (1, 4, 8, 12, 16, 20) com as duas opções de caminhos para Tribos.
- **A Regra de Levi**: Mantida.
- **Documentação como Fonte de Verdade**: As mecânicas de ASI, modificadores e cálculo de PV estão de acordo com `regras-base.md`.

## Project Structure

### Documentation (this feature)

```text
specs/048-level-progression/
├── plan.md              # This file
├── spec.md              # Feature specification
├── checklists/          # Checklists directory
│   └── requirements.md  # Requirements QA
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── character/       # CharacterCard, CharacterSheetView
│   └── session/         # PlayerCard, SessionParticipantList
├── features/
│   └── character-management/ # CharacterList, LevelUpWizard (novo)
└── pages/
    └── session/         # ActiveSessionPage, CreateSessionPage
```

**Structure Decision**: A estrutura atual de features será mantida. Um novo componente de fluxo (LevelUpWizard) será adicionado dentro do domínio `character-management`. O banco de dados Supabase receberá uma migration para adicionar a coluna `pending_level_up`.
