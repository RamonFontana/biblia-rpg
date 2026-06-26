# Feature Specification: Nível de Item com Bônus de CA em Tempo Real

**Feature Branch**: `037-item-level-ac-realtime`

**Created**: 2026-06-25

**Status**: Draft

**Input**: User description: "hoje existe os items (armas e armaduras) e como equipar as armaduras no corpo ou cabeça. Quero que cada item tenha um nivel que aumente a CA do personagem, e ao equipar, a alteração reflita em real time para todos os jogadores verem."

## Clarifications
### Session 2026-06-25
- Q: Bônus de nível de armadura e escudo se acumulam? → A: Sim, cada item equipado contribui seu próprio bônus de nível independentemente. Armadura nível 3 (+2) + Escudo nível 3 (+2) = +4 CA extra de nível.
- Q: O que acontece com o nível do item quando vendido/trocado? → A: O item preserva seu nível. O sistema deve copiar o nível da instância original para a nova instância no inventário do recebedor (o que pode exigir suporte a nível na tabela `trade_items`).
- Q: Quem pode alterar o nível do item? → A: Apenas o mestre. Os jogadores podem ver o nível, mas não possuem permissão na interface para alterá-lo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar Nível do Item e Bônus de CA Correspondente (Priority: P1)

Como jogador ou mestre, quero ver o nível de cada item no meu inventário e quanto de CA extra aquele nível confere, para entender rapidamente o poder defensivo do meu equipamento.

**Why this priority**: Sem a visibilidade do nível e do bônus derivado, o jogador não tem como avaliar se um item é melhor que outro e não compreende o impacto do equipamento na sua defesa.

**Independent Test**: Pode ser testado abrindo o inventário de um personagem e verificando que cada armadura/escudo exibe seu nível atual (ex: "Nível 3") e o bônus de CA correspondente (ex: "+3 CA").

**Acceptance Scenarios**:

1. **Given** um personagem com uma Cota de Escamas de Bronze de nível 1, **When** ele visualiza o inventário, **Then** o item exibe "Nível 1" e o bônus de CA base da armadura (CA 14 + modificadores).
2. **Given** uma Cota de Escamas de nível 3, **When** visualizada no inventário, **Then** o item exibe "Nível 3" e o bônus total de CA reflete o acréscimo pelo nível (+2 CA extra em relação ao nível 1).
3. **Given** um item que não é armadura nem escudo (ex: Tocha), **When** visualizado no inventário, **Then** nenhum indicador de nível ou bônus de CA é exibido.

---

### User Story 2 - CA do Personagem Atualiza ao Equipar Item com Nível (Priority: P1)

Como jogador, ao equipar ou desequipar uma armadura de determinado nível, quero que minha Classe de Armadura (CA) seja recalculada imediatamente com o bônus do nível incluído.

**Why this priority**: A atualização imediata é essencial para que as rolagens de ataque inimigo e decisões táticas do mestre sejam baseadas no valor de CA correto.

**Independent Test**: Pode ser testado equipando uma armadura de nível 1, verificando a CA, depois equipando a mesma armadura de nível 5 e confirmando que a CA aumentou proporcionalmente.

**Acceptance Scenarios**:

1. **Given** um personagem com CA base 10 (sem armadura), **When** ele equipa um Couro Cru (CA base 11 + Des) de nível 1, **Then** a CA do personagem passa a 11 + modificador de Destreza.
2. **Given** o mesmo personagem, **When** ele equipa um Couro Cru de nível 5, **Then** a CA exibida é 11 + modificador de Destreza + bônus pelo nível 5 (ex: +4 CA extra).
3. **Given** um personagem com armadura de nível 3 equipada, **When** ele desequipa a armadura, **Then** a CA volta ao valor base (10 + modificador de Destreza) sem nenhum bônus residual.

---

### User Story 3 - Todos os Jogadores Veem a Mudança de CA em Tempo Real (Priority: P1)

Como mestre, quando um jogador equipa ou desequipa uma armadura durante a sessão, quero que a alteração de CA seja visível imediatamente na ficha dele para todos os participantes da sessão, sem necessidade de recarregar a página.

**Why this priority**: No cenário de sessão ao vivo, o mestre e os demais jogadores dependem de ver o CA atualizado para calcular ataques, planejar estratégias e manter a fluidez do jogo.

**Independent Test**: Pode ser testado em dois navegadores/dispositivos: um jogador equipa uma armadura, e no outro dispositivo (visão do mestre ou de outro jogador) a CA atualizada aparece sem refresh.

**Acceptance Scenarios**:

1. **Given** uma sessão ativa com mestre e 2 jogadores conectados, **When** o Jogador A equipa uma Cota de Malha nível 2, **Then** o mestre e o Jogador B veem a CA do Jogador A atualizar em no máximo 3 segundos.
2. **Given** uma sessão ativa, **When** o Jogador A desequipa sua armadura, **Then** a redução de CA é refletida em tempo real na tela de todos os participantes.
3. **Given** a visão do mestre mostrando a lista de personagens, **When** qualquer jogador altera seu equipamento, **Then** o card do jogador na lista do mestre exibe a CA atualizada automaticamente.

---

### User Story 4 - Definir/Alterar Nível do Item (Priority: P2)

