# Feature Specification: Character Sheet Items and Actions

**Feature Branch**: `015-session-character-sheet`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "agora vamos ajustar a parte na visão de jogador, que quando clicar em si mesmo ou não deve acontecer nada pq já da pra ver a ficha do personagem na lateral ou deve mostrar os itens e ações que pode ser tomadas (vamos inserir as ações aos poucos) Melhore a ficha de usuário, quero ver cada item que o usuário tem, e separar por categorias e se o jogador comprou um kit, na ficha dele não pode mostrar o kit, e sim os items que tem no kit, não importa se é um kit no momento do jogo. Isso em ambas visões (mestre e jogador) Vamos criar na visão do jogador a utilização de item consumiveis, apartir do momento que o usuário usar um item, deve ser descartado."

## Clarifications

### Session 2026-06-16
- Q: O uso de um item consumível sempre se aplica ao próprio usuário instantaneamente, ou ele pode ter como alvo outro jogador/NPC? → A: Depende do item (Requer uma propriedade 'requires_target' no banco de dados para itens como poções que podem ser dadas a aliados).
- Q: Uma vez que um kit é expandido em itens individuais no inventário, esses itens devem reter um indicador visual de que vieram de um kit específico? → A: Não, eles se tornam itens padrões na lista (Mais simples e limpo na interface).
- Q: Quando o jogador abre o menu de contexto clicando em seu token, como ele deve ser fechado? → A: Ambas as opções A e B (Clicando fora do menu, pressionando Esc, ou clicando no token novamente).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Categorized Item Display with Kit Expansion (Priority: P1)

Como um jogador ou mestre visualizando a ficha de um personagem na sessão, eu quero ver todos os itens separados por categorias (Armas, Armaduras, Consumíveis, etc.) e ver os itens individuais de qualquer kit adquirido (ao invés do nome do kit), para que eu tenha uma visão clara e detalhada de tudo que o personagem possui.

**Why this priority**: A clareza no inventário é fundamental para a tomada de decisão no RPG, e os kits representam um agrupamento de itens que no jogo devem ser tratados individualmente.

**Independent Test**: Pode ser testado adicionando um "Kit de Sobrevivência" a um personagem e verificando se a ficha exibe itens como "Corda", "Cantil", "Pederneira" agrupados em suas respectivas categorias ao invés de apenas "Kit de Sobrevivência".

**Acceptance Scenarios**:

1. **Given** que o personagem possui um "Kit de Ferramentas" (contendo Martelo e Pregos) e uma "Espada Longa", **When** a ficha é aberta (visão mestre ou jogador), **Then** a interface exibe "Espada Longa" na categoria Armas e "Martelo" e "Pregos" na categoria Ferramentas/Diversos, sem listar o item genérico "Kit de Ferramentas".
2. **Given** um inventário com itens de múltiplas categorias, **When** a ficha é renderizada, **Then** os itens são agrupados sob cabeçalhos categóricos visíveis.

---

### User Story 2 - Player Token Interaction for Actions and Items (Priority: P2)

Como um jogador em uma sessão ativa, eu quero que ao clicar no meu próprio token (ou representação no grid/mapa), seja exibido um menu ou painel de contexto com os itens que possuo e ações que posso tomar, para que eu possa agir rapidamente no turno.

**Why this priority**: Melhora muito a experiência do usuário (UX) em combate/exploração, trazendo atalhos para interações frequentes em vez de exigir navegação pela ficha completa na lateral.

**Independent Test**: Pode ser testado clicando no próprio token do jogador em uma cena de teste e confirmando que um popup/modal aparece listando itens utilizáveis e botões de ação.

**Acceptance Scenarios**:

1. **Given** que sou o jogador dono do personagem e estou na visão de sessão, **When** clico no meu token, **Then** um painel se abre mostrando minhas ações disponíveis e meus itens.

---

### User Story 3 - Consumable Item Utilization (Priority: P3)

Como um jogador, eu quero poder utilizar um item consumível através da interface e ter este item automaticamente removido do meu inventário após o uso, para refletir o consumo no jogo sem precisar de gestão manual (minha ou do mestre).

**Why this priority**: Mecânica essencial para o fluxo dinâmico de combate e aventura, reduzindo a carga cognitiva de atualizar inventários manualmente.

**Independent Test**: Pode ser testado clicando em "Usar" numa "Poção de Cura". O item deve desaparecer do inventário imediatamente após a confirmação do uso.

