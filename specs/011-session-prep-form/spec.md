# Feature Specification: Fluxo Completo de Criação de Sessão

**Feature Branch**: `011-session-prep-form`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "crie um botão na home que vai navegar para um formulário com etapas. Começaremos com a parte sentral da aplicação que é a criação da sessção, por ser grando vou fazer por partes. Agora quero fazer só a parte inicial que é a preparação para iniciar uma sessão. [...] quero uma página de criação de seção que vai dar um nome e uma breve descrição, na etapa seguinte vai ter o CRUD de inmigos, os inimgos terão base daqui. Na próxima etapa é o CRUD de personagens (NPCs) e ai a ultima etapa que vai ter a listagem de usuários com seus personagens, o mestre podera escolher queis personagens irão participar da história. ai temos a ultima etapa que é o resumoe criação de sessão. Quando criar a sessão, os personagens e inimigos serão efemeros e as informações da partida ali, acontecera em real time no supabase. E quando um usuário for convoado, ao acessar sua conta enquanto a sessão ta ativa, ele podera acessar a sessão para jogar com o seu personagem convocado"

## Clarifications

### Session 2026-06-16
- Q: Natureza Efêmera dos Personagens dos Jogadores → A: Os personagens dos jogadores NÃO são efêmeros. O que acontecer na sessão (inclusive morte) terá reflexo direto e permanente na ficha original (Option C). Apenas NPCs e Inimigos são cópias efêmeras da sessão.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acesso e Preparação Inicial (Priority: P1)
O Mestre clica no botão de criar sessão na Home e preenche a primeira etapa com o nome e uma breve descrição da sessão.

**Independent Test**: Pode ser verificado preenchendo os dados básicos e avançando de etapa, garantindo que o progresso é salvo localmente no frontend.

### User Story 2 - Seleção e Ajuste de Inimigos (Priority: P1)
O Mestre avança para a segunda etapa, onde pode listar, selecionar, modificar (CRUD) e adicionar inimigos para a sessão com base no Bestiário.

**Independent Test**: O Mestre deve poder adicionar um inimigo do bestiário, alterar sua vida ou status para a sessão, e remover um inimigo da lista.

### User Story 3 - Criação e Gerenciamento de NPCs (Priority: P2)
Na terceira etapa, o Mestre pode criar e gerenciar NPCs que participarão ativamente da sessão.

**Independent Test**: O Mestre consegue criar um NPC com atributos básicos e visualizá-lo na lista da etapa.

### User Story 4 - Convocação de Personagens/Jogadores (Priority: P1)
Na quarta etapa, o sistema lista usuários e seus personagens. O mestre escolhe quais personagens específicos participarão da história.

**Independent Test**: Selecionar um ou mais personagens da lista e avançar, garantindo que os usuários atrelados sejam marcados como convocados.

### User Story 5 - Resumo e Inicialização da Sessão (Priority: P1)
Na última etapa, o Mestre vê um resumo e clica em "Criar Sessão", o que instancia a partida real-time no Supabase. Inimigos e NPCs são salvos como entidades efêmeras vinculadas à sessão.

**Independent Test**: Após clicar em "Criar Sessão", uma sala de jogo/sessão ativa é gerada no banco de dados e aguarda a entrada dos jogadores.

### User Story 6 - Ingresso do Jogador Convocado (Priority: P1)
Um jogador convocado entra em sua conta, visualiza que a sessão está ativa e acessa o ambiente de jogo com seu personagem.

**Independent Test**: Logar como um jogador convocado e verificar se há um botão/link para "Entrar na Sessão Ativa" que carrega os dados em tempo real.

### Edge Cases

- O que ocorre se um jogador convocado deletar seu personagem antes da sessão iniciar?
- Como o sistema lida com quedas de conexão do Mestre durante a sessão em real-time?
- E se o mestre quiser adicionar mais inimigos *durante* a sessão já ativa, e não apenas na preparação?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE guiar o Mestre por um formulário de 5 etapas: 1) Preparação, 2) Inimigos, 3) NPCs, 4) Personagens/Jogadores, 5) Resumo e Criação.
- **FR-002**: O sistema DEVE permitir instanciar (CRUD) Inimigos baseados no Bestiário para a sessão.
- **FR-003**: O sistema DEVE permitir instanciar (CRUD) NPCs exclusivos para a sessão.
- **FR-004**: O sistema DEVE permitir ao Mestre convocar Personagens de Usuários reais para a sessão.
- **FR-005**: Ao criar a sessão, o sistema DEVE gravar as instâncias de Inimigos e NPCs como entidades efêmeras pertencentes àquela sessão.
- **FR-006**: Ao criar a sessão, o sistema DEVE gravar a sessão em um estado ativo e habilitar a comunicação em tempo real (Supabase Realtime) para os participantes.
- **FR-007**: O sistema DEVE refletir as mudanças que ocorrem com os Personagens dos Jogadores (HP, morte) de forma permanente nas tabelas oficiais do banco de dados, em tempo real. Em caso de morte na sessão, o personagem é deletado/marcado como morto no sistema.
- **FR-008**: O sistema DEVE utilizar um mecanismo de salvamento local no frontend para reter as informações da sessão em andamento entre as 5 etapas, gravando no banco apenas na etapa final.

### Key Entities

- **Sessão (Draft Local)**: Estado armazenado no navegador contendo arrays temporários de inimigos, NPCs e IDs de jogadores.
- **Sessão Ativa (DB)**: Entidade no Supabase com canal de comunicação Realtime.
- **Inimigo da Sessão**: Entidade efêmera que herda atributos do Bestiário mas vive apenas na sessão.
- **NPC da Sessão**: Entidade efêmera exclusiva daquela aventura.
- **Personagem do Jogador**: Entidade persistente, alterada em tempo real durante a sessão.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O Mestre consegue completar o fluxo de 5 etapas sem perder dados de formulário ao navegar entre "Avançar" e "Voltar".
- **SC-002**: A criação da sessão resulta na criação das tabelas/registros corretos no Supabase e na abertura de uma inscrição (subscription) Realtime válida.
- **SC-003**: Danos ou status aplicados a um Personagem de Jogador durante a sessão ativa alteram permanentemente o registro original no banco com até 1 segundo de latência via Supabase.

## Assumptions

- Assumimos que o CRUD de inimigos importará dados estáticos (JSON/MD) do Bestiário e permitirá edição em memória antes do envio.
- Assumimos que a "listagem de usuários com personagens" consultará uma rota do Supabase que retorna todos os personagens disponíveis na campanha ou sistema.
