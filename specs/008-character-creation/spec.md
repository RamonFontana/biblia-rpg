# Feature Specification: Character Creation

**Feature Branch**: `008-character-creation`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "quero criar agora a parete de criação de personagem, na home vai ter a opção de criar uma partida ou criar personagem (que vamos fazer agora). No clarify vou especificar como vai ser"

## Clarifications

### Session 2026-06-15
- Q: Where are created characters stored? → A: In the user's account using the configured Supabase backend.
- Q: Should the character creation UI flow be a multi-step wizard or a single long page? → A: A highly gamified, 9-step multi-step wizard.
- Q: Method for generating attributes? → A: User chooses between Standard Array (assigning from highest to lowest) or Dice (automatically rolls and assigns everything, user just views and advances).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Step 1 & 2: Select Tribe and Vocation (Priority: P1)

Users select their character's tribe and vocation (class), viewing a brief description and the abilities/progressions of each before advancing.

**Why this priority**: Tribe and class are the fundamental identity pillars in the RPG setting, required to determine any stats.

**Independent Test**: Can be tested by verifying the user can select a tribe and a class, and that the appropriate details/passives for the selection are displayed on screen.

**Acceptance Scenarios**:

1. **Given** the user is on the first step, **When** they select a tribe, **Then** a description and abilities/progressions are shown.
2. **Given** the user proceeds to the second step, **When** they select a vocation, **Then** a description and abilities/progressions are shown.

---

### User Story 2 - Step 3 & 4: Generate and Assign Attributes (Priority: P1)

Users choose their attribute generation method (Standard Array or Dice) and then assign them.

**Why this priority**: Attributes are essential for all gameplay mechanics and must be defined before the character is complete.

**Independent Test**: Can be tested by verifying that attribute values are correctly generated based on the selected method.

**Acceptance Scenarios**:

1. **Given** the user chooses the Array method, **When** they advance, **Then** they must assign values from highest to lowest manually.
2. **Given** the user chooses the Dice method, **When** they advance, **Then** the stats are automatically rolled and assigned, and the user just views the result before proceeding.

---

### User Story 3 - Step 5: Select Fortress and Temptation (Priority: P1)

Users must define 1 Fortress (virtue) and 1 Temptation (flaw) from a list, viewing their descriptions side-by-side.

**Why this priority**: Central mechanic of the Faith System in the biblical RPG.

**Independent Test**: Can be tested by ensuring exactly one Fortress and one Temptation can be selected and their descriptions render properly.

**Acceptance Scenarios**:

1. **Given** the user is on step 5, **When** they select a Fortress, **Then** its description appears next to it.
2. **Given** the user selects a Temptation, **Then** its description appears next to it.

---

### User Story 4 - Step 6: Initial Calculations (Priority: P2)

Users view their automatically calculated initial stats: Health Points (PV), Armor Class (CA), and Faith Points.

**Why this priority**: Sets expectations for combat and mechanics before buying equipment.

**Independent Test**: Can be tested by ensuring the calculated values match the rules for the selected tribe, vocation, and attributes.

**Acceptance Scenarios**:

1. **Given** the user reaches step 6, **When** the page loads, **Then** they see their PV, CA, and Faith Points automatically calculated.

---

### User Story 5 - Step 7: Initial Equipment Merchant (Priority: P1)

Users purchase starting equipment from a gamified "merchant" interface using their initial coin allowance, or by selecting standard recommended packages.

**Why this priority**: Equipment is crucial for survival and dictates early game capabilities.

**Independent Test**: Can be tested by ensuring the wallet deducts correctly and packages show correct item tooltips.

**Acceptance Scenarios**:

1. **Given** the user is on step 7, **When** they view recommended packages, **Then** they can click a "?" to see included items.
2. **Given** the user selects an individual item, **When** it's added, **Then** its cost is deducted from the character's coin total.
3. **Given** the user has selected an item, **When** they click the "?", **Then** the item's description is shown.

---

### User Story 6 - Step 8 & 9: Character Details, Summary and Save (Priority: P1)

Users finalize their character creation process by entering narrative details (name, descriptions) and reviewing a final summary before saving to Supabase.

**Why this priority**: Gives flavor to the character and permanently stores it in the database.

**Independent Test**: Can be tested by finalizing a character and confirming it appears in the user's Supabase account.

**Acceptance Scenarios**:

1. **Given** the user is on step 8, **When** they input an optional image, name, physical/historical descriptions, and personality, **Then** these details are saved.
2. **Given** the user is on the final step, **When** they click confirm on the summary, **Then** the character is permanently saved to the Supabase database.

### Edge Cases

- What happens if the user abandons the creation process halfway through?
- How does the system handle names that are already taken or contain invalid characters?
- What happens if the user tries to buy items exceeding their coin limit?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a highly gamified, 9-step character creation wizard.
- **FR-002**: System MUST display descriptions and progressions when selecting a Tribe (Step 1) and Vocation (Step 2).
- **FR-003**: System MUST allow users to choose between Standard Array and Dice for attribute generation (Step 3).
- **FR-004**: System MUST handle Standard Array by allowing manual assignment from highest to lowest, and handle Dice by automatically rolling and assigning (Step 4).
- **FR-005**: System MUST allow selection of 1 Fortress and 1 Temptation, displaying their descriptions (Step 5).
- **FR-006**: System MUST automatically calculate and display initial PV, CA, and Faith Points (Step 6).
- **FR-007**: System MUST provide a merchant UI for equipment, showing initial coins, standard packages with item tooltips ("?"), and an item list that deducts coins upon selection (Step 7).
- **FR-008**: System MUST collect optional narrative details: image, name, physical description, history, and personality (Step 8).
- **FR-009**: System MUST display a full summary for validation (Step 9).
- **FR-010**: System MUST securely save the finalized character data to the user's Supabase account.

### Key Entities

- **Character**: Represents the player's avatar, containing Name, Tribe, Vocation, Attributes, Fortress, Temptation, Equipment, Coins, and Narrative Details.
- **Tribe**: The lineage of the character, providing specific passives.
- **Vocation**: The role of the character, providing progression paths.
- **Equipment Item**: An item with a cost, description, and stats.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully navigate the 9-step wizard and complete a character creation in under 5 minutes.
- **SC-002**: 100% of created characters adhere to the RPG's tribe, class, and attribute constraints without invalid states.
- **SC-003**: Characters are successfully saved to Supabase and can be retrieved without data loss in 99.9% of attempts.

## Assumptions

- Users have already logged into the application via Supabase.
- The rules for tribes, classes, fortresses, temptations, and base stats are already established in the game's documentation.
- The Supabase MCP and backend schemas are configured to receive this character payload.