**Acceptance Scenarios**:

1. **Given** que eu tenho uma "Ração de Viagem" (consumível), **When** eu clico em "Usar" no painel de itens ou na ficha, **Then** o sistema processa a ação e o item "Ração de Viagem" é decrementado ou removido do meu inventário.
2. **Given** que o item consumível foi utilizado, **When** o mestre olha a ficha do meu personagem, **Then** o mestre também vê que o item não está mais lá.

---

### Edge Cases

- O que acontece se o jogador tentar usar um item consumível, mas ocorrer uma falha de conexão de rede ou erro no servidor? (O item não deve ser descontado até a confirmação do servidor).
- Como o sistema lida com a exibição de um kit caso a definição do kit seja alterada globalmente após a compra? (Os itens do kit devem ser expandidos no momento da aquisição, preservando o que o jogador efetivamente ganhou).
- Como o menu de contexto é fechado para evitar que atrapalhe a visão? (Pode ser fechado clicando novamente no token, clicando fora do menu, ou pressionando a tecla Esc).
- O que acontece se o jogador usar um item que exige um alvo? (O menu deve entrar em um estado de "seleção de alvo" e aguardar o clique em outro token válido).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exibir o inventário de personagens (tanto na visão do Mestre quanto do Jogador) agrupando itens por categoria (ex: Armas, Armaduras, Consumíveis, Ferramentas).
- **FR-002**: O sistema MUST, no momento de aquisição de um Kit, extrair seus itens subjacentes e adicioná-los individualmente ao inventário do personagem, ou então, ao renderizar a ficha, "achatar" os kits em seus itens constituintes.
- **FR-003**: O sistema MUST garantir que o nome ou entidade do "Kit" genérico não seja exibido na listagem de inventário da ficha em andamento.
- **FR-004**: O sistema MUST fornecer uma interface contextual (ex: popup ou painel) quando um jogador clica em seu próprio token/personagem na área de jogo, listando itens e ações rápidas.
- **FR-005**: O sistema MUST permitir que o jogador inicie a ação de "Usar" em um item classificado como consumível.
- **FR-006**: O sistema MUST decrementar a quantidade (ou remover o registro se a quantidade chegar a zero) do item consumível do banco de dados imediatamente após sua utilização bem-sucedida.
- **FR-007**: O sistema MUST atualizar a interface em tempo real para todos (jogador e mestre) após o consumo de um item.

### Key Entities *(include if feature involves data)*

- **CharacterItem / InventoryItem**: Registro que associa um personagem a um item, contendo a quantidade atual. Uma vez adicionados (mesmo vindos de um kit), são registros padrões sem ligação forçada ao kit de origem.
- **Item**: Definição base do item, que deve incluir um campo de Categoria, indicador booleano se é "Consumível", e um indicador booleano `requires_target` (para itens que podem ser aplicados em terceiros).
- **Kit**: Uma definição especial de item que serve como contêiner para uma lista de Itens base.
- **Session / Scene**: O contexto onde a representação visual (token) do personagem pode ser clicada para exibir ações.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O inventário de um personagem contendo 15 itens mistos (incluindo 1 kit de 5 itens) é renderizado em tela em menos de 500ms, corretamente categorizado e com o kit desmembrado.
- **SC-002**: O clique no token do jogador abre o menu contextual de ações em menos de 200ms.
- **SC-003**: A utilização de um item consumível reflete a deleção/remoção na tela do jogador e do mestre em menos de 1 segundo (tempo de sync).
- **SC-004**: Jogadores não relatam confusão ou erros sobre itens faltando que estavam "escondidos" dentro de nomes de Kits genéricos.

## Assumptions

- Kits são desmembrados em itens individuais no momento da compra/obtenção, armazenando os itens finais no inventário do banco de dados, em vez de processar o desmembramento dinamicamente toda vez que a ficha é carregada.
- O sistema já possui um mecanismo de categorização na modelagem de itens (ex: tipo de item = "arma", "armadura", "consumivel").
- As "ações" listadas ao clicar no token serão populadas gradualmente (conforme a descrição da feature "vamos inserir as ações aos poucos"), portanto a interface deve ser extensível para receber novos botões no futuro.
- A exclusão do item após o uso é automática e o "efeito" do item (como recuperar HP) pode ainda não ser automatizado em regras do sistema neste momento, limitando-se à remoção mecânica do inventário.
