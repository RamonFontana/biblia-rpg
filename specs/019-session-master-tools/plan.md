# Implementation Plan: Session Master Tools & Faith Test Fixes

**Branch**: `019-session-master-tools` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/019-session-master-tools/spec.md`

## Summary

The GM needs the ability to override character PV and Faith directly from the session interface. This update must enforce maximum PV bounds, avoid marking PCs as dead instantly on 0 PV, but instantly kill NPCs on 0 PV. Additionally, a generic dice roller will be added, and the Faith Test penalty dialog will be corrected to deduct 1d6 from the character's faith sheet automatically.

## User Review Required
Nenhum no momento. As regras base e a base de dados já comportam essas alterações. Se o usuário estiver de acordo, podemos iniciar a implementação (após sua aprovação).

## Open Questions
Nenhuma.

## Proposed Changes

### Database Schema (Supabase)
> [!TIP]
> The database has been verified using the Supabase MCP. `characters` and `session_npcs` tables both use a `jsonb` field for `stats`. The DB is already perfectly aligned and ready; no migrations are required.

### src/components/session/

#### [MODIFY] [PlayerTestDialog.tsx](file:///Users/take5dev1/projects/rpg-biblico/src/components/session/PlayerTestDialog.tsx)
- Ensure the dialog forces a 1d6 roll for Faith Test penalty.
- Update the submission handler to deduct the result from the character's Faith in the database using the Supabase client.

#### [NEW] [DiceRollerDialog.tsx](file:///Users/take5dev1/projects/rpg-biblico/src/components/session/DiceRollerDialog.tsx)
- A new dialog component that allows the user to select d4, d6, d8, d10, d12, d20, d100 and roll.
- The roll result is displayed locally and privately.

#### [MODIFY] Character / NPC display components (e.g. SessionCharacterCard)
- Add edit mode or editable inputs for PV and Faith for GMs.
- Implement constraint: PV cannot exceed `max_hp`.
- When updating, check if NPC and PV == 0: change status to "Morto".
- When updating, check if PC and PV == 0: keep status as "Vivo" (ou Inconsciente).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Sem Magia Arcana)**: PASS (No magic added)
- **Principle II (Sem Itens Mágicos)**: PASS (No items added)
- **Principle III (Sistema de Fé como Núcleo)**: PASS (Properly handling the 1d6 Faith deduction from temptations according to the rules)
- **Principle VI (Documentação)**: PASS (Rule of PC vs NPC death is aligned with `docs/regras-base.md`)

## Project Structure

### Documentation (this feature)

```text
specs/019-session-master-tools/
├── plan.md              # This file
├── research.md          # Database and implementation findings
├── data-model.md        # Data requirements
```

### Source Code

```text
src/
└── components/
    └── session/
        ├── DiceRollerDialog.tsx
        ├── PlayerTestDialog.tsx
        └── [Character Card Component]
```

## Verification Plan

### Automated Tests
- N/A.

### Manual Verification
1. Join session as GM. Edit a PC's PV to 0. Verify PC is not dead. Edit an NPC's PV to 0. Verify NPC is dead.
2. Edit a character's PV to exceed Max PV. Verify it caps at Max PV.
3. Open generic Dice Roller. Roll each dice type. Verify private output.
4. Initiate a Faith Test. Fail it. Roll the 1d6 penalty. Verify Faith decreases in the DB.
