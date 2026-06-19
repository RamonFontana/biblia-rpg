# Feature Specification: combat-system

**Feature Branch**: `026-combat-system`

**Created**: 2026-06-19

**Status**: Draft

**Input**: User description: "quero desenvolver o combate seguindo o padrão do sistema, fiz um planejamento bem detalhado aqui, mas quero que vc revise e veja se tem como melhorar"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Setup do Combate (Priority: P1)

Como Mestre, eu quero poder configurar um novo combate escolhendo os participantes e definindo a ordem de iniciativa, para que eu possa organizar o início da batalha de forma estruturada.

**Why this priority**: É o ponto de partida de qualquer combate. Sem configurar quem está na batalha e a ordem de iniciativa, o combate não pode acontecer.

**Independent Test**: Pode ser testado criando um novo encontro, adicionando jogadores e inimigos, inserindo valores de iniciativa e verificando se a lista é ordenada corretamente.

**Acceptance Scenarios**:

1. **Given** que o Mestre está na tela da sessão, **When** ele inicia um novo combate e seleciona os personagens (jogadores, NPCs, inimigos), **Then** ele pode inserir a iniciativa de cada um e ver a lista ordenada do maior para o menor.
2. **Given** uma lista de iniciativa pré-ordenada, **When** o Mestre precisa ajustar algo manualmente, **Then** ele pode reordenar a lista antes de iniciar a rodada.

---

### User Story 2 - Acompanhamento do Turno do Mestre (Priority: P1)

Como Mestre, eu quero um painel de controle para acompanhar de quem é a vez, gerenciar HP, condições e avançar os turnos, para que eu tenha o controle absoluto da sessão física fluindo digitalmente.

**Why this priority**: O controle do combate pelo Mestre é o core da funcionalidade para o aplicativo atuar como assistente de mesa.

**Independent Test**: Pode ser testado ativando um combate, avançando turnos, e modificando o HP ou adicionando status a um participante pelo painel do mestre.

**Acceptance Scenarios**:

1. **Given** um combate ativo, **When** o Mestre clica em "Próximo Turno", **Then** o sistema avança para o próximo participante na lista de iniciativa.
2. **Given** que um personagem recebeu dano ou cura, **When** o Mestre seleciona o participante e aplica a alteração, **Then** o HP atual do participante é atualizado.
3. **Given** que um participante recebe uma condição (ex: "caído"), **When** o Mestre aplica esse status, **Then** a condição fica visível na ficha do participante no painel.

---

### User Story 3 - Visão do Jogador e Checklist de Ações (Priority: P2)

Como Jogador, eu quero ver um aviso claro de quando é o meu turno e um checklist visual de ações (Movimento, Ação, Ação Bônus, Reação), para não me perder durante a resolução do meu turno.

**Why this priority**: Auxilia os jogadores a manterem o ritmo, mas o combate pode rodar mesmo que o jogador não use o app e o Mestre controle tudo.

**Independent Test**: Pode ser testado logando como um jogador cujo turno iniciou, visualizando o alerta e marcando/desmarcando os checkboxes de ação.

**Acceptance Scenarios**:

1. **Given** que é a vez de um jogador, **When** o turno muda para ele, **Then** ele recebe um alerta visual claro de que é o seu turno.
2. **Given** que o jogador está no seu turno, **When** ele utiliza seu movimento ou uma ação e marca no checklist visual, **Then** o item fica marcado para acompanhamento visual (sem bloqueios mecânicos).
3. **Given** que o turno do jogador acabou, **When** a rodada volta para ele novamente, **Then** o checklist de ações é limpo automaticamente.

---

### User Story 4 - Resolução Híbrida de Rolagens (Priority: P2)

Como Jogador, eu quero poder optar entre rolar meus dados fisicamente na mesa ou digitalmente no app, para que a experiência se adapte ao estilo do grupo presencial.

**Why this priority**: O jogo é focado em sessões presenciais. Suportar dados físicos é essencial para a experiência híbrida.

**Independent Test**: Pode ser testado escolhendo uma habilidade e selecionando a opção de rolagem física, inserindo o resultado manualmente.

**Acceptance Scenarios**:

1. **Given** que o jogador decide atacar, **When** ele seleciona "Rolar no App", **Then** o sistema calcula o ataque e o dano automaticamente e envia para resolução.
2. **Given** que o jogador decide atacar fisicamente, **When** ele seleciona "Rolar Dado Físico", **Then** o sistema solicita que ele digite o resultado do d20 e o valor do dano, atualizando o sistema de acordo.

### Edge Cases

- What happens when um jogador se desconecta do app durante o combate?
- How does system handle personagens com a mesma iniciativa?
- What happens when novos inimigos entram na batalha após ela ter começado (Reforços)?
- How does system handle ações preparadas fora de turno?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir ao Mestre selecionar jogadores, NPCs e inimigos específicos para iniciar um combate.
- **FR-002**: O sistema DEVE permitir a inserção manual de valores de iniciativa e ordenar a lista de participantes do maior para o menor.
- **FR-003**: O sistema DEVE fornecer um controle central para o Mestre avançar o turno, pausar ou encerrar o combate.
- **FR-004**: O sistema DEVE sincronizar o turno atual e as informações de combate em tempo real para todos os clientes conectados.
- **FR-005**: O sistema DEVE permitir ao Mestre alterar os pontos de vida (HP) e adicionar/remover condições de qualquer participante durante o combate.
- **FR-006**: O sistema DEVE exibir para o jogador da vez um alerta visual de destaque do seu turno.
- **FR-007**: O sistema DEVE disponibilizar para o jogador um checklist de ações (Movimento, Ação, Ação Bônus, Reação) puramente visual.
- **FR-008**: O sistema DEVE limpar o checklist de ações automaticamente quando o turno do jogador for iniciado na rodada seguinte.
- **FR-009**: O sistema DEVE suportar registro de ataques e habilidades através de inserção manual de valores de dados físicos rolados na mesa.

### Key Entities 

- **Combat**: Representa o estado global e andamento de um encontro na sessão.
- **Participant**: Representa um personagem, criatura ou npc ativo no combate, com suas condições e vida atuais para a batalha.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O Mestre consegue configurar e iniciar um combate com 4 jogadores e 4 inimigos em menos de 1 minuto.
- **SC-002**: Mudanças de turno comandadas pelo Mestre refletem nas telas dos jogadores em menos de 2 segundos.
- **SC-003**: Jogadores conseguem registrar rolagens de dados físicos (ataque e dano) em menos de 15 segundos após a rolagem na mesa.

## Assumptions

- Jogadores possuem acesso ao aplicativo no celular ou computador durante a sessão física.
- O jogo baseia-se em turnos individuais tanto para jogadores quanto para os inimigos.
- O aplicativo não impedirá o Mestre de realizar ações ou aplicar efeitos livremente; atua como facilitador e "Teatro da Mente".
