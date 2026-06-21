# Feature Specification: Ajuste de Botões da Sessão (Home)

**Feature Branch**: `033-home-session-roles`

**Created**: 2026-06-21

**Status**: Draft

**Input**: User description: "essa é a tela do jogador e de quem criou a sessão (o mestre), precisamos ajustar para quem criou a sessão, só tenha o botão verde de acessar como mestre, e na visão do jogador, tenha a opção de criar uma nova sessão e ser o mestre ou entrar na sessão existente o qual o persongem do usuário está convidado. E está duplicado teste, identifique a causa de estar duplicado e corrija tbm."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visão do Mestre (Priority: P1)

Como criador da sessão (Mestre), quero ver apenas o botão verde de acessar como mestre, para ter clareza da minha função principal nesta sessão.

**Why this priority**: É a regra de negócio principal para o fluxo de quem está narrando/criando a sessão. Elimina confusão na interface.

**Independent Test**: Can be fully tested by logging in as the session creator and verifying only the green button is visible for session access.

**Acceptance Scenarios**:

1. **Given** o usuário atual é o criador da sessão ativa, **When** ele visualiza a tela inicial (Home), **Then** ele vê apenas o botão verde "Acessar Sessão Ativa (Mestre)" em relação ao controle de sessões.
2. **Given** o usuário atual é o criador da sessão ativa, **When** a tela inicial carrega, **Then** as opções de jogador (como criar nova ou entrar em outra) referentes a essa sessão ou genéricas não entram em conflito visual.

---

### User Story 2 - Visão do Jogador (Priority: P1)

Como jogador, quero ter a opção de criar uma nova sessão (tornando-me mestre dela) ou entrar em uma sessão existente para a qual meu personagem foi convidado.

**Why this priority**: Permite que jogadores comuns possam navegar para suas mesas ativas ou iniciar suas próprias campanhas.

**Independent Test**: Can be fully tested by logging in as a non-creator invited to a session and verifying the presence of "criar nova sessão" and "entrar na sessão existente".

**Acceptance Scenarios**:

1. **Given** o usuário não é o mestre, mas está convidado para uma sessão, **When** ele visualiza a tela inicial, **Then** ele vê um botão para entrar na sessão em que é convidado.
2. **Given** o usuário não é o mestre, **When** ele visualiza a tela inicial, **Then** ele também vê a opção de "Criar Nova Sessão" para se tornar mestre de uma nova campanha.

---

### User Story 3 - Correção de Duplicação (Priority: P2)

Como usuário, quero ver a lista de sessões sem duplicações (ex: múltiplos botões "Entrar: teste"), para não ficar confuso sobre qual opção clicar.

**Why this priority**: Resolve um bug visual/lógico relatado na interface atual.

**Independent Test**: Can be fully tested by reproducing the state that caused duplicated entries and verifying they now appear deduplicated.

**Acceptance Scenarios**:

1. **Given** o estado da aplicação possui uma sessão de teste listada, **When** os botões são renderizados, **Then** o botão "Entrar: teste" aparece apenas uma vez.

### Edge Cases

- What happens when o usuário é mestre de uma sessão e convidado de outra simultaneamente? (Como a interface deve priorizar ou exibir ambas?)
- How does system handle a situação onde o convite para a sessão expirou ou foi cancelado?
- What happens when a lista de sessões é renderizada rapidamente via estado global/cache e ocorre uma condição de corrida duplicando os dados?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST identificar se o usuário atual é o Mestre (criador) da sessão ativa ou apenas um Jogador (convidado).
- **FR-002**: System MUST exibir apenas o botão de acesso de Mestre caso o usuário logado seja o Mestre da sessão.
- **FR-003**: System MUST exibir opções de "Criar Nova Sessão" e "Entrar na Sessão" caso o usuário seja Jogador (não-mestre).
- **FR-004**: System MUST garantir que a renderização dos convites ou sessões ativas seja desduplicada usando IDs únicos de sessão.
- **FR-005**: System MUST resolver o bug específico que está causando o botão "Entrar: teste" a aparecer duplicado na UI (provavelmente no React state ou iteração do Zustand/React Query).

### Key Entities

- **Session**: Entidade que representa a mesa de jogo. Possui um ID, nome, e a referência de quem a criou (`createdBy` ou `masterId`).
- **User**: O usuário autenticado atual, com quem o sistema compara o `masterId` da sessão para definir as permissões visuais.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários mestres veem estritamente 1 botão verde para acesso à sessão correspondente.
- **SC-002**: Jogadores (não mestres) veem botões distintos para criar sessão ou entrar na(s) que foram convidados.
- **SC-003**: 100% de eliminação dos botões duplicados ("Entrar: teste") na tela Home.
- **SC-004**: A alteração de UI não degrada a performance de renderização inicial da página Home.

## Assumptions

- O sistema já possui no estado ou no retorno da API a distinção entre quem criou a sessão (Mestre) e os demais participantes (Jogadores).
- O bug de duplicação está restrito ao frontend (ex: erro no uso de `map` no React sem limpar o array, estado global mal atualizado ou re-renderização dupla no `useEffect`) e não a uma inconsistência real no banco de dados.
- O botão "Criar Personagem" e "Meus Personagens" continuam visíveis independente da role na sessão, pois são opções globais do usuário.
