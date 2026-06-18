# Feature Specification: Sistema de Negociação e Lojinha

**Feature Branch**: `023-trade-shop-system`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "Quero criar agora a parte de negociar e vender os itens. Vai ter uma lojinha que o mestre pode começar a negociação com qualquer jogador ou um jogador pode pedir negociar a qualquer momento com outro jogador. Na negociação tem que ter uma legenda de quanto cada item vale, e só vai ser feito a transação depois que os 2 lados derem pronto. E na negociação vai poder negociar item e ciclos. Um personagem pode pedir para negociar tbm com um npc, com o mestre controlando a transação. Agora na lojinha só o mestre pode pedir para negociar com os jogadores, e o mestre tem ciclos infinitos e itens infinitos para dar."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Negociação entre Jogadores (Priority: P1)

Como jogador, quero poder solicitar uma troca direta com outro jogador na sessão, montando uma proposta com itens e/ou Shekels de Prata (SP), para que ambos possam revisar e confirmar antes da transação ser efetivada.

**Why this priority**: É a interação mais comum e democrática — qualquer jogador pode iniciar, e estabelece a mecânica central de "proposta → revisão → confirmação mútua" que será reutilizada por todos os outros fluxos.

**Independent Test**: Pode ser testado com dois jogadores em abas distintas, trocando itens entre si dentro de uma sessão ativa.

**Acceptance Scenarios**:

1. **Given** dois jogadores conectados a uma sessão ativa, **When** o Jogador A clica em "Negociar" no card do Jogador B, **Then** o Jogador B recebe uma notificação de "Solicitação de Troca" que ele pode aceitar ou recusar. Somente após o aceite a janela de negociação se abre para ambos os lados, exibindo os inventários e saldos de SP.
2. **Given** uma negociação aberta entre dois jogadores, **When** cada lado seleciona itens e/ou quantia de SP e clica em "Pronto", **Then** a transação só é executada quando **ambos** os lados confirmarem.
3. **Given** uma negociação aberta, **When** um dos lados altera sua oferta depois de ter marcado "Pronto", **Then** o status de "Pronto" é removido de ambos os lados, exigindo nova confirmação.
4. **Given** uma negociação aberta, **When** qualquer um dos lados clica em "Cancelar", **Then** a negociação é encerrada sem transferências.
5. **Given** uma negociação com itens selecionados, **When** a legenda de preços é exibida, **Then** cada item mostra seu valor de referência em SP ao lado do nome.
6. **Given** um jogador sem saldo suficiente de SP para a oferta proposta, **When** ele tenta confirmar "Pronto", **Then** o sistema exibe uma mensagem de saldo insuficiente e impede a confirmação.

---

### User Story 2 — Lojinha do Mestre (Priority: P1)

Como Mestre, quero abrir uma "lojinha" para negociar com qualquer jogador na sessão, oferecendo itens e Shekels a partir de um estoque infinito, para que eu possa simular mercadores, recompensas e eventos narrativos sem restrições.

**Why this priority**: Permite ao Mestre distribuir itens e moedas durante a narrativa, o que é fundamental para a progressão do jogo. É tão essencial quanto a troca entre jogadores.

**Independent Test**: Pode ser testado pelo Mestre selecionando um jogador e criando uma negociação onde o Mestre oferece itens do catálogo global sem limitação de estoque.

**Acceptance Scenarios**:

1. **Given** o Mestre conectado a uma sessão ativa, **When** ele clica em "Lojinha" no card de um jogador, **Then** a janela de negociação é aberta diretamente para ambos os lados (sem necessidade de aceite do jogador), onde o lado do Mestre tem acesso a todo o catálogo de itens do sistema e SP ilimitados.
2. **Given** uma negociação de lojinha aberta, **When** o Mestre seleciona itens e SP para dar ao jogador, **Then** o jogador vê o que está sendo oferecido em tempo real e pode colocar itens/SP do seu inventário como pagamento.
3. **Given** ambos os lados com "Pronto" confirmado, **When** a transação é executada, **Then** os itens escolhidos pelo Mestre são criados no inventário do jogador e os itens/SP do jogador são removidos do seu inventário.
4. **Given** a lojinha aberta, **When** o Mestre oferece um item, **Then** o preço de referência em SP do item é exibido ao lado do nome como legenda informativa (não obrigatória para a transação).
5. **Given** que somente o Mestre pode iniciar a lojinha, **When** um jogador tenta abrir a lojinha, **Then** o botão de "Lojinha" não está disponível na interface do jogador.

---

### User Story 3 — Negociação com NPC (Priority: P2)

Como jogador, quero poder pedir para negociar com um NPC visível na sessão, com o Mestre mediando a transação no lado do NPC, para simular compras com mercadores ou trocas com personagens não-jogadores.

