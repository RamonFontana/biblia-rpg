# Feature Specification: Session Player Tests

**Feature Branch**: `018-session-player-tests`

**Created**: 2026-06-17

**Status**: Draft

**Input**: User description: "na visão do mestre na sessão, insira a opção de fazer testes com os jogadores, tem que ter testes de percepção, de fé, e todos teste desse tipo que precisa fazer , nesse botão, quando clicar, primeiro ele escolhe o teste e depois os jogadores que passarão pelo teste, ai o mestre digita um valor de 0 a 20 e envia, depois vai liberar um dialog com um input para cada jogador escolhido mostrando no dialog o valor q o mestre digitou, ai o jogador vai digitar ou mandar um valor aleatório (vai poder ditar pq as vezes ele tem o dado fisico e vai digitar o valor que cair) e vai enviar, enquanto isso o mestre espera todos que forem escolhidos para ver os resultados, mostrando os valores de cada um e quem foi aprovado e desaprovado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mestre Inicia Teste com Jogadores (Priority: P1)

O Mestre, durante uma sessão ativa, decide solicitar um teste (ex: Percepção, Fé) para um ou mais jogadores. Ele clica no botão de solicitar testes, seleciona o tipo de teste, seleciona quais jogadores farão o teste e define a dificuldade (um valor de 0 a 20), enviando a solicitação em seguida.

**Why this priority**: Esta é a funcionalidade base. Sem ela, os jogadores não podem receber a solicitação de teste enviada pelo mestre.

**Independent Test**: O Mestre consegue abrir a interface de testes, selecionar um teste, selecionar os jogadores alvo e enviar o valor de dificuldade com sucesso, e o sistema registra que o teste foi iniciado para esses jogadores.

**Acceptance Scenarios**:

1. **Given** que o Mestre está na tela da sessão ativa, **When** ele clica no botão de fazer testes com jogadores, **Then** ele vê uma lista de testes disponíveis (Percepção, Fé, etc).
2. **Given** que o Mestre selecionou o tipo de teste, **When** ele avança, **Then** ele pode selecionar quais jogadores na sessão realizarão o teste.
3. **Given** que o Mestre selecionou os jogadores, **When** ele define o valor de dificuldade (0-20) e envia, **Then** o estado do teste é iniciado e os jogadores selecionados são notificados.

---

### User Story 2 - Jogadores Respondem ao Teste (Priority: P1)

Os jogadores selecionados recebem o teste enviado pelo Mestre, visualizam a dificuldade estabelecida no dialog de teste, rolam seus dados (fisicamente ou de outra forma) e inserem o resultado obtido para enviar de volta ao Mestre.

**Why this priority**: Fundamental para fechar o loop do teste solicitado. O mestre precisa saber o resultado da rolagem do jogador.

**Independent Test**: Um jogador selecionado para um teste consegue ver a notificação/dialog do teste em tempo real, visualizar o valor da dificuldade e inserir e enviar o seu próprio valor de resultado ao Mestre.

**Acceptance Scenarios**:

1. **Given** que o Mestre enviou uma solicitação de teste para o Jogador A, **When** o Jogador A está na sua tela de sessão, **Then** um dialog é exibido mostrando o tipo de teste e o valor de dificuldade definido pelo Mestre.
2. **Given** que o dialog de teste está aberto para o Jogador A, **When** ele digita um valor de resultado numérico e clica em enviar, **Then** o resultado é transmitido ao Mestre e a interface do jogador indica que a resposta foi enviada com sucesso e aguarda o fechamento do teste pelo mestre.

---

### User Story 3 - Mestre Acompanha e Vê Resultados dos Testes (Priority: P1)

O Mestre aguarda que todos os jogadores selecionados enviem seus resultados. À medida que eles enviam, ou ao final, o Mestre vê os resultados de cada jogador em uma tela de acompanhamento e o sistema indica quem foi aprovado e quem foi reprovado no teste.

**Why this priority**: O Mestre precisa saber o resultado da ação que ele iniciou para poder narrar as consequências para o grupo na sessão.

**Independent Test**: O Mestre consegue ver uma tela de acompanhamento que é atualizada em tempo real quando os jogadores respondem, mostrando claramente os aprovados e reprovados com base nos resultados submetidos.

**Acceptance Scenarios**:

