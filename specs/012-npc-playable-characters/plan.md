# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Adição da opção de criar "NPCs Jogáveis" com ficha completa durante a etapa 3 da criação de sessão. Os NPCs terão suporte a presets rápidos e as fichas completas serão criadas por meio de um Modal/Slide-over para não poluir a interface do wizard. Ao finalizar a sessão, esses NPCs serão salvos na tabela `characters` e vinculados à sessão via `session_participants`.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript / React 18

**Primary Dependencies**: Zustand, React Hook Form, Zod, Supabase, shadcn/ui (Sheet/Dialog)

**Storage**: Supabase PostgreSQL (`characters` e `session_participants` tables)

**Testing**: N/A

**Target Platform**: Web browser

**Project Type**: Web application

**Performance Goals**: Interações instantâneas no formulário

**Constraints**: Integração suave com o wizard de 5 passos e o `useSessionDraftStore`

**Scale/Scope**: Adição de um Slide-over de formulário, atualização da store e criação de um JSON de presets.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I & II (Fidelidade Bíblica / Sem Magia)**: O formulário de criação de personagem dentro do Modal reutilizará a estrutura existente que já respeita a ausência de magia e itens mágicos.
- **Principle IV (Tribos como Raças)**: A ficha incluirá a seleção da Tribo de acordo com as regras de raça.
- **Principle V (Regra de Levi)**: A validação do formulário precisará garantir que, se Tribo == Levi, a classe DEVE ser Sacerdote/Sábio.
- **Principle VI (Documentação)**: Todas as lógicas seguirão as regras já estabelecidas no `docs/regras-base.md`.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── components/session/
│   ├── CreateSessionForm/
│   │   ├── Step3NPCs.tsx
│   │   └── NPCCharacterSheetModal.tsx
├── store/
│   └── createSessionStore.ts
├── services/
│   └── sessionService.ts
└── data/
    └── npcPresets.json
```

**Structure Decision**: Utilizaremos a estrutura existente da aplicação React, adicionando o modal de ficha de personagem (`NPCCharacterSheetModal.tsx`) na mesma pasta do wizard, além de um arquivo JSON estático para os presets em `src/data/`.

## Complexity Tracking

N/A - Sem violações da constituição.
