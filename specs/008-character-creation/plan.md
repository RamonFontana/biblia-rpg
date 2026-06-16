# Implementation Plan: Character Creation

**Branch**: `008-character-creation` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-character-creation/spec.md`

## Summary

Implement a 9-step gamified character creation wizard where users select their tribe, vocation, attributes, faith aspects, and equipment. The form state will be validated using React Hook Form and Zod, and the final character payload will be persisted to the user's account via Supabase MCP.

## Technical Context

**Language/Version**: TypeScript, React 18+

**Primary Dependencies**: React Hook Form, Zod, Supabase JS Client, TailwindCSS, Zustand (for wizard state), Lucide React (icons)

**Storage**: Supabase (PostgreSQL - characters table linked to auth.users)

**Testing**: Vitest, React Testing Library

**Target Platform**: Web Browser

**Project Type**: Web Application

**Performance Goals**: Instant UI transitions between wizard steps (<100ms), robust local state before final commit.

**Constraints**: Must strictly follow the RPG's rules (Iron/Bronze age items, Faith system, Levite rule).

**Scale/Scope**: Multi-step wizard, ~10 related state branches, single API call to save at the end.

## Constitution Check

*GATE: Passed*

- **I. Sem Magia Arcana**: Character creation correctly uses Faith System (Fortress/Temptation) instead of spells.
- **II. Sem Itens Mágicos**: Equipment step only allows Bronze/Iron age gear.
- **III. Sistema de Fé**: Enforces selection of Fortress and Temptation.
- **IV. Tribos como Raças**: Integrated as the first step of character identity.
- **V. A Regra de Levi**: UI will enforce Levites to be Sacerdote/Sábio.
- **VI. Documentação**: Feature is fully documented in `spec.md`.

## Project Structure

### Documentation (this feature)

```text
specs/008-character-creation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── features/character-creation/
│   ├── components/
│   │   ├── WizardLayout.tsx
│   │   ├── steps/
│   │   │   ├── TribeSelection.tsx
│   │   │   ├── VocationSelection.tsx
│   │   │   ├── AttributeGeneration.tsx
│   │   │   ├── FaithAspects.tsx
│   │   │   ├── InitialStats.tsx
│   │   │   ├── EquipmentMerchant.tsx
│   │   │   ├── NarrativeDetails.tsx
│   │   │   └── Summary.tsx
│   ├── schemas/
│   │   └── characterSchema.ts       # Zod schemas
│   ├── store/
│   │   └── useCharacterCreationStore.ts # Zustand state
│   └── types/
│       └── index.ts
└── pages/
    └── CharacterCreationPage.tsx
```

**Structure Decision**: The feature is modularized under `src/features/character-creation/` to encapsulate its unique multi-step state, Zod schemas, and local components, keeping the global `src/components` clean.
