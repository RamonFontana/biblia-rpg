# Feature Specification: Sistema de Progressão de Nível

**Feature Branch**: `048-level-progression`

**Created**: 2026-07-03

**Status**: Approved

## Clarifications

### Session 2026-07-03

- Q: As escolhas de caminho de tribo (A/B) são travadas após a primeira escolha? → A: Não. Cada nível com opção de caminho é uma escolha independente. O jogador pode escolher A no nível 4 e B no nível 8, por exemplo. O mesmo vale para vocação.
- Q: Em quais contextos o nível do personagem deve ser visível? → A: Em todos os cards em todos os contextos — CharacterCard (Meus Personagens), PlayerCard (sessão ativa, visível para mestre E jogadores), e SessionParticipantList. Atualmente o nível não é exibido em nenhum desses locais.
- Q: O jogador deve rolar o dado de vida para HP ao subir de nível, ou usar o valor médio fixo? → A: Sempre valor médio fixo. Guerreiro: 6, Batedor/Caçador: 5, Sacerdote: 4 (+ modificador de CON).
- Q: O jogador pode realizar o level up enquanto está participando de uma sessão ativa? → A: Não. Level up é bloqueado durante sessão ativa. Além disso, personagens com level up pendente ficam desabilitados na listagem de criação de sessão, com mensagem explicando que precisam completar a progressão antes de jogar.
- Q: O que acontece se a Constituição aumentar no ASI e mudar o modificador? → A: O sistema aplicará HP retroativo automaticamente para todos os níveis anteriores, conforme a regra oficial do D&D.

**Input**: User description: "Implementar o sistema de progressão de nível. O mestre, ao finalizar uma sessão, pode escolher personagens de jogadores para aumentar o nível. O jogador, ao acessar a lista de seus personagens, verá um botão sinalizando que o personagem pode subir de nível, e ao apertar poderá fazer a progressão seguindo as regras do D&D, escolhendo novas habilidades e melhorando o que for necessário."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mestre Concede Aumento de Nível (Priority: P1)

Ao finalizar uma sessão, o mestre deseja indicar quais personagens jogadores estão prontos para subir de nível. Ele acessa uma tela de encerramento de sessão onde pode selecionar um ou mais personagens participantes para receberem o aumento de nível. Ao confirmar, o sistema registra que esses personagens estão aptos a progredir.

**Why this priority**: Este é o ponto de entrada obrigatório para toda a progressão de nível. Sem a ação do mestre, nenhum jogador pode subir de nível. É a funcionalidade mais crítica pois desbloqueia todas as demais.

**Independent Test**: Pode ser testado criando uma sessão ativa com jogadores, finalizando-a, selecionando personagens para aumento de nível, e verificando que o status de "apto a subir de nível" foi registrado.

**Acceptance Scenarios**:

1. **Given** uma sessão ativa com 3 jogadores participantes, **When** o mestre clica em "Finalizar Sessão" e seleciona 2 personagens para aumento de nível, **Then** esses 2 personagens recebem a marcação de "pendente de level up" e os dados são persistidos.
2. **Given** uma sessão ativa, **When** o mestre finaliza a sessão sem selecionar nenhum personagem para aumento de nível, **Then** a sessão é encerrada normalmente sem nenhuma marcação de level up (comportamento atual preservado).
3. **Given** uma sessão ativa, **When** o mestre seleciona personagens e confirma, **Then** apenas os personagens selecionados recebem a marcação; os demais permanecem inalterados.

---

### User Story 2 - Jogador Visualiza Indicador de Level Up Disponível (Priority: P1)

Quando um jogador acessa a lista de personagens ("Meus Personagens"), cada personagem que foi marcado como apto a subir de nível deve exibir um indicador visual claro (badge, ícone ou destaque) sinalizando que a progressão está disponível.

**Why this priority**: Sem uma indicação visual clara, o jogador não saberá que pode subir de nível, tornando o fluxo todo inútil. É essencial para a comunicação entre o que o mestre decidiu e o que o jogador vê.