**Why this priority**: Complementa a experiência do RPG ao permitir interações comerciais com NPCs. O Mestre já controla o NPC, então a mecânica é similar à lojinha, mas usando o inventário do NPC em vez do estoque infinito.

**Independent Test**: Pode ser testado com um jogador solicitando negociar com um NPC e o Mestre aceitando/controlando a transação pelo lado do NPC.

**Acceptance Scenarios**:

1. **Given** um NPC visível na sessão (is_visible = true), **When** um jogador clica em "Negociar" no card do NPC, **Then** uma notificação é enviada ao Mestre pedindo para assumir o lado do NPC na negociação.
2. **Given** o Mestre aceitou a solicitação de negociação, **When** a janela abre, **Then** o lado do NPC mostra o inventário real do NPC (se for jogável) ou o catálogo completo (se for NPC simples), e o lado do jogador mostra o inventário do jogador.
3. **Given** uma negociação com NPC aberta, **When** ambos os lados (jogador e Mestre/NPC) confirmam "Pronto", **Then** a transação é executada transferindo os itens entre o inventário do jogador e do NPC.
4. **Given** uma solicitação de negociação com NPC pendente, **When** o Mestre ignora ou rejeita, **Then** o jogador recebe uma mensagem de que a negociação foi recusada ou não foi respondida.

---

### User Story 4 — Legenda de Preços dos Itens (Priority: P3)

Como jogador ou Mestre, quero que durante qualquer negociação cada item exiba seu valor de referência em Shekels de Prata (SP), para facilitar a avaliação justa das trocas.

**Why this priority**: É uma funcionalidade de suporte informativo que melhora a experiência de uso, mas não bloqueia nenhuma mecânica (trocas livres não exigem preços exatos).

**Independent Test**: Pode ser testado abrindo qualquer janela de negociação e verificando se todos os itens exibem o preço de referência.

**Acceptance Scenarios**:

1. **Given** uma negociação aberta de qualquer tipo, **When** os itens são listados em qualquer um dos lados, **Then** cada item exibe seu preço de referência em SP ao lado do nome/ícone.
2. **Given** que um item não tenha preço cadastrado no sistema, **When** ele aparece na negociação, **Then** o preço de referência mostra "—" (sem valor definido) em vez de zero.

---

### Edge Cases

- O que acontece quando um jogador está envolvido em duas negociações simultâneas? → Apenas uma negociação ativa por personagem é permitida por vez.
- Como o sistema lida se a sessão for encerrada durante uma negociação? → Negociações pendentes são canceladas automaticamente ao encerrar a sessão.
- O que ocorre se um jogador sai da sessão (desconecta) durante uma negociação? → A negociação é cancelada automaticamente e o outro lado é notificado.
- E se o Mestre tentar negociar com um NPC jogável que não tem inventário? → O sistema utiliza o inventário real do personagem NPC (que usa a tabela `character_items`).
- O que acontece se um jogador tentar enviar mais itens do que possui? → O sistema valida quantidades no momento da confirmação e rejeita se o estoque for insuficiente.
- A negociação expira por inatividade? → Não. A negociação permanece aberta enquanto a sessão estiver ativa. Cancelamento automático só ocorre ao encerrar a sessão ou desconectar.
- O que os outros jogadores veem quando alguém está negociando? → Um indicador visual "Negociando" aparece no card do personagem e qualquer interação com ele é bloqueada até a negociação terminar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que qualquer jogador inicie uma negociação com outro jogador conectado na mesma sessão ativa.
- **FR-002**: O sistema MUST permitir que o Mestre inicie uma negociação de "Lojinha" com qualquer jogador, usando estoque infinito de itens e Shekels.
- **FR-003**: O sistema MUST permitir que um jogador solicite uma negociação com um NPC visível, com o Mestre controlando o lado do NPC.
- **FR-004**: O sistema MUST exibir o preço de referência em Shekels de Prata (SP) de cada item durante a negociação.
- **FR-005**: A transação MUST ser executada somente quando ambos os lados confirmarem "Pronto".
- **FR-006**: O sistema MUST resetar o status de "Pronto" de ambos os lados quando qualquer oferta for alterada após a confirmação.
- **FR-007**: O sistema MUST validar que o jogador possui saldo de SP e quantidade de itens suficientes antes de executar a transação.
- **FR-008**: O sistema MUST permitir a negociação de itens e Shekels de Prata simultaneamente em uma única transação.
- **FR-009**: O sistema MUST limitar cada personagem a uma negociação ativa por vez.
- **FR-010**: O sistema MUST cancelar automaticamente negociações pendentes quando a sessão for encerrada ou um participante desconectar.
- **FR-011**: O sistema MUST atualizar ambos os lados em tempo real durante a montagem da proposta (itens e SP selecionados).
- **FR-012**: Somente o Mestre MUST poder iniciar a Lojinha; jogadores NÃO devem ter acesso a essa funcionalidade.
- **FR-013**: O sistema MUST exigir que o destinatário de uma solicitação de negociação (entre jogadores) aceite explicitamente antes de a janela de negociação ser aberta para ambos os lados.
- **FR-014**: O sistema MUST abrir a janela de negociação da Lojinha diretamente para ambos os lados quando o Mestre iniciar, sem exigir aceite do jogador.
- **FR-015**: O sistema MUST exibir um indicador visual de "Negociando" no card do personagem (ou Mestre) para todos os outros jogadores da sessão enquanto ele estiver em uma negociação ativa.
- **FR-016**: O sistema MUST bloquear qualquer interação com um personagem que esteja em negociação ativa (ex: iniciar nova negociação, solicitar teste, etc.).

