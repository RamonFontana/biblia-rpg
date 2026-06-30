# Feature Specification: Armor Resistance Mechanic

**Feature Branch**: `[043-armor-resistance]`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "quero adicionar essas armaduras com essa mecanica, me ajude a planejar certinho pq quero adicionar tbm armaduras do tipo leve do tipo pesado, com a utilização requirida por vocação: tipo, armadura pessada, só guerreiro pode usar, e tunicas só sacerdote. Quero criar uma boa variação e quantidade de armaduras"

## Clarifications

### Session 2026-06-30
- Q: O que acontece se o jogador equipar dois itens que oferecem resistência à MESMA condição (ex: Armadura e Escudo)? → A: Option A - Utiliza o maior nível (Não acumula).
- Q: Quando a armadura resiste/mitiga uma condição no combate, como o sistema avisa? → A: Option A - Exibe uma notificação/toast temporária na tela alertando sobre a resistência.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Equip Vocation-Restricted Armor (Priority: P1)

Como um jogador, quero apenas conseguir equipar armaduras permitidas pela minha vocação (ex: Guerreiro equipa Armadura Pesada, Sacerdote equipa Túnica Sagrada), para garantir a fidelidade às regras do cenário e o balanceamento.

**Why this priority**: É essencial para garantir as restrições da regra do jogo. Se qualquer um equipar armadura pesada, o balanceamento falha.

**Independent Test**: Can be fully tested by creating a Priest character and attempting to buy/equip a Heavy Armor. The system should block it or show it as incompatible.

**Acceptance Scenarios**:

1. **Given** a character with "Sacerdote" vocation, **When** they try to equip "Lorica de Escamas Pesada", **Then** the system prevents the action and displays an error message.
2. **Given** a character with "Guerreiro" vocation, **When** they try to equip "Lorica de Escamas Pesada", **Then** the system allows it and updates their CA.

---

### User Story 2 - Automated Armor Resistance in Combat (Priority: P1)

Como Mestre, quando aplico uma condição (ex: sangrando) a um jogador em combate, o sistema deve checar automaticamente se a armadura que ele está vestindo confere proteção a essa condição, prevenindo ou mitigando o efeito.

**Why this priority**: Automatiza o principal objetivo da feature solicitada e evita que o Mestre tenha que lembrar das propriedades de todas as armaduras de cabeça.

**Independent Test**: Can be fully tested by starting a combat, having a player equip an armor that resists bleeding, and having the GM apply the bleeding condition to them.

### Edge Cases

- **Múltiplas Resistências**: Se o personagem vestir mais de um item que confere resistência à mesma condição, os níveis **não se acumulam**. O motor de combate utiliza sempre o **maior nível** de resistência disponível entre os itens equipados.
- What happens when [boundary condition]?
- How does system handle [error scenario]?

**Acceptance Scenarios**:

1. **Given** a player equipped with armor that has resistance to 'sangrando', **When** the GM applies 'sangrando' via an ability, **Then** the condition is prevented/resisted automatically according to the rules.
2. **Given** a player with no resistance armor, **When** the GM applies 'sangrando', **Then** the condition is applied normally.

---

### User Story 3 - View Armor Properties (Priority: P2)

Como jogador, quero ver quais condições a minha armadura resiste e qual vocação ela exige na descrição do item, para poder fazer escolhas táticas.

**Why this priority**: Importante para a usabilidade e tomada de decisão do jogador, mas secundário à aplicação mecânica em si.

**Independent Test**: Can be tested by viewing an item card in the shop or inventory and seeing the new properties displayed visually.

**Acceptance Scenarios**:

1. **Given** I am in the character creation shop, **When** I look at an armor, **Then** I see badges indicating "Restrito: Guerreiro" e "Resiste a: Sangramento".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE suportar a propriedade `conditionResistances` (um mapeamento de ID da condição para o Nível de Resistência, ex: `{ 'envenenado': 2 }`) e `requiredVocation` (array de nomes de vocações) na definição dos itens (ShopItem e EquipmentItem).
- **FR-002**: O sistema DEVE adicionar uma boa variedade de novas armaduras (leves e pesadas) no banco de dados, configuradas com as novas propriedades de resistência e restrição de classe.
- **FR-003**: O motor de combate (`combatEngine.ts`) DEVE checar o equipamento atual do alvo antes de aplicar qualquer condição vinda de uma habilidade.
- **FR-004**: Ao detectar uma resistência à condição que está sendo aplicada, o motor de combate DEVE aplicar o efeito baseado no nível da resistência da armadura:
  - **Nível 1**: Concede apenas Vantagem em futuros testes de resistência contra o efeito (quando implementados; por enquanto atua de forma mitigada narrativamente).
  - **Nível 2**: Duração da condição é reduzida pela metade (arredondado para baixo, mínimo 1 rodada).
  - **Nível 3**: Vantagem no teste de resistência e Duração reduzida pela metade.
  - **Nível 4 ou maior**: Imunidade Total (a condição é prevenida/bloqueada inteiramente).
- **FR-005**: A UI de inventário e loja DEVE impedir visualmente ou via ação o equipamento de itens cuja `requiredVocation` não inclua a vocação do personagem.
- **FR-006**: A UI de componentes de Item (cards) DEVE mostrar de forma clara os ícones/textos de resistências e restrições.
- **FR-007**: Quando uma resistência é ativada no motor de combate (níveis 1 a 4), o sistema DEVE disparar um alerta visual (toast notification) informando o Mestre e o Jogador que a armadura resistiu ou mitigou o efeito.

### Key Entities

- **EquipmentItem/ShopItem**: Expandido para incluir `conditionResistances?: Record<string, number>` e `requiredVocation?: string[]`.
- **CombatEngine**: Modificado para interpretar o equipamento do alvo ao processar `executeAbilityOnTarget`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Novas armaduras estão visíveis e funcionais na criação de personagem e no sistema de itens.
- **SC-002**: Tentativas de equipar armaduras incorretas para a vocação são 100% bloqueadas na interface.
- **SC-003**: No combate, aplicar uma condição contra uma armadura com resistência apropriada falha em ser aplicada (ou atua conforme clarificação).
- **SC-004**: Nenhum erro no console ocorre durante a aplicação automática de habilidades envolvendo armaduras resistivas.

## Assumptions

- O inventário dos jogadores já sincroniza corretamente e o estado do combate tem acesso ao ID da armadura equipada.
- O mestre continua sendo a palavra final e pode adicionar manualmente a condição depois, se houver uma justificativa narrativa, sobrepondo a automação da armadura se desejar.
