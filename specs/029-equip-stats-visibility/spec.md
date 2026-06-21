# Feature Specification: Equip Stats Visibility

**Feature Branch**: `[029-equip-stats-visibility]`

**Created**: 2026-06-19

**Status**: Draft

**Input**: User description: "Show AC increase on armor in session GM/player view, increase character/enemy/NPC AC on equip, and show damage die for weapons in inventory. Also fix any underlying issues that prevented this in the past."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Exibir Aumento de CA e Dado de Dano na Listagem de Itens (Priority: P1)

Como jogador ou mestre, eu quero ver o quanto de Classe de Armadura (CA) um item de defesa concede e qual o dado de dano uma arma causa diretamente na listagem de inventário/armadura.

**Why this priority**: A falta dessas informações prejudica a clareza do combate e obriga o jogador/mestre a procurar as informações nos documentos.

**Independent Test**: Abrir a listagem de equipamentos (inventário) e verificar se o valor numérico de CA extra é exibido nas armaduras e o dado (ex: 1d6) nas armas.

**Acceptance Scenarios**:

1. **Given** um personagem com uma Cota de Escamas no inventário, **When** ele abre a aba de equipamentos, **Then** o item mostra explicitamente que fornece +14 CA (ou CA base 14).
2. **Given** um personagem com uma Espada Curta no inventário, **When** visualiza as armas, **Then** a interface mostra o dano "1d6 cortante" associado a ela.

---

### User Story 2 - Atualizar CA Dinamicamente ao Equipar (Priority: P1)

Como mestre ou jogador, ao equipar ou desequipar uma armadura/escudo, eu quero que a CA do meu personagem, inimigo ou NPC jogável seja recalculada e atualizada na hora.

**Why this priority**: É o cerne da automação do combate. O sistema de combate fica defasado se a defesa não é aplicada nas rolagens de ataque inimigas.

**Independent Test**: Equipar uma armadura e verificar se o atributo principal de CA aumenta, e ao remover a armadura o CA volta ao base.

**Acceptance Scenarios**:

1. **Given** um personagem com CA base 10 e destreza +2, **When** ele equipa uma Armadura Leve que concede CA base 12, **Then** a CA total do personagem é atualizada imediatamente para 14.
2. **Given** um mestre controlando um Inimigo no combate, **When** o mestre equipa um item de defesa no Inimigo, **Then** a CA do inimigo reflete essa defesa no painel do mestre.
3. **Given** um NPC jogável no grupo, **When** uma armadura é equipada nele, **Then** a sua CA é atualizada em tempo real para todos os jogadores.

### Edge Cases

- O que acontece com a destreza máxima permitida por armaduras pesadas/médias? (O bônus de destreza deve ser limitado de acordo com a regra de armadura se existir).
- O que acontece com bônus de escudo acumulados? Apenas um escudo deve dar bônus de CA.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST extrair as propriedades de CA e dado de dano do item e exibi-las na listagem de inventário e equipamentos do usuário.
- **FR-002**: A interface da sessão (visão Mestre e Jogador) MUST exibir o valor de aumento de CA ao lado de equipamentos de defesa.
- **FR-003**: A listagem de inventário de armas MUST exibir o dado de rolagem de dano.
- **FR-004**: O sistema MUST recalcular a Classe de Armadura (CA) de Personagens, Inimigos e NPCs sempre que um equipamento defensivo for equipado ou desequipado.
- **FR-005**: O sistema MUST garantir a atualização persistente e reativa no banco de dados e UI quando uma armadura é equipada (investigar e corrigir falha anterior que não completava a atualização).

### Key Entities

- **Character/Enemy/NPC**: Entidades que possuem cálculo de CA derivado.
- **Inventory/EquippedItem**: Representação dos itens que alteram os valores de combate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O valor de CA e Dano está visível em 100% dos itens do tipo Arma e Armadura listados na interface.
- **SC-002**: A alteração do CA ao equipar/desequipar é instantaneamente visível na interface do Mestre e do Jogador para a entidade correspondente (Jogador, NPC ou Inimigo).
- **SC-003**: Nenhuma inconsistência ocorre na atualização do CA ao equipar/desequipar múltiplas vezes.

## Assumptions

- A fórmula básica de CA já está definida nas regras base e suporta adição dinâmica por equipamentos.
- O catálogo de itens possui ou suporta a inserção das propriedades `damage_dice` e `armor_bonus`.