**Independent Test**: Pode ser testado marcando um personagem como "pendente de level up" no banco e verificando que o card do personagem na lista mostra o indicador visual.

**Acceptance Scenarios**:

1. **Given** um personagem marcado com level up pendente, **When** o jogador acessa "Meus Personagens", **Then** o card desse personagem exibe um badge/ícone de "Subir de Nível" claramente visível.
2. **Given** um personagem sem level up pendente, **When** o jogador acessa "Meus Personagens", **Then** nenhum indicador de level up é exibido no card.
3. **Given** o jogador possui 3 personagens e 2 têm level up pendente, **When** acessa a lista, **Then** apenas os 2 personagens relevantes mostram o indicador.

---

### User Story 3 - Jogador Realiza a Progressão de Nível (Priority: P1)

Ao clicar no botão/indicador de level up de um personagem, o jogador é levado a um fluxo guiado de progressão onde:
- O nível do personagem é incrementado.
- O HP máximo é incrementado usando o valor médio fixo do dado de vida da vocação + modificador de Constituição (Guerreiro: 6, Batedor/Caçador: 5, Sacerdote: 4).
- Se o novo nível desbloqueia habilidades da Tribo (níveis 4, 8, 12, 16, 20), o jogador pode escolher entre os caminhos disponíveis (Caminho A ou Caminho B). Cada nível é uma escolha independente — o jogador pode misturar caminhos livremente ao longo da progressão.
- Se o novo nível desbloqueia habilidades da Vocação (níveis 2, 6, 10, 14, 18), as novas habilidades são apresentadas e, quando aplicável, o jogador escolhe opções (ex: Estilo de Luta do Guerreiro no nível 2).
- Se o novo nível concede ASI (Ability Score Improvement, nos níveis 4, 8, 12, 16, 19 pelo D&D 5e), o jogador pode distribuir +2 em um atributo ou +1 em dois atributos.
- O bônus de proficiência é atualizado automaticamente quando aplicável (muda nos níveis 5, 9, 13, 17).
- Ao confirmar, o personagem é atualizado no banco e a marcação de "pendente de level up" é removida.

**Why this priority**: Este é o fluxo central que entrega valor ao jogador. Sem ele, o aumento de nível é apenas um número — é aqui que o personagem realmente evolui com escolhas significativas.

**Independent Test**: Pode ser testado marcando um personagem nível 1 como apto a subir, executando o fluxo de progressão, e verificando que o personagem está agora no nível 2 com HP atualizado, habilidades corretas de vocação adquiridas e a marcação removida.

**Acceptance Scenarios**:

1. **Given** um Guerreiro nível 1 da Tribo de Judá com level up pendente, **When** o jogador clica em "Subir de Nível", **Then** o sistema mostra o fluxo de progressão para nível 2, incluindo aumento de HP (valor médio fixo 6 + mod CON), escolha de Estilo de Luta e habilidade Surto de Ação (vocação Guerreiro nível 2).
2. **Given** um personagem subindo para nível 4, **When** o jogador realiza a progressão, **Then** ele vê as opções de habilidades da Tribo (escolha livre entre Caminho A ou Caminho B, independente de escolhas anteriores) e a opção de ASI (+2 em um atributo ou +1 em dois).
3. **Given** um personagem subindo para nível 3, **When** o jogador realiza a progressão, **Then** apenas o aumento de HP é apresentado (nível 3 não desbloqueia habilidades de Tribo nem de Vocação), sem opções de ASI.
4. **Given** um personagem que completou a progressão, **When** o jogador confirma, **Then** o nível é incrementado, HP máximo recalculado, habilidades adicionadas, atributos ajustados (se ASI), e a marcação de "pendente de level up" é removida.

---

### User Story 4 - Exibição Universal do Nível do Personagem (Priority: P1)

