# Feature Specification: Gerenciamento de Personagens

**Feature Branch**: `009-character-management`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "quero criar uma listagem dos personagens criados pelo usuário, e edição dos personagem criados enquanto não participou de uma sessão/partida, depois de ter participado, só podera visualizar o personagem, e não pode mais editar"

## Clarifications

### Session 2026-06-15

- Q: Como a restrição de edição deve ser aplicada ao usar o Supabase? → A: Banco de Dados (RLS): Criar uma política RLS no Supabase bloqueando operações de UPDATE se o personagem já tiver participado de sessão (além da trava visual no UI).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Listagem de Personagens (Priority: P1)

Como usuário, desejo visualizar uma lista de todos os personagens que criei, para que eu possa acessá-los e gerenciá-los facilmente.

**Why this priority**: É a funcionalidade central e porta de entrada para interagir com personagens já criados. Sem ela, o usuário não consegue encontrar seus personagens.

**Independent Test**: Pode ser testado independentemente verificando se a página de listagem exibe todos os personagens associados à conta do usuário conectado.

**Acceptance Scenarios**:

1. **Given** que o usuário está autenticado e possui personagens criados, **When** ele acessa a tela de listagem, **Then** ele deve ver todos os seus personagens com seus resumos básicos.
2. **Given** que o usuário está autenticado mas não possui personagens, **When** ele acessa a tela de listagem, **Then** ele deve ver uma mensagem indicando que não possui personagens e um botão para criar um novo.

---

### User Story 2 - Edição de Personagem Pré-Sessão (Priority: P1)

Como usuário, desejo editar as informações de um personagem que ainda não participou de nenhuma sessão, para que eu possa fazer ajustes ou corrigir erros antes de jogar.

**Why this priority**: Usuários cometem erros ou mudam de ideia durante a criação. Permitir ajustes antes do uso oficial é essencial para a experiência do usuário.

**Independent Test**: Pode ser testado selecionando um personagem com status "não participou de sessão" e verificando se o formulário de edição salva as alterações corretamente.

**Acceptance Scenarios**:

1. **Given** um personagem que nunca participou de uma sessão, **When** o usuário acessa seus detalhes, **Then** a opção de edição deve estar disponível.
2. **Given** que o usuário está editando o personagem, **When** ele salva as alterações, **Then** os novos dados devem refletir no personagem.

---

### User Story 3 - Visualização de Personagem Pós-Sessão (Priority: P2)

Como usuário, desejo visualizar um personagem que já participou de uma sessão, sendo impedido de editá-lo, para preservar a integridade dos dados registrados no jogo.

**Why this priority**: Previne fraudes e alterações indevidas no personagem que já estão atreladas a uma história oficial de sessão.

**Independent Test**: Pode ser testado selecionando um personagem com status "já participou de sessão" e confirmando que nenhuma interface de edição é apresentada, apenas a visualização de leitura.

**Acceptance Scenarios**:

1. **Given** um personagem que já participou de uma sessão, **When** o usuário acessa seus detalhes, **Then** a interface deve ser de visualização apenas (somente leitura), sem botões de edição.

### Edge Cases

- O que acontece se o status do personagem mudar para "participando de sessão" enquanto o usuário estiver com a tela de edição aberta?
- Como o sistema se comporta caso haja uma queda de conexão durante o salvamento das edições de um personagem pré-sessão?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que um usuário autenticado visualize uma lista com todos os personagens criados por ele.
- **FR-002**: O sistema DEVE permitir a edição total dos dados de um personagem caso este não tenha participado de nenhuma sessão.
- **FR-003**: O sistema DEVE bloquear qualquer edição em um personagem caso este já tenha participado de uma sessão, garantindo a restrição tanto via interface do usuário quanto no nível do banco de dados através de políticas RLS (Row Level Security) do Supabase.
- **FR-004**: O sistema DEVE prover uma interface de apenas visualização (read-only) para personagens que já participaram de uma sessão.
- **FR-005**: O sistema DEVE distinguir visualmente, na listagem de personagens, quais personagens estão editáveis e quais estão bloqueados para edição.

### Key Entities

- **Personagem**: Entidade central que possui atributos base, relação com o jogador/usuário e um indicador de estado que confirma se o personagem já ingressou ou não em uma sessão.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos usuários conseguem visualizar a listagem com todos os seus respectivos personagens.
- **SC-002**: Usuários não conseguem realizar edições em personagens bloqueados em nenhum cenário via interface.
- **SC-003**: A transição entre os estados de "editável" e "apenas visualização" funciona instantaneamente mediante a verificação do status do personagem.

## Assumptions

- O controle de autenticação de usuários já está implementado e operante no sistema.
- A flag ou status que indica a "participação em uma sessão" é gerenciada e alterada por outra parte do sistema (ex: painel do mestre de jogo), sendo esta feature responsável apenas pela leitura e reação a este estado.
- Assume-se que um usuário não pode excluir um personagem após este participar de uma sessão, mas essa lógica será abordada pelas regras gerais de negócio da aplicação (o input atual focou apenas em edição).
