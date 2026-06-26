# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

## Summary

Adicionar imagens customizadas aos cards e fichas de personagens (a partir do banco de dados em `narrative.imageUrl`). Se a imagem não existir, um fallback de fundo colorido com as iniciais do personagem será renderizado para não prejudicar o layout e manter a identificação visual. O foco principal é manter a responsividade e a integridade do design atual.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript / React

**Primary Dependencies**: Tailwind CSS, lucide-react (if icons needed, but we'll use initials)

**Storage**: Supabase (reads from existing `characters` table)

**Testing**: Manual Visual Testing (Layout & Responsiveness)

**Target Platform**: Web (Responsive mobile/desktop)

**Project Type**: Web Application

**Performance Goals**: N/A (Image loading is standard browser behavior)

**Constraints**: Must not break existing layouts (cards, sheets, headers)

**Scale/Scope**: Impacts `PlayerCombatView`, `CharacterSheet`, and other lists where characters are shown

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[N/A - Feature conforms to all principles. No magic or items added. Only UI changes.]

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
├── components/
│   ├── ui/               # New shared CharacterAvatar component
│   └── combat/           # PlayerCombatView.tsx updates
│   └── character/        # Character sheet components
```

**Structure Decision**: UI-only change. A reusable avatar component will be placed in `src/components/ui/` or `src/components/character/` and consumed by existing views.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