O nível do personagem deve ser visível em todos os contextos onde o personagem é exibido: na lista "Meus Personagens" (CharacterCard), nos cards de jogadores dentro da sessão ativa (PlayerCard, visível para mestre e todos os jogadores), e na lista de participantes da sessão (SessionParticipantList). Atualmente o nível não é exibido em nenhum desses locais.

**Why this priority**: O nível é informação fundamental do personagem. Sem a exibição, ninguém — nem mestre, nem jogadores — sabe o nível dos personagens visualmente, tornando o sistema de progressão invisível.

**Independent Test**: Pode ser testado verificando que todos os cards de personagem exibem o indicador de nível em cada um dos 3 contextos.

**Acceptance Scenarios**:

1. **Given** um personagem nível 3, **When** o jogador acessa "Meus Personagens", **Then** o CharacterCard exibe "Nível 3" junto com as demais informações (PV, CA, Fé).
2. **Given** uma sessão ativa com personagens de diferentes níveis, **When** qualquer participante (mestre ou jogador) visualiza o PlayerCard, **Then** o nível de cada personagem é exibido claramente.
3. **Given** uma sessão ativa, **When** o mestre ou jogador acessa a lista de participantes, **Then** o nível de cada personagem é visível na SessionParticipantList.

---

### Edge Cases

- O que acontece se o mestre marca um personagem que já tem level up pendente? O sistema deve ignorar duplicatas (não acumular múltiplos level ups).
- Como o sistema lida com um personagem que já está no nível 20 (máximo)? O personagem não deve aparecer na lista de seleção de level up do mestre, e se por algum erro for marcado, o sistema deve impedir a progressão.
- O que acontece se o jogador sai do fluxo de progressão sem confirmar? Nenhuma mudança é aplicada; a marcação de pendente permanece.
- O que acontece se o jogador fecha o navegador durante a progressão? Nenhuma mudança parcial é salva; somente o estado final confirmado é persistido.
- E se dois mestres em sessões diferentes marcarem o mesmo personagem? O sistema trata como um único level up pendente (boolean, não contador).
- O que acontece se o jogador tenta subir de nível enquanto participa de uma sessão ativa? O level up é bloqueado — o badge de pendente aparece, mas o botão está desabilitado com mensagem "Complete a sessão atual primeiro".
- O que acontece se o mestre tenta adicionar um personagem com level up pendente a uma nova sessão? O personagem aparece desabilitado na listagem de criação de sessão com mensagem explicando que precisa completar a progressão antes de jogar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que o mestre, ao finalizar uma sessão, selecione personagens participantes para receberem aumento de nível.
- **FR-002**: O sistema DEVE persistir a indicação de "level up pendente" de forma durável para cada personagem selecionado.
- **FR-003**: O sistema DEVE exibir um indicador visual no card do personagem na lista "Meus Personagens" quando há level up pendente.
- **FR-004**: O sistema DEVE fornecer um fluxo guiado de progressão que apresente ao jogador todas as escolhas relevantes para o novo nível.
- **FR-005**: O fluxo de progressão DEVE incrementar o nível do personagem.
- **FR-006**: O fluxo de progressão DEVE incrementar o HP máximo usando o valor médio fixo do dado de vida da vocação + modificador de Constituição atual.
- **FR-007**: O fluxo de progressão DEVE apresentar as habilidades de Tribo desbloqueadas (nos níveis 4, 8, 12, 16, 20), oferecendo a escolha entre Caminho A ou Caminho B em cada nível — as escolhas são independentes entre si.
- **FR-008**: O fluxo de progressão DEVE apresentar as habilidades de Vocação desbloqueadas (nos níveis 2, 6, 10, 14, 18), incluindo escolhas quando aplicáveis.
- **FR-009**: O fluxo de progressão DEVE apresentar a opção de ASI (Ability Score Improvement) nos níveis 4, 8, 12, 16 e 19.
- **FR-010**: O bônus de proficiência DEVE ser atualizado automaticamente nos níveis que alteram esse bônus (5, 9, 13, 17).
- **FR-011**: Após a confirmação do level up, o sistema DEVE atualizar o personagem no banco e remover a marcação de "pendente de level up".
- **FR-012**: O sistema DEVE impedir que um personagem nível 20 seja marcado para level up ou progrida além do nível 20.
- **FR-013**: O sistema DEVE preservar o fluxo atual de encerramento de sessão, adicionando a seleção de level up como etapa opcional.
- **FR-014**: O fluxo de level up DEVE permitir escolha livre de caminho (A ou B) em cada nível que oferece opções de Tribo ou Vocação, independente das escolhas feitas em níveis anteriores.
- **FR-015**: O sistema DEVE exibir o nível do personagem em todos os cards de personagem — CharacterCard (lista "Meus Personagens"), PlayerCard (sessão ativa, visível para mestre e jogadores) e SessionParticipantList.
- **FR-016**: O sistema DEVE bloquear a execução do level up enquanto o personagem estiver participando de uma sessão ativa. O badge de pendente permanece visível, mas o botão de progressão fica desabilitado com mensagem explicativa.
- **FR-017**: O sistema DEVE desabilitar personagens com level up pendente na listagem de criação de sessão, exibindo mensagem explicando que o personagem precisa completar a progressão de nível antes de participar de uma nova sessão.
- **FR-018**: O sistema DEVE calcular HP retroativo se o modificador de Constituição aumentar durante o level up (ASI). O personagem ganha +(diferença do modificador) de HP para cada nível que ele já possuía antes da progressão atual.

