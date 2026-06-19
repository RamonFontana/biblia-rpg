# Feature Specification: Sistema de Combate - Teste de Morte e Fim de Combate

**Feature Branch**: `027-combat-death-saves`

**Created**: 2026-06-19

**Status**: Draft

**Input**: User description: "quero melhorar bastante o sistema de combate, primeiro quero adicionar um botão que finaliza a sessão de combate, não sei se existe mas não estou encontrando. Quando o personagem chega ao pv 0 no D&D, e tem as seguinte regras no teste de morte... Quero implementar isso no sistema... O mestre tem que ter a opção dar sucesso no teste enquanto ele tenta ou ressucitar ele ou diminuir uma tentativa dando como falha ou até a morte instantanea... tudo isso seria bom ser refletido no banco e mostrado em tempo real para outros jogadores e o mestre."

## Clarifications

### Session 2026-06-19

- Q: Momento exato do Soft Delete → A: Apenas no final do combate (quando o mestre clica no botão de Finalizar Combate).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fim de Combate (Priority: P1)

Como Mestre (GM), quero um botão para finalizar a sessão de combate, para que eu possa encerrar o encontro e retornar o jogo ao estado normal de exploração/interpretação.

**Why this priority**: Finalizar o combate é essencial para limpar o estado da cena e continuar a narrativa do jogo.

**Independent Test**: Pode ser testado criando um combate e clicando no botão para finalizá-lo, verificando se o estado do combate é limpo e a interface atualizada para todos os participantes em tempo real.

**Acceptance Scenarios**:

1. **Given** um combate ativo, **When** o mestre clica no botão "Finalizar Combate", **Then** a sessão de combate é encerrada no banco de dados e as telas de todos os jogadores são atualizadas em tempo real, saindo da visão de combate.

---

### User Story 2 - Entrada no Estado de Morte (Priority: P1)

Como jogador, quando os Pontos de Vida (PV) do meu personagem chegam a 0, quero que a interface mude para refletir que estou inconsciente e em Teste de Morte, para que eu saiba o meu estado atual e possa realizar meus testes de salvaguarda.

**Why this priority**: É o gatilho para toda a nova mecânica de Teste de Morte.

**Independent Test**: Pode ser testado reduzindo a vida do personagem a 0 ou menos e observando se a interface (para ele e para o mestre) exibe a tela/modal de Teste de Morte com o placar de sucessos/falhas zerado.

**Acceptance Scenarios**:

1. **Given** um personagem ativo em combate, **When** seus PVs chegam a 0, **Then** o sistema altera seu status para "Inconsciente/Morrendo" e exibe a interface de Teste de Morte com 0 sucessos e 0 falhas, refletindo o novo status em tempo real para todos.

---

### User Story 3 - Realização do Teste de Morte (Priority: P1)

Como jogador morrendo, quero poder rolar meu Teste de Morte no meu turno, escolhendo entre rolar automaticamente o dado virtual ou inserir manualmente o resultado (caso role dados físicos), para acompanhar minhas chances de sobrevivência.

**Why this priority**: É a mecânica central do D&D para quando a vida chega a 0.

**Independent Test**: O jogador insere ou rola um dado e os marcadores de Sucesso/Falha são preenchidos conforme as regras, atualizando a interface do mestre em tempo real.

**Acceptance Scenarios**:

1. **Given** a interface de Teste de Morte, **When** o jogador rola/insere um valor de 10 a 19, **Then** ele ganha 1 Sucesso.
2. **Given** a interface de Teste de Morte, **When** o jogador rola/insere um valor de 2 a 9, **Then** ele sofre 1 Falha.
3. **Given** a interface de Teste de Morte, **When** o jogador rola/insere um 1 natural (Falha Crítica), **Then** ele sofre 2 Falhas simultâneas.
4. **Given** a interface de Teste de Morte, **When** o jogador rola/insere um 20 natural (Sucesso Crítico), **Then** ele desperta imediatamente com 1 PV, sai do estado de Teste de Morte e pode agir.

---

### User Story 4 - Resolução do Teste de Morte (Priority: P1)

Como jogador morrendo, ao acumular 3 sucessos, quero estabilizar e ao acumular 3 falhas, quero que o sistema declare a morte do personagem.

**Why this priority**: Consequência mecânica e narrativa para a resolução dos testes.

**Independent Test**: Simular sucessos e falhas e checar se o estado correto é acionado (Estabilizado ou Morto).

**Acceptance Scenarios**:

1. **Given** o personagem morrendo, **When** ele atinge 3 Sucessos antes de 3 Falhas, **Then** o personagem estabiliza (status atualizado), para de realizar os testes, mas permanece inconsciente (0 PV).
2. **Given** o personagem morrendo, **When** ele atinge 3 Falhas antes de 3 Sucessos, **Then** o personagem Morre (status atualizado) e isso é exibido para o mestre e todos os jogadores.

---

### User Story 5 - Controle do Mestre sobre o Teste de Morte (Priority: P2)

Como mestre, quero ter acesso aos controles do Teste de Morte de um personagem para forçar resultados (Adicionar Sucesso, Adicionar Falha, Reviver instantaneamente, Matar instantaneamente), para que eu possa refletir intervenções externas (um aliado o cura, ele sofre dano enquanto caído).

**Why this priority**: Intervenções curativas ou danos sofridos durante o estado de Morte requerem atualização do status fora da rolagem padrão do jogador.

