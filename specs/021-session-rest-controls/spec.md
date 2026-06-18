# Feature Specification: Controle de Descansos da Sessão (Mestre)

**Feature Branch**: `021-session-rest-controls`

**Created**: 2026-06-17

**Status**: Draft

**Input**: User description: "Vamos melhorar essa regra de descanso, nodia pode ter 2 descansos curtos e acada 2 dias um descanso longo, sendo que o descanso longo. No sistema o mestre que faz esse descanso para todos os personagens da sessão, coloque um botão para esse 2 descansos com essa lógica na visão do mestre"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aplicar Descanso Curto (Priority: P1)

Como Mestre da sessão, quero poder acionar um "Descanso Curto" para todos os personagens do grupo simultaneamente, respeitando o limite diário de 2 descansos curtos, para refletir o tempo de parada no jogo sem que cada jogador precise fazê-lo individualmente.

**Why this priority**: É a principal ação repetitiva durante o dia de aventura e centraliza o controle do tempo de jogo no Mestre.

**Independent Test**: Can be fully tested by clicking the "Descanso Curto" button as a Game Master and verifying that it counts towards the daily limit and updates players' status accordingly.

**Acceptance Scenarios**:

1. **Given** a sessão ativa e o grupo ainda não realizou 2 descansos curtos no dia atual, **When** o Mestre clica no botão "Descanso Curto", **Then** a interface atualiza o contador de descansos curtos do dia e dispara a recuperação (HP/Habilidades) para todos os personagens da sessão.
2. **Given** que o grupo já realizou 2 descansos curtos no dia atual, **When** o Mestre tenta realizar um novo Descanso Curto, **Then** o sistema deve informar que o limite diário foi atingido e o botão pode estar desabilitado.

---

### User Story 2 - Aplicar Descanso Longo (Priority: P1)

Como Mestre da sessão, quero poder acionar um "Descanso Longo" para todos os personagens, que só pode ser feito a cada 2 dias no jogo, para restaurar totalmente o HP, metade dos Dados de Vida e a Fé do grupo de acordo com as regras estabelecidas.

**Why this priority**: É fundamental para o ritmo da campanha e recuperação significativa dos personagens, além de avançar o estado de dias passados.

**Independent Test**: Can be fully tested by triggering a Long Rest as a Game Master and verifying players get fully healed and the rest cooldown (2 days) is respected.

**Acceptance Scenarios**:

1. **Given** que se passaram pelo menos 2 dias de jogo desde o último Descanso Longo, **When** o Mestre aciona o "Descanso Longo", **Then** todos os personagens recuperam HP máximo, metade dos Dados de Vida, a Fé do grupo é restaurada (1d4 ou 1d4+2) e o sistema registra que o descanso longo foi utilizado.
2. **Given** que o grupo realizou um Descanso Longo recentemente e ainda não se passaram 2 dias no jogo, **When** o Mestre visualiza os controles, **Then** o botão de Descanso Longo deve estar indisponível ou bloqueado, indicando a restrição de tempo.

### Edge Cases

- O que acontece quando o grupo troca de dia (Passar o dia)? O contador de descansos curtos deve resetar.
- Como o sistema contabiliza "a cada 2 dias" para o descanso longo? É baseado no contador de "Passar o dia" existente na sessão?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE fornecer botões ou controles exclusivos para o Mestre da sessão aplicar "Descanso Curto" e "Descanso Longo".
- **FR-002**: O sistema DEVE limitar a aplicação de Descansos Curtos a no máximo 2 por "dia de jogo".
- **FR-003**: O sistema DEVE limitar a aplicação de Descansos Longos a 1 a cada 2 "dias de jogo".
- **FR-004**: O sistema DEVE resetar o contador de descansos curtos sempre que um novo dia de jogo for iniciado.
- **FR-005**: Ao acionar o Descanso Curto, o sistema DEVE aplicar a regra pertinente para todos os personagens ativos da sessão.
- **FR-006**: Ao acionar o Descanso Longo, o sistema DEVE recuperar o HP máximo, metade dos Dados de Vida gastos de todos os personagens e rolar a recuperação de Fé do grupo (com bônus de Sacerdote, se aplicável).
- **FR-007**: A contabilização da regra de "2 dias" DEVE basear-se na evolução de dias de jogo registrados na sessão, utilizando a funcionalidade existente em que o Mestre avança os dias manualmente (Botão "Passar Dia").
- **FR-008**: O sistema DEVE exibir um indicador na visão do jogador informando quando um descanso (curto ou longo) está disponível para ser solicitado ao Mestre.

### Key Entities

- **Sessão**: Mantém os contadores de tempo no jogo (dias passados, descansos curtos realizados no dia atual, dias passados desde o último descanso longo).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O Mestre consegue aplicar um descanso para todos os jogadores com apenas 1 clique, ao invés de cada jogador fazer o seu.
- **SC-002**: As restrições de tempo (2 descansos curtos/dia, 1 longo a cada 2 dias) não podem ser violadas pela interface.

## Assumptions

- Presume-se que o conceito de "dia de jogo" já existe e é controlado pelo Mestre na tela da sessão (botão/ação de avançar o dia).
- O cálculo de recuperação do Descanso Curto (gasto de Dados de Vida) dependerá da interação individual do jogador após o Mestre sinalizar o início do descanso, já que cada jogador pode querer gastar quantidades diferentes de dados. O mestre libera a funcionalidade e possivelmente recarrega atributos fixos.
