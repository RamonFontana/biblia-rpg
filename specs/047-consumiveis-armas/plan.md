# Implementation Plan: Mecânica de Munição e Consumíveis

**Branch**: `047-consumiveis-armas` | **Date**: 2026-07-03 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/047-consumiveis-armas/spec.md)

**Input**: Feature specification from `/specs/047-consumiveis-armas/spec.md`

## Summary

Implementar a mecânica de munição e consumíveis. Permitir que o jogador reduza as cargas de itens como flechas e pedras de funda com 1 clique (como itens consumíveis comuns). Adicionar a funcionalidade de recuperar flechas com teste automático de chance (50% de chance de recuperar cada flecha gasta). Dar ao Mestre a opção de adicionar cargas a itens no inventário rapidamente (para itens que podem ser comprados ou ganhos como pedras de funda).

## Technical Context

**Language/Version**: TypeScript / React

**Primary Dependencies**: Supabase, React

**Storage**: PostgreSQL (Supabase) - Será necessário lidar com cargas em `character_items`

**Testing**: Teste manual da interface e do banco de dados

**Target Platform**: Web App Responsivo

**Project Type**: Web App (RPG Helper)

**Performance Goals**: Updates de DB responsivos (< 200ms)

**Constraints**: Usar o modelo de dados já existente em `character_items` ou adicionar `current_charges`/`max_charges`. A interface precisa ser simples, sem poluir a lista.

**Scale/Scope**: Modificação restrita a componentes de Inventário (visão do Jogador) e Gestão do Mestre, além de pequenas atualizações nas queries Supabase para incremento/decremento atômico.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Fidelidade Bíblica**: Sem magia envolvida, a munição segue lógica física (quebra de flechas, reposição manual de pedras). PASS.
- **II. Materialismo Histórico**: Apenas armas e equipamentos da época do bronze/ferro. PASS.
- **VI. Documentação**: A regra de mecânica de munição precisará ser documentada no `regras-base.md`. PASS.

## Project Structure

### Documentation (this feature)

```text
specs/047-consumiveis-armas/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── inventory/
│   │   ├── InventoryList.tsx
│   │   └── ...
├── features/
│   └── character-management/
│       └── api/
│           └── syncInventory.ts
├── data/
│   └── itemsDb.ts
supabase/
└── migrations/
    └── [new_migration]_add_consumable_fields.sql (Se for alterar schema)
```

**Structure Decision**: Opção 2 adaptada para a estrutura do projeto web (React). Integraremos ações nos componentes de inventário existentes e criaremos a regra de negócio num serviço ou hook.