Como mestre, quero poder definir ou alterar o nível de um item no inventário de um personagem, para refletir melhorias obtidas durante a narrativa (ex: um ferreiro fortaleceu a armadura).

**Why this priority**: Sem a capacidade de alterar o nível, o sistema fica estático e não acompanha a progressão da narrativa do jogo.

**Independent Test**: Pode ser testado pelo mestre acessando o inventário de um personagem, selecionando um item, alterando seu nível, e verificando que o bônus de CA reflete a mudança.

**Acceptance Scenarios**:

1. **Given** o mestre visualizando o inventário de um personagem na sessão, **When** ele seleciona uma armadura e altera seu nível de 1 para 4, **Then** o nível é salvo e o bônus de CA do item é recalculado imediatamente.
2. **Given** um item de nível 5 (nível máximo), **When** o mestre tenta aumentar para nível 6, **Then** o sistema impede a alteração e exibe um aviso de nível máximo atingido.

---

### Edge Cases

- ~~O que acontece quando um item é vendido/trocado e possui nível alto?~~ **Resolvido**: O item preserva seu nível ao ser transferido.
- ~~Como o sistema lida com escudos que têm nível?~~ **Resolvido**: O bônus de nível do escudo se acumula com o bônus da armadura. Cada peça contribui independentemente.
- O que acontece se dois jogadores tentarem alterar o nível de um mesmo item simultaneamente?
- Como o nível interage com a propriedade Versátil (duas mãos vs uma mão)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada item no inventário do personagem MUST possuir um atributo `level` (nível) com valor padrão 1 e máximo 5.
- **FR-002**: O bônus de CA derivado do nível MUST seguir uma fórmula progressiva: cada nível acima de 1 concede +1 CA adicional (nível 1 = +0, nível 2 = +1, nível 3 = +2, nível 4 = +3, nível 5 = +4).
- **FR-003**: O cálculo de CA total do personagem MUST considerar o nível de cada item equipado de forma acumulativa: CA = (CA base da armadura + modificador de Destreza aplicável) + bônus de nível da armadura + (bônus base do escudo + bônus de nível do escudo). Cada peça de equipamento contribui seu próprio bônus de nível independentemente.
- **FR-004**: A interface de inventário MUST exibir o nível do item e o bônus de CA correspondente para itens do tipo Armadura e Escudo.
- **FR-005**: Ao equipar ou desequipar um item, o sistema MUST recalcular e persistir a CA atualizada no banco de dados.
- **FR-006**: A atualização de CA ao equipar/desequipar MUST ser propagada em tempo real (via canal realtime do Supabase) para todas as telas de todos os participantes da sessão.
- **FR-007**: Apenas o mestre MUST poder alterar o nível de qualquer item no inventário de qualquer personagem da sessão. Jogadores NÃO podem editar o nível de seus itens.
- **FR-008**: O nível do item MUST ser persistido no registro `character_items` e MUST acompanhar o item em transações de compra/venda/troca. O sistema de troca (`trade_items` e `trades`) MUST ser adaptado para preservar o nível do item durante a transferência entre personagens/loja.
- **FR-009**: Armas MUST também suportar o atributo `level`, mas o bônus do nível para armas NÃO afeta a CA — é reservado para futuras mecânicas (ex: bônus de ataque/dano).
- **FR-010**: O componente `EquipmentSlots` MUST exibir o nível do item ao lado do nome para itens equipados.

### Key Entities

- **Item Level (Nível do Item)**: Atributo numérico (1-5) associado a cada instância de item no inventário (`character_items`), representando o grau de qualidade/reforço do item.
- **CA Bonus by Level (Bônus de CA por Nível)**: Fórmula derivada do nível que incrementa o valor de CA base da armadura/escudo (+0 no nível 1, +1 no nível 2, até +4 no nível 5).
- **CharacterEquipment (Equipamento do Personagem)**: Estrutura existente que mapeia slots (Cabeça, Corpo, Mão Principal, Mão Secundária) para IDs de itens equipados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos itens do tipo Armadura e Escudo exibem seu nível e o bônus de CA correspondente na interface de inventário.
- **SC-002**: A CA do personagem recalcula corretamente em 100% dos cenários de equipar/desequipar itens de qualquer nível.
- **SC-003**: A alteração de CA é visível para todos os participantes da sessão em no máximo 3 segundos após o equipamento ser alterado.
- **SC-004**: O mestre consegue alterar o nível de qualquer item em no máximo 2 interações (clique + seleção de nível).
- **SC-005**: Nenhuma perda de nível ocorre durante transações de compra/venda/troca de itens.

## Assumptions

- O sistema já possui canal de realtime via Supabase para updates de personagens na sessão (`session_players_realtime`).
- A tabela `character_items` no Supabase pode ser estendida com uma coluna `level` sem impacto em dados existentes (padrão = 1).
- A fórmula de CA base do sistema (regras-base.md) suporta adição de bônus dinâmicos.
- A função `getCombatStats()` em `equipmentUtils.ts` já calcula bônus de CA dos equipamentos e pode ser estendida para considerar nível.
- Não haverá itens com nível acima de 5 no escopo desta feature. O nível mínimo é 1 (item normal, sem bônus extra).
