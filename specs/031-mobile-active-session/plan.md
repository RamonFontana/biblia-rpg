# Implementation Plan: mobile-active-session

**Branch**: `031-mobile-active-session` | **Date**: 2026-06-21 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/031-mobile-active-session/spec.md)

**Input**: Feature specification from `/specs/031-mobile-active-session/spec.md`

## Summary

Configure `ActiveSessionPage.tsx` and its child components to be responsive on mobile devices. This includes grouping the GM action buttons into a `DropdownMenu` to save header space, adjusting the grid layouts to 1 column on small screens, and ensuring modals fit within the viewport.

## Technical Context

**Language/Version**: TypeScript / React (Next.js/Vite)

**Primary Dependencies**: Tailwind CSS, shadcn/ui

**Project Type**: Web Application

**Target Platform**: Mobile and Desktop browsers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Fidelidade Bíblica**: N/A (UI only change)
- **Materialismo Histórico**: N/A (UI only change)
- **Sistema de Fé**: N/A (UI only change)
- **Documentação**: Updated the `ActiveSessionPage` layout without altering game rules.

## Project Structure

### Documentation (this feature)

```text
specs/031-mobile-active-session/
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

### Source Code

```text
src/
├── components/
│   └── ui/               # Where DropdownMenu will be installed
├── pages/
│   └── session/
│       └── ActiveSessionPage.tsx
```

**Structure Decision**: We will stick to the existing project structure. A new shadcn UI component `DropdownMenu` will be added to `src/components/ui/`.
