# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

## Summary

This feature updates the `InventoryList` component to display the healing values of consumable items (fixed or dice-based) as a small badge with a heart icon (e.g., `❤️ 1d6` or `❤️ 2 PV`). This allows players to know exactly what the item does without opening a details modal.

## Technical Context

**Language/Version**: TypeScript, React (Next.js)

**Primary Dependencies**: TailwindCSS, Lucide React (for icons)

**Storage**: Supabase (PostgreSQL) - via the `effects` JSONB column in `items` table.

**Testing**: N/A (Manual visual verification in browser)

**Target Platform**: Web Browser

**Project Type**: web-app

**Performance Goals**: N/A

**Constraints**: Must match existing UI aesthetics.

**Scale/Scope**: Impacts single UI component (`InventoryList.tsx`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Sem Magia Arcana):** PASS. This is pure UI, no mechanics altered.
- **Principle II (Sem Itens Mágicos):** PASS. Itens de cura representam emplastros ou itens naturais.
- **Principle III (Sistema de Fé):** N/A.
- **Principle IV & V (Tribos e Levi):** N/A.
- **Principle VI (Documentação):** PASS. Feature specifies rules in `spec.md` and `data-model.md`.

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
```text
src/
└── components/
    └── inventory/
        └── InventoryList.tsx
```

**Structure Decision**: Option 1: Single project - The application is a Next.js single project. Changes are scoped directly to the `src/components/inventory` directory.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