1. **Given** que um teste foi iniciado, **When** o Mestre aguarda respostas, **Then** ele vê uma interface indicando quais jogadores já responderam e quais ainda faltam responder.
2. **Given** que o Jogador A respondeu ao teste, **When** o Mestre visualiza os resultados em tempo real, **Then** ele vê o valor numérico que o Jogador A tirou e se ele foi Aprovado ou Reprovado com base na dificuldade definida.

### Edge Cases

- What happens when um jogador se desconecta da sessão antes de responder ao teste? (O Mestre pode cancelar o teste do jogador individualmente ou cancelar o teste como um todo).
- How does system handle se o Mestre tentar inserir um valor fora do intervalo 0-20 na dificuldade? (Deve haver validação de formulário para não permitir envio de números menores que 0 ou maiores que 20).
- What happens when o Mestre cancela o teste antes que todos os jogadores respondam? (Os jogadores que ainda não responderam devem ter o dialog de teste fechado/cancelado automaticamente de suas telas).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que o Mestre inicie um teste a partir da visualização da sessão através de um botão específico de "fazer testes com os jogadores".
- **FR-002**: O sistema MUST fornecer uma lista de tipos de testes predefinidos (ex: Percepção, Fé, Sobrevivência, etc) para o Mestre escolher na primeira etapa do fluxo.
- **FR-003**: O sistema MUST permitir que o Mestre selecione um, múltiplos ou todos os jogadores conectados na sessão para realizar o teste.
- **FR-004**: O sistema MUST exigir que o Mestre insira um valor de dificuldade numérico entre 0 e 20 para o teste antes de enviar.
- **FR-005**: O sistema MUST exibir um dialog (ou modal) na tela dos jogadores selecionados assim que o Mestre enviar o teste, contendo o tipo de teste e o valor numérico da dificuldade.
- **FR-006**: O sistema MUST prover um input no dialog do jogador para que este insira um valor numérico (resultado do seu dado) e um botão de enviar.
- **FR-007**: O sistema MUST atualizar em tempo real a visão do Mestre (dashboard de teste) com o status de resposta (aguardando/respondido) de cada jogador selecionado.
- **FR-008**: O sistema MUST calcular automaticamente e exibir ao Mestre se cada jogador foi aprovado ou reprovado. A regra de aprovação determina que um jogador é **Aprovado** se o seu resultado for **maior ou igual** à dificuldade estabelecida pelo Mestre; caso contrário, é **Reprovado**.
- **FR-009**: O sistema MUST permitir que o Mestre encerre ou limpe o dashboard do resultado do teste após todos responderem (ou quando o mestre desejar abortar).

### Key Entities

- **Active Session**: A sessão de jogo online em andamento onde Mestre e Jogadores estão sincronizados.
- **Session Player Test**: A entidade efêmera ou persistida que representa a rodada de teste em andamento. Possui os atributos: `tipo de teste`, `dificuldade` (0-20), `lista de jogadores alvo`, e `resultados` com o valor numérico submetido por cada jogador e o status da submissão.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O Mestre consegue configurar e disparar um teste para múltiplos jogadores em menos de 5 cliques/interações na interface.
- **SC-002**: Os jogadores selecionados recebem o dialog do teste em suas telas em menos de 2 segundos após o Mestre confirmar o envio.
- **SC-003**: O dashboard do Mestre reflete a resposta do jogador (valor do dado e status de aprovação/reprovação) em tempo real, em menos de 2 segundos após a submissão do jogador.
- **SC-004**: A lógica de cálculo do Mestre classifica corretamente 100% dos resultados dos jogadores em Aprovado ou Reprovado, comparando os valores inteiros da dificuldade e do resultado inserido pelo jogador.

## Assumptions

- Assume-se que o sistema base já suporta comunicação e atualização de estado em tempo real (ex: usando Supabase Realtime para presenças e estados de sessão).
- Assume-se que o jogador só pode responder ao teste com um valor numérico inteiro (o resultado bruto mais bônus, caso o sistema exija, ou apenas o valor que ele vê no dado físico, de acordo com as regras de mesa).
- Assume-se que a rolagem do dado é manual/física neste momento, não existindo a necessidade de construir um simulador de dados 3D na interface (o jogador apenas digita o resultado).
