# Feature Specification: Session Master Tools & Faith Test Fixes

**Feature Branch**: `019-session-master-tools`

**Created**: 2026-06-17

**Status**: Draft

**Input**: User description: "as vezes alguns valores precisam ser alterados em casos muito especifcos pelo próprio mestre, até para caso der algum problema. esses valores são o PV ou a fé do usuário. O mestre não vai poder alterar o PV para mais do que o PV máximo do personagem, e mesmo que deixe em 0, o mestre por enquanto não pode mantar o personagem do jogador, mas do NPC ele vai poder matar, mudando o status do perosnagem para morto tornando ele bloqueado para qualquer ação do jogo, vai ter a regra de morte para o npc que nem o d&d que coloquei na minhas regras também, mas podemos implementar depois. Adicione também um botão que abre um dialog e vai ter a opção de escolher um dado e rolar ele, adicione todos os dados comuns usados nos rpgs. E corrija o teste fe fé criado, quando o usuário for fazer um teste de fé, primeiro ele tem que seguir a regra de teste de fé. segundo quando ele for reprovado, pode mostrar a opção de digitar o valor que deu no d6 ou colocar para rolar automatico, e após enviar, tem que discontar da ficha do personagem no banco de dados e atualizar a ficha dele."

## Clarifications

### Session 2026-06-17
- Q: Visibilidade do Rolador de Dados: Quando um dado genérico é rolado, o resultado deve ser transmitido em tempo real para todos na sessão verem? → A: Apenas local (Privado): Mostrar o resultado apenas para quem rolou o dado.
- Q: Penalidade no Teste de Fé: O dialog deve ser fixo em 1d6 para a penalidade ou permitir customização de dados? → A: Fixo em 1d6: Focar apenas na regra principal de Tentação para simplificar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Master Overrides PV and Faith (Priority: P1)

As a Game Master, I want to manually adjust the PV (Health Points) and Faith values of characters in the session to correct mistakes or handle specific narrative events.

**Why this priority**: Correcting state during a session is critical for smooth gameplay and addressing potential bugs or edge cases.

**Independent Test**: Can be fully tested by GM opening a character from the session, changing PV/Faith, and verifying the database reflects the new values.

**Acceptance Scenarios**:

1. **Given** a GM viewing a character, **When** they edit PV, **Then** the PV is updated but cannot exceed the character's maximum PV.
2. **Given** a GM editing a Player Character (PC)'s PV to 0, **When** they save, **Then** the PC's PV becomes 0 but their status does not become "dead" automatically.
3. **Given** a GM editing an NPC's PV to 0, **When** they save, **Then** the NPC's status changes to "dead" and they are blocked from taking further game actions.

---

### User Story 2 - General Dice Roller (Priority: P2)

As a player or GM, I want to click a button to open a dice roller dialog to roll standard RPG dice (d4, d6, d8, d10, d12, d20, d100) easily.

**Why this priority**: Rolling dice is fundamental to RPGs. A built-in roller removes the need for physical dice or external apps.

**Independent Test**: Can be fully tested by opening the dialog, selecting a die, rolling it, and seeing the result.

**Acceptance Scenarios**:

1. **Given** the session interface, **When** the user clicks the dice roller button, **Then** a dialog opens showing standard RPG dice options.
2. **Given** the dice roller dialog, **When** the user selects a die and rolls, **Then** a random result for that die is generated and displayed privately only to the user who rolled it.

---

### User Story 3 - Corrected Faith Test Flow (Priority: P1)

As a player making a Faith Test, I want the system to correctly follow the test rules, allow me to input a manual d6 result or roll automatically if I fail, and automatically deduct the cost from my sheet.

**Why this priority**: The Faith system is core to the Biblical RPG. Accurate mechanics and state updates are essential for game balance.

**Independent Test**: Can be fully tested by initiating a Faith Test, failing it, submitting a d6 result, and verifying the character's stats are correctly updated in the database.

**Acceptance Scenarios**:

1. **Given** a character taking a Faith Test, **When** they initiate the test, **Then** the system prompts following the standard Faith Test rules.
2. **Given** a failed Faith Test, **When** prompted for the penalty, **Then** the user can choose to type a d6 result manually or click a button to auto-roll a d6.
3. **Given** a submitted penalty result, **When** the process completes, **Then** the appropriate penalty is deducted from the character's sheet in the database and the UI reflects the updated sheet.

### Edge Cases

- What happens if the GM inputs a negative value for PV or Faith? The system must clamp the minimum value to 0.
- How does the system handle an NPC that is already dead being healed by the GM? The system should revert their status to alive if PV is increased above 0.
- What happens if the user closes the Faith Test dialog before completing the penalty submission? The test is cancelled or the penalty is pending until completed, ensuring data consistency.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the GM to manually edit the current PV and Faith values for any character in an active session.
- **FR-002**: System MUST prevent setting current PV higher than the character's Maximum PV.
- **FR-003**: System MUST NOT change a Player Character (PC)'s status to "dead" when their PV reaches 0 through GM override.
- **FR-004**: System MUST change an NPC's status to "dead" and block further actions when their PV reaches 0 through GM override.
- **FR-005**: System MUST provide a global UI button that opens a generic Dice Roller dialog.
- **FR-006**: The Dice Roller dialog MUST support rolling d4, d6, d8, d10, d12, d20, and d100, and display the result privately to the user.
- **FR-007**: The Faith Test dialog MUST enforce the correct sequence of rules for taking a Faith Test.
- **FR-008**: Upon failing a Faith Test, the system MUST display an input for a manual d6 roll and a button to auto-roll a d6 to determine the penalty.
- **FR-009**: The system MUST automatically deduct the determined Faith penalty from the character's database record and update the active session state.

### Key Entities

- **Character (PC/NPC)**: Tracks current PV, Max PV, Faith, and Status (Alive/Dead).
- **Session**: The active game state where GMs and players interact.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: GM can successfully alter PV and Faith for any character within 3 clicks.
- **SC-002**: NPCs reaching 0 PV are automatically marked dead 100% of the time, while PCs are never automatically marked dead.
- **SC-003**: Players can access the dice roller dialog and generate a result in under 2 seconds.
- **SC-004**: A failed Faith test automatically and correctly updates the database character record 100% of the time.

## Assumptions

- Standard D&D dice set (d4, d6, d8, d10, d12, d20, d100) is sufficient for the generic roller.
- Real-time updates (Supabase) are already functioning to propagate character sheet changes to all session participants.
- The distinction between PC and NPC is clearly defined in the database schema.
