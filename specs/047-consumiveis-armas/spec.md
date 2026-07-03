# Feature Specification: Mecânica de Munição e Consumíveis

**Feature Branch**: `047-consumiveis-armas`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "precisa adicionar uma mecanica melhor para items que são consumiveis em armas, como flecha e pedra para funda. No caso o item de flecha é um kit de 20 flechas, o problema é que a cada ataque o personagem fizer ele vai gastar uma flecha por exemplo, e talvez ele consiga recuperar essa flecha, preciso pensar uma mecanica que se integre ao sistema sem quebrar a ideia do sistema que é só um axiliador."

## Clarifications

### Session 2026-07-03
- Q: Qual será a mecânica exata para testar se a flecha recuperada quebrou? → A: Teste automático pelo sistema (ex: 50% de chance de recuperar cada flecha gasta) ao clicar no botão "Recuperar", sem exigir rolagens manuais.
- Diferenciação de Munições: Flechas possuem a mecânica de recuperação baseada em chance; pedras para funda não possuem, mas o mestre ganha uma opção facilitada para adicionar/repor munições.
- Uso Livre: A munição deve poder ser gasta pelo jogador a qualquer momento, funcionando como um item consumível na interface.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gastar munição ao atacar (Priority: P1)

Como jogador, quero que ao realizar um ataque com arma de longa distância, o sistema me permita descontar a munição gasta de forma rápida e simples, a qualquer momento.

**Why this priority**: É o cerne da mecânica, permitindo que a munição seja gasta aos poucos (unidade por unidade) em vez de itens inteiros (ex. kits ou aljavas).

**Independent Test**: Pode ser testado de forma independente criando um pacote de munição no inventário do personagem e confirmando que deduz 1 unidade ao atacar, sem excluir o pacote inteiro até que ele chegue a 0.

**Acceptance Scenarios**:

1. **Given** que um personagem tem um "Kit de Flechas (20/20)", **When** ele utiliza uma ação para consumir a munição (botão de uso rápido como num consumível normal), **Then** a munição diminui para 19/20.
2. **Given** um kit de flechas com apenas 1 carga (1/20), **When** a última carga é consumida, **Then** o marcador vai a 0/20 e o jogador é devidamente notificado ou o item é visualmente sinalizado como vazio.

---

### User Story 2 - Recuperar munição após combate (Priority: P2)

Como jogador, quero poder tentar recuperar parte das minhas flechas disparadas após o combate, sabendo que algumas podem ter quebrado, sem precisar fazer contas complexas.

**Why this priority**: Complementa a economia de gastos, garantindo que o jogador possa repor seu inventário sem microgerenciamento de ter que recriar o item do zero.

**Independent Test**: Pode ser testado clicando em "Recuperar" em um item de flecha parcialmente gasto e vendo as cargas aumentarem automaticamente baseadas no teste de chance.

**Acceptance Scenarios**:

1. **Given** um kit de flechas com 15/20 cargas, **When** o jogador clica no botão "Recuperar", **Then** o sistema roda um teste automático para as 5 flechas gastas (ex. 50% de chance cada) e soma as flechas intactas de volta ao total (limitado a 20/20).

---

### User Story 3 - Mestre repondo munições simples (Priority: P3)

Como Mestre, quero poder adicionar pedras de funda ao inventário do jogador rapidamente.

**Why this priority**: Pedras de funda são munições simples que os jogadores frequentemente coletam do chão ou compram, não dependendo da mecânica de chance de recuperação das flechas.

**Acceptance Scenarios**:

1. **Given** que o personagem possui um saco de pedras para funda no inventário, **When** o Mestre clica para adicionar munições àquele item específico, **Then** as cargas do item aumentam pela quantidade inserida pelo Mestre.

### Edge Cases

- O que acontece quando o jogador tenta consumir uma munição de um kit que já está vazio (0/20)? (Deve impedir ou alertar sobre falta de munição).
- Como o sistema lida se o personagem adquirir flechas soltas ou agrupar diferentes kits parciais? (Pode ser tratado permitindo ajuste manual da quantidade atual ou criando outro item idêntico).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que itens possuam uma estrutura de "cargas" ou "usos" associada a um limite máximo (ex: 20 usos num kit).
- **FR-002**: O sistema MUST exibir de forma clara a quantidade de munição/cargas restantes do item, tanto na lista do inventário quanto na tela de combate/ataque.
- **FR-003**: O sistema MUST prover uma ação rápida e direta (1 clique) para deduzir ("gastar") uma carga do item a qualquer momento, exatamente como um consumível.
- **FR-004**: O sistema MUST prover uma ação facilitada para "Recuperar" cargas de flechas (ou itens marcados como recuperáveis), rodando um teste automático de chance (ex: 50%) para cada flecha que falta até o limite máximo e somando o resultado ao total.
- **FR-005**: O Mestre MUST ter a capacidade de repor ou aumentar livremente a quantidade de cargas de itens de munição dos jogadores de forma rápida.
- **FR-006**: O sistema MUST sinalizar visualmente quando as cargas de um item chegam a zero, não permitindo uso de cargas negativas.

### Key Entities

- **Item Consumível de Carga**: Representa o kit no banco de dados, possuindo atributos como uso atual (`current_charges`) e uso máximo (`max_charges`).
- Pode requerer a distinção na definição do item (`items`) se ele possui a propriedade de recuperação automática de projétil ou se depende só de reposição manual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Jogadores conseguem reduzir a munição de um item com no máximo 1 ou 2 cliques.
- **SC-002**: Jogadores conseguem tentar recuperar a munição perdida em 1 clique (para itens com recuperação).
- **SC-003**: Feedback visual indica de forma instantânea quando um kit é exaurido.

## Assumptions

- O sistema continuará atuando como "auxiliador", dependendo da ação voluntária do jogador (ou de um simples clique de confirmação) para deduzir a munição; ele não gastará itens magicamente contra a vontade do jogador.
- Munições recuperadas não excedem o limite estabelecido para o item na ficha do jogador, dispensando regras complexas de transbordo (overflow) num primeiro momento.
