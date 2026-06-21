# Implementation Plan: Mostrar Dano de Armas no Inventário

**Branch**: `034-mostrar-dano-armas` | **Date**: 2026-06-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/034-mostrar-dano-armas/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

O objetivo é exibir o dano das armas na interface de inventário dentro da sessão ativa (`InventoryList.tsx`). Utilizaremos o dicionário local `ITEMS_DB` para suprir qualquer falta de dados da propriedade JSON `effects` no banco de dados e para exibir a string completa do dano (incluindo o tipo, ex: "1d6 cortante").

## Technical Context

**Language/Version**: TypeScript / React

**Primary Dependencies**: React, Tailwind CSS

**Storage**: Supabase (apenas leitura das tabelas já existentes)

**Testing**: N/A

**Target Platform**: Web (Desktop e Mobile)

**Project Type**: Web Application

**Performance Goals**: N/A

**Constraints**: O layout deve se manter responsivo (mobile-first), o novo texto deve ser legível.

**Scale/Scope**: Pequena alteração em um único componente de UI (`InventoryList.tsx`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I & II**: Sem magia ou itens sobrenaturais (Não afeta).
- **Principle III**: Sistema de Fé (Não afeta).
- **Principle VI**: Documentação. A alteração está documentada e não introduz novas regras, apenas expõe visualmente regras já existentes (`ITEMS_DB`).

✅ **Passa em todas as restrições constitucionais.**

## Project Structure

### Documentation (this feature)

```text
specs/034-mostrar-dano-armas/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
└── components/
    └── inventory/
        └── InventoryList.tsx
```

**Structure Decision**: Alteração direta no componente existente `InventoryList.tsx` na camada de interface da aplicação.

## Complexity Tracking

N/A
