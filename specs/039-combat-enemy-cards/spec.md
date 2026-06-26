# Feature Specification: combat-enemy-cards

**Feature Branch**: `039-combat-enemy-cards`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "No combate, na visão do jogador tem que exibir os inimigos e mostrar o card e a ficha do inimigo para consultar ele."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Exibir Inimigos no Combate (Priority: P1)

Como jogador, durante um combate, eu quero visualizar os inimigos presentes na tela para saber contra quem estou lutando e suas condições gerais.

**Why this priority**: É a funcionalidade central para que o jogador tenha ciência dos oponentes na cena do combate.

**Independent Test**: Pode ser testado independentemente iniciando uma cena de combate e verificando se os inimigos são listados na interface do jogador.

**Acceptance Scenarios**:

1. **Given** que o jogador está em um combate ativo, **When** ele olha a interface de combate, **Then** ele vê a lista de inimigos presentes.

---

### User Story 2 - Consultar Card do Inimigo (Priority: P1)

Como jogador, eu quero poder interagir com um inimigo na lista para visualizar o seu "card" (resumo) ou sua ficha completa, para que eu possa tomar decisões táticas.

**Why this priority**: Permite ao jogador conhecer os atributos e capacidades do inimigo para planejar suas ações.

**Independent Test**: Pode ser testado clicando em um inimigo listado na tela e verificando se o componente de card/ficha é exibido com os dados corretos.

**Acceptance Scenarios**:

1. **Given** que a lista de inimigos está visível, **When** o jogador clica em um inimigo, **Then** o card resumido e a opção de ver a ficha completa são exibidos.

---

### Edge Cases

- O que acontece quando o combate possui muitos inimigos? (A interface deve ter scroll ou quebra de linha?)
- O que acontece se o inimigo for derrotado? (Ele some da lista ou muda de estado visualmente?)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir uma lista de inimigos presentes no combate atual na visualização do jogador.
- **FR-002**: O sistema DEVE permitir a interação (clique/toque) com os itens da lista de inimigos.
- **FR-003**: O sistema DEVE exibir um "card" com as informações resumidas do inimigo ao interagir com ele.
- **FR-004**: O sistema DEVE disponibilizar uma forma de visualizar a ficha completa do inimigo a partir do card ou da lista.
- **FR-005**: O sistema DEVE ocultar ou atualizar a visualização se o status do inimigo mudar (ex. derrotado).

### Key Entities *(include if feature involves data)*

- **Inimigo (CombatEntity/Monster)**: Representa os dados do oponente, contendo vida, atributos, retrato/imagem e passivas/habilidades.
- **Cena de Combate (CombatState)**: Mantém o estado atual da lista de inimigos ativos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O jogador consegue visualizar todos os inimigos da cena em menos de 1 segundo após o início do combate.
- **SC-002**: O acesso à ficha/card do inimigo requer no máximo 1 a 2 interações (cliques).
- **SC-003**: A interface se mantém responsiva e sem sobreposição de conteúdo mesmo com até 10 inimigos no combate.

## Assumptions

- Presume-se que já exista um modelo de dados para Inimigos que contenha suas informações (atributos, nome, etc.).
- Presume-se que a interface do jogador no combate já possua um layout base onde a lista de inimigos possa ser injetada.