### Key Entities

- **Negociação (Trade)**: Representa uma sessão de troca entre dois lados. Contém referência à sessão, aos dois participantes (personagens ou Mestre/NPC), status (pendente, ativa, confirmada, cancelada, concluída) e timestamps. Negociações concluídas são mantidas permanentemente no banco como registro histórico (sem interface de consulta na v1).
- **Oferta (Trade Offer)**: Cada lado de uma negociação tem uma oferta composta por: uma lista de itens (com quantidades) e uma quantia de Shekels de Prata (SP). A oferta também possui um campo de status "pronto" (confirmado pelo lado).
- **Item**: Entidade já existente (`items`) que será estendida com um campo de preço de referência em SP.
- **Inventário do Personagem**: Entidade já existente (`character_items`) que vincula itens a personagens com quantidades.
- **Shekels de Prata (SP)**: Representado por uma coluna dedicada `coins` na tabela `characters` (tipo inteiro). Coluna separada do campo JSON `stats` para permitir operações atômicas de débito/crédito em transações concorrentes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dois jogadores conseguem completar uma troca de itens e SP em menos de 2 minutos, do início ao fim.
- **SC-002**: O Mestre consegue abrir a lojinha e entregar itens a um jogador em menos de 1 minuto.
- **SC-003**: Alterações na proposta de um lado são visíveis no outro lado em menos de 2 segundos (tempo real).
- **SC-004**: 100% das transações validam corretamente o saldo e estoque antes de executar.
- **SC-005**: Ao desconectar durante uma negociação, esta é cancelada e ambos os lados mantêm seus inventários intactos.

## Assumptions

- O campo `coins` será uma coluna dedicada (tipo inteiro) na tabela `characters`, separada do campo JSON `stats`. Se a coluna ainda não existir, será criada via migração. Isso garante operações atômicas de débito/crédito em negociações concorrentes.
- A tabela `items` será estendida com um campo de preço (`price` em SP) para exibir a legenda de preços durante as negociações. Itens sem preço definido mostram "—".
- O Mestre na lojinha não possui um personagem real — suas ações são representadas por um registro especial do lado "Mestre" (GM) na negociação, sem verificação de saldo/estoque.
- NPCs Simples (não-jogáveis) que entram em negociação usam o catálogo completo de itens (como a lojinha) pois não possuem inventário próprio na tabela `character_items`.
- NPCs Jogáveis (com Ficha Completa) possuem inventário real e são tratados como personagens normais na negociação.
- As negociações só são possíveis durante sessões ativas (status = 'active').
- A interface de negociação será implementada como um modal/dialog dentro da página da sessão ativa, sem navegação para rotas separadas.
- Negociações concluídas são mantidas permanentemente no banco (status "concluída") como registro histórico. Uma interface de consulta de histórico pode ser adicionada futuramente, mas está fora do escopo desta versão.

## Clarifications

### Session 2026-06-18

- Q: Como o segundo jogador entra na negociação — a janela abre automaticamente ou ele precisa aceitar primeiro? → A: O Jogador B recebe uma notificação/popup de "Solicitação de Troca" e precisa aceitar para a janela abrir para ambos (Opção B).
- Q: Na Lojinha do Mestre, o jogador precisa aceitar a solicitação ou a janela abre diretamente? → A: A janela abre diretamente para ambos sem aceite do jogador. O Mestre é a autoridade da sessão (Opção A).
- Q: Negociações devem ter timeout por inatividade? → A: Sem timeout. A negociação permanece aberta enquanto a sessão estiver ativa (Opção A — recomendada).
- Q: Onde ficam os Shekels (SP) do personagem — dentro do JSON `stats` ou como coluna dedicada? → A: Coluna dedicada `coins` (inteiro) na tabela `characters`, separada do `stats`, para operações atômicas de débito/crédito.
- Q: Negociações concluídas devem ser mantidas como histórico ou deletadas? → A: Manter registro permanente no banco (status "concluída"), sem interface de histórico por agora (Opção B).
- Q: Os outros jogadores devem ver que alguém está negociando e ter interações bloqueadas? → A: Sim. Indicador visual "Negociando" no card e bloqueio de interações (requisição do usuário).