### Key Entities

- **Personagem (Character)**: Entidade central. Possui nível, atributos, stats (HP, CA, Fé), habilidades (skills), vocação, tribo, e um indicador de "level up pendente".
- **Sessão (Game Session)**: Contexto onde o mestre interage com os personagens. A finalização da sessão é o momento em que o level up é concedido.
- **Habilidade (Ability)**: Capacidade adquirida por nível, vinculada à Tribo ou Vocação, podendo exigir escolha de caminho/opção.
- **Progressão (Level Up)**: Registro temporário que indica que um personagem está apto a subir de nível. Removido após a execução do fluxo de progressão pelo jogador.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O mestre consegue marcar personagens para level up ao finalizar uma sessão em menos de 30 segundos (1-2 cliques por personagem).
- **SC-002**: O jogador identifica visualmente que um personagem pode subir de nível imediatamente ao acessar a lista de personagens (indicador claro sem necessidade de abrir detalhes).
- **SC-003**: O jogador completa o fluxo de progressão de nível em menos de 2 minutos, incluindo todas as escolhas de habilidades e ASI.
- **SC-004**: 100% das progressões concluídas resultam em dados consistentes — nível incrementado, HP recalculado corretamente, habilidades adicionadas conforme as regras.
- **SC-005**: Nenhuma progressão parcial ou inconsistente é salva no sistema (atomicidade da operação de level up).

## Assumptions

- O sistema de encerramento de sessão já existe e funciona (`endSession` no `ActiveSessionPage.tsx`). A seleção de level up será adicionada como etapa nesse fluxo existente.
- Os dados de habilidades por nível de Tribo e Vocação já estão catalogados em `src/data/abilities.ts` e nos documentos `docs/tribos/` e `docs/vocacoes/`.
- O personagem já possui um campo `level` (integer, default 1) na tabela `characters`.
- O sistema de Fé, HP e CA já está funcional e não precisa de alteração na lógica existente, apenas na atualização de valores durante o level up.
- O bônus de proficiência já é calculado dinamicamente pela função `calculateProficiency()` em `characterMath.ts` baseado no nível, portanto não requer nova persistência.
- O dado de vida de cada vocação está definido na documentação (Guerreiro: d10, Batedor: d8, Caçador: d8, Sacerdote: d6).
- O campo `skills` (JSONB) do personagem é onde as habilidades adquiridas serão registradas, usando a estrutura de `ability_uses` que já existe.
- A tabela `characters` receberá um novo campo boolean `pending_level_up` (default false) para controlar o estado de level up pendente.
