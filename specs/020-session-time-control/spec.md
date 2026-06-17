# Feature Specification: Controle de Tempo da Sessão

**Feature Branch**: `020-session-time-control`

**Created**: 2026-06-17

**Status**: Draft

**Input**: User description: "quero adicionar um botão de tempo do lado do botão de dados na sessão na visão do mestre. O botão vai estar aparecendo o periodo que a sessão está quando clica vai mudar para tarde e para noite. O pq isso é importnate: Tem habilidades que só carregaram depois de um dia. Então tem que ter o indicado em ambas as viões de que dia é (exemplo: DIA 1) e o indicador em ambos os lado falando que periodo que é (exeplo: Noite). Quando o mestre clicar no botão, vai passar de tarde para noite, quando clicar no mesmo botão vai passar de noite para manhã, adicionando assim mais um dia para a sessão."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Controle de Tempo pelo Mestre (Priority: P1)

Como mestre, eu quero poder avançar o período do dia (Manhã, Tarde, Noite) clicando em um botão, para que o tempo da narrativa flua e as habilidades dos jogadores possam recarregar adequadamente.

**Why this priority**: É a funcionalidade central. Sem ela, não é possível controlar o tempo, o que afeta diretamente o balanceamento e recarga de habilidades de fé.

**Independent Test**: Pode ser testado clicando no botão na visão do mestre e observando a mudança visual de período e incremento de dia.

**Acceptance Scenarios**:

1. **Given** que a sessão está no "DIA 1" de "Manhã", **When** o mestre clica no botão de tempo, **Then** a sessão avança para "Tarde".
2. **Given** que a sessão está no "DIA 1" de "Tarde", **When** o mestre clica no botão de tempo, **Then** a sessão avança para "Noite".
3. **Given** que a sessão está no "DIA 1" de "Noite", **When** o mestre clica no botão de tempo, **Then** a sessão avança para o "DIA 2" de "Manhã".

---

### User Story 2 - Visualização de Tempo por Jogadores (Priority: P1)

Como jogador, eu quero visualizar em qual dia e período do dia a sessão se encontra, para que eu saiba quando minhas habilidades estarão disponíveis novamente e qual a ambientação atual.

**Why this priority**: A visibilidade do tempo afeta a estratégia dos jogadores e a imersão na sessão.

**Independent Test**: Pode ser testado abrindo a visão de jogador (dashboard) e observando se as informações de dia e período são exibidas e sincronizadas em tempo real com as ações do mestre.

**Acceptance Scenarios**:

1. **Given** que o mestre mudou o período da sessão, **When** um jogador olha para sua tela de sessão, **Then** o indicador mostra o dia e período corretos.
2. **Given** que um jogador carrega a página da sessão, **When** a interface é renderizada, **Then** o dia e o período atual são carregados do estado da sessão.

---

### Edge Cases

- O que acontece se a conexão do mestre falhar durante a mudança de período?
- Como o sistema reage se múltiplos mestres (se suportado) tentarem alterar o tempo simultaneamente?
- O que acontece com habilidades que têm duração específica quando o tempo avança de noite para manhã?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir um botão de controle de tempo na interface do Mestre, posicionado ao lado do botão de rolagem de dados.
- **FR-002**: O sistema DEVE exibir o dia atual e o período atual na interface tanto do Mestre quanto dos Jogadores.
- **FR-003**: O sistema DEVE permitir que APENAS o Mestre avance o período da sessão (Manhã -> Tarde -> Noite -> Manhã).
- **FR-004**: O sistema DEVE incrementar automaticamente o contador de "Dias" quando o período avançar de "Noite" para "Manhã".
- **FR-005**: O sistema DEVE sincronizar as mudanças de dia e período em tempo real para todos os participantes da sessão.
- **FR-006**: O sistema DEVE enviar um evento de notificação para a tela de todos os jogadores conectados quando o período avançar de "Noite" para "Manhã". A interface do jogador deve exibir um pop-up ou alerta (Ex: "Um novo dia raiou. Deseja aplicar um descanso?") permitindo que o jogador decida recarregar suas habilidades.

### Key Entities

- **Session (Sessão)**: Entidade que deve receber os novos campos `current_day` (inteiro) e `current_period` (string: Manhã, Tarde, Noite).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Mestres conseguem alterar o período da sessão com o clique no botão e a mudança reflete em menos de 1 segundo nas telas dos jogadores conectados.
- **SC-002**: A passagem de "Noite" para "Manhã" corretamente adiciona 1 ao valor do "Dia" exibido para todos os usuários.
- **SC-003**: As interfaces de mestre e jogador exibem visivelmente informações do dia (Ex: DIA 1) e período (Ex: Noite).

## Assumptions

- Assumimos que as sessões sempre iniciam no "DIA 1", período da "Manhã" ao serem criadas.
- Assumimos que não há mecânica de retroceder o tempo (voltar de Tarde para Manhã do mesmo dia) através desta interface.
- Assumimos que o período do dia é global e compartilhado entre todos os jogadores na mesma sessão.
