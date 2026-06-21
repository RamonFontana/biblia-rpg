# Feature Specification: Mostrar Dano de Armas no Inventário

**Feature Branch**: `034-mostrar-dano-armas`

**Created**: 2026-06-21

**Status**: Draft

**Input**: User description: "as armas nas regras base do jogo tem o dado que deve ser rolado para o dano da arma. Mas na sessão, no inventario dos personagens, não mostra o dado que deve ser o dado, corrija isso"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar Dado de Dano no Inventário (Priority: P1)

Como jogador ou mestre da sessão
Quero ver qual dado devo rolar para o dano de cada arma no inventário do personagem
Para não precisar consultar as regras básicas toda vez que um ataque for realizado durante a partida

**Why this priority**: É essencial para a fluidez do combate. A falta dessa informação atrasa o jogo, forçando os usuários a realizarem consultas externas às regras base constantemente.

**Independent Test**: Pode ser testado acessando o inventário de um personagem (ou NPC) na tela da sessão ativa, verificando se a informação do dano (ex: 1d6, 1d8) aparece visualmente clara junto à descrição do item.

**Acceptance Scenarios**:

1. **Given** um personagem na sessão com uma arma equipada ou no inventário, **When** o usuário visualiza a lista de itens, **Then** o dado de dano correspondente da arma deve estar visível no card ou linha do item.
2. **Given** um item no inventário que não é uma arma (ex: escudo, armadura, consumível), **When** o usuário visualiza a lista de itens, **Then** nenhuma informação de dano de ataque deve ser exibida para este item.

### Edge Cases

- O que acontece se o item tiver características especiais de dano (ex: dano extra condicional)? Como isso será exibido junto ao dado base?
- Se uma arma possui o dado de dano em falta no banco de dados, o que é exibido para o usuário? (fallback).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST obter a informação do dado de dano de itens do tipo arma a partir da definição do item ou das regras base do jogo.
- **FR-002**: A interface de inventário na tela de sessão ativa (tanto para jogadores quanto para o mestre visualizando NPCs/Personagens) MUST exibir o dado de dano associado a cada arma listada.
- **FR-003**: A interface MUST ocultar o campo ou indicador de "dado de dano" para itens que não causam dano ofensivo principal (armaduras, poções, recursos).

### Key Entities

- **Item (Arma)**: A entidade de item precisa expor ou ter associado o seu atributo de `dano` (ex: string "1d6", "1d8") para que a interface de usuário possa renderizá-lo.
- **Inventário do Personagem/NPC**: A lista de itens possuídos pelo personagem durante a sessão.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Jogadores e mestres conseguem identificar o dado de dano de qualquer arma no inventário instantaneamente na tela da sessão, com 0 cliques adicionais necessários para buscar a informação.
- **SC-002**: 100% das armas padrão do jogo exibem corretamente seu dado de dano correspondente.

## Assumptions

- O modelo de dados dos itens ou regras já possui as informações de dano para cada tipo de arma registradas, restando apenas mapear e exibir esse dado na interface gráfica da sessão.
- O espaço na interface (layout dos cards/listas de inventário) é suficiente para adicionar a notação do dado (ex: "⚔️ 1d6") sem quebrar a responsividade, especialmente em dispositivos móveis.
