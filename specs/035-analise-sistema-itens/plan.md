# Implementation Plan: Análise e Melhorias no Sistema de Itens

**Branch**: `[035-analise-sistema-itens]` | **Date**: 2026-06-21 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/035-analise-sistema-itens/spec.md)

**Input**: Feature specification from `/specs/035-analise-sistema-itens/spec.md`

## Summary

O sistema de itens será atualizado para suportar propriedades de mecânicas (Versátil, Acuidade, Furtividade em Desvantagem) diretamente na UI de inventário e nas janelas de teste de sessão, além da adição dos itens Símbolo Proibido e Flechas na base de dados (`itemsDb.ts`) com a propriedade consumível / penalidade em fé.

## Technical Context

**Language/Version**: React / TypeScript

**Primary Dependencies**: Next.js, Supabase

**Storage**: Supabase DB (`items` e `character_items` tables via jsonb `effects`)

**Testing**: Manual test (in-app feature validation)

**Target Platform**: Web application (Desktop/Mobile)

**Project Type**: Web-service/Application

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Fidelidade Bíblica**: O Símbolo Proibido respeita as penalidades de fé.
- **Sem Itens Mágicos**: Todas as melhorias respeitam a mecânica bruta física e não adicionam propriedades mágicas às armas.

## Project Structure

### Documentation (this feature)

```text
specs/035-analise-sistema-itens/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
```

### Source Code (repository root)

```text
src/
├── data/
│   └── itemsDb.ts             # Onde os itens serão adicionados
├── features/
│   └── character-management/
│       └── api/
│           └── syncInventory.ts # Parser das propriedades
└── components/
    ├── inventory/
    │   └── InventoryList.tsx    # Lógica de equipar 2h / usar munição
    └── session/
        └── PlayerTestDialog.tsx # Lógica de aviso de desvantagem e perda passiva de fé
```

**Structure Decision**: A estrutura segue o modelo centralizado atual do projeto para inventário e itens no frontend (`src/data`, `src/features`, `src/components`).