**Independent Test**: O Mestre usa seus painéis de controle no personagem "Morrendo" para modificar os sucessos e falhas, e a interface do jogador reflete instantaneamente.

**Acceptance Scenarios**:

1. **Given** um personagem morrendo, **When** o mestre clica em "Adicionar Sucesso" ou "Adicionar Falha", **Then** a barra de progresso avança e pode disparar a estabilização ou morte se bater no limite.
2. **Given** um personagem morrendo, **When** o mestre clica em "Reviver/Curar", **Then** o estado do personagem sai de Morrendo para Ativo (ganha PV) e a interface de teste desaparece.
3. **Given** um personagem morrendo, **When** o mestre clica em "Morte Instantânea", **Then** o personagem morre, independente dos sucessos anteriores.

### Edge Cases

- O que acontece se o personagem receber dano enquanto já está inconsciente/morrendo? (Regra padrão do D&D: Sofre uma falha de morte automática, ou duas se o ataque for crítico/corpo-a-corpo. O mestre fará isso via "Controle do Mestre" ou automatizaremos?).
- O que acontece se o combate for finalizado pelo Mestre enquanto jogadores ainda estão morrendo? Eles continuam no estado morrendo e precisam continuar os testes?
- Como o sistema trata se dois usuários (mestre e jogador) tentarem atualizar o placar do teste de morte ao mesmo tempo no banco de dados (concorrência)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que o Mestre finalize o combate através de um botão no painel de combate, marcando-o como inativo no banco de dados.
- **FR-002**: O sistema MUST monitorar os Pontos de Vida (PV) de todos os personagens em combate e MUST acionar o estado de "Morrendo" quando os PV caem a 0 ou menos.
- **FR-003**: O sistema MUST exibir uma interface específica (modal ou card atualizado) para jogadores cujos personagens estejam com status "Morrendo", com placares para Sucessos (0/3) e Falhas (0/3).
- **FR-004**: O sistema MUST permitir que o jogador rola um d20 automático pelo sistema OU insira o resultado numérico manualmente no painel de Teste de Morte.
- **FR-005**: O sistema MUST aplicar as seguintes regras ao valor do dado (FR-004):
  - 10 a 19: +1 Sucesso
  - 2 a 9: +1 Falha
  - 1: +2 Falhas
  - 20: Restaura 1 PV e altera status para Ativo (pode agir).
- **FR-006**: O sistema MUST estabilizar o personagem (mantém 0 PV, para de fazer testes) ao alcançar 3 Sucessos.
- **FR-007**: O sistema MUST declarar Morte do personagem ao alcançar 3 Falhas.
- **FR-008**: O sistema MUST atualizar todos os participantes da sessão em tempo real sobre o status de Morte (Sucessos, Falhas, Morte, Estabilização).
- **FR-009**: O sistema MUST fornecer botões de controle para o Mestre sobre qualquer personagem "Morrendo", incluindo: Adicionar Sucesso, Adicionar Falha, Curar (tirar do estado), e Morte Instantânea.
- **FR-010**: O sistema MUST zerar imediatamente o contador de falhas e sucessos do Teste de Morte assim que o personagem for curado (PV > 0), retornando-o ao estado ativo sem penalidades remanescentes (Regra Padrão do D&D 5e).
- **FR-011**: O sistema MUST permitir que o Mestre ative o estado de Teste de Morte (ou decrete a morte) de um personagem a qualquer momento, mesmo fora de combate, ao reduzir os PVs para 0 pelo painel geral da sessão.
- **FR-012**: O sistema MUST fornecer ao Mestre a ação de "Levantar" um aliado caído, refletindo a intenção de um jogador próximo que decidiu ajudar. A execução mecânica (remover o estado "Morrendo") será feita pelo Mestre.
- **FR-013**: O sistema MUST executar o "soft delete" (marcar como morto permanente/excluído logicamente no banco) apenas no momento de finalizar o combate para os personagens que faleceram.
- **FR-014**: O sistema MUST garantir que o jogador cujo personagem morreu continue tendo acesso à tela da sessão como "espectador", podendo assistir aos eventos normalmente.

### Key Entities *(include if feature involves data)*

- **Character/Combat Participant**: Deve incluir novos campos para rastrear o estado de morte (ex: `death_saves_successes` (int), `death_saves_failures` (int), `is_stable` (boolean), `is_dead` (boolean)).
- **Combat Session**: A entidade de Combate já existente que terá seu status alterado (finalizado).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O Mestre consegue finalizar o combate com 1 clique, e todos os jogadores visualizam o fim do combate em até 2 segundos (real-time sync).
- **SC-002**: Jogadores que caem para 0 PV são imediatamente levados para a interface de Teste de Morte sem necessidade de atualização de tela.
- **SC-003**: O Mestre pode intervir nos testes de morte de qualquer jogador com tempo de reflexo na tela do jogador de menos de 1 segundo (via WebSockets/Realtime do banco).
- **SC-004**: O sistema aplica perfeitamente a regra de 20 Crítico (recupera 1 PV) e 1 Crítico (2 falhas).

## Assumptions

- Presume-se que o banco de dados (Supabase) já suporte realtime capabilities para atualização síncrona.
- Presume-se que o usuário não necessite de testes de morte para NPCs padrão (inimigos geralmente morrem com 0 PV), apenas para personagens jogáveis e personagens chave que o mestre decidir, embora a princípio será focado nos personagens dos jogadores (Players).
