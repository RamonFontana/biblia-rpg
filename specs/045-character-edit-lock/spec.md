# Feature Specification: Bloqueio e Melhoria na Edição de Personagem

**Feature Branch**: `[045-character-edit-lock]`

**Created**: 2026-07-02

**Status**: Draft

**Input**: User description: "quero criar bloqueio de edição de personagem e melhorar o mesmo. O bloqueio é quando o personagem já participou de uma sessão, nesse caso ele só vai por entrar no wizzard e passar pelas abas, podendo alterar só a narrativa como parencia fisíca, hisória e Origem e retrato do personagem. (vou deixar essa alteração para caso precise fazer um pequeno ajuste), e só isso. E em questão de melhorar a edição do personagem, quando eu crio o personagem, posso alterar tudo dele ainda. Mas quando vou editar por exemplo a tribo, eu tenho que selecionar a tribo e apartar avançar, depois ir para a aba resumo e apertar salvar, isso ficou muito confuso, na ediçao tem que ter a opção de salvar em todas as abas"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bloqueio de Edição Pós-Sessão (Priority: P1)

Como jogador, quando eu tento editar um personagem que já participou de uma sessão, eu quero poder alterar apenas os aspectos narrativos (aparência física, história, origem e retrato), mantendo os dados mecânicos (atributos, classe, tribo, etc.) bloqueados para evitar trapaças ou inconsistências com as regras da campanha.

**Why this priority**: A integridade das estatísticas do personagem após o início do jogo é essencial no RPG. Sem essa proteção, os jogadores poderiam alterar dados vantajosos desequilibrando o andamento das sessões.

**Independent Test**: Pode ser testado tentando editar um personagem com o status indicando que já entrou em uma sessão; o formulário deve impedir alterações em abas mecânicas.

**Acceptance Scenarios**:

1. **Given** que o personagem participou de pelo menos uma sessão, **When** o usuário tenta editá-lo no formulário, **Then** as opções mecânicas (tribo, classe, atributos mecânicos) devem estar inativas (bloqueadas) para edição.
2. **Given** que o personagem participou de pelo menos uma sessão, **When** o usuário acessa as abas de narrativa (Aparência, História, Origem, Retrato), **Then** ele consegue realizar alterações e salvá-las normalmente.

---

### User Story 2 - Salvamento Descomplicado durante a Edição (Priority: P2)

Como usuário, quando estou editando um personagem, eu quero ter a opção de "Salvar" visível e acessível em qualquer aba (passo) do formulário, para não precisar avançar manualmente até a aba final ("Resumo") apenas para confirmar as mudanças de uma aba intermediária.

**Why this priority**: A UX atual (ter que navegar por abas não relacionadas só para salvar uma mudança) é frustrante e confusa. Melhorar essa navegação incentiva um uso mais agradável e fluido do aplicativo.

**Independent Test**: Pode ser testado abrindo o modo de edição de um personagem e confirmando que cada passo individual permite salvar as mudanças feitas lá mesmo.

**Acceptance Scenarios**:

1. **Given** que o personagem está sendo editado na aba "Tribo", **When** o usuário seleciona uma nova tribo, **Then** a opção "Salvar" já está disponível naquela mesma tela.
2. **Given** que o usuário clica em "Salvar" na aba atual, **When** as alterações são gravadas com sucesso, **Then** o sistema registra a edição sem exigir que o usuário percorra as próximas abas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST determinar se um personagem já participou de uma sessão de jogo.
- **FR-002**: Se um personagem já participou de uma sessão, o sistema MUST bloquear campos de seleção mecânica (Tribo, Passivas, Classe, Proficiências) durante o fluxo de edição (wizard).
- **FR-003**: Se um personagem já participou de uma sessão, o sistema MUST permitir edição dos campos narrativos (Aparência, História, Origem, Retrato).
- **FR-004**: No fluxo de edição de um personagem (seja bloqueado ou não), o sistema MUST fornecer um botão "Salvar" em cada etapa (aba) do Wizard.
- **FR-005**: Ao acionar "Salvar" numa aba intermediária, o sistema MUST gravar as informações no banco de dados sem exigir navegação até a aba final.

### Key Entities

- **Character**: O personagem, que passará a ter seu estado validado (se participou de sessão ou não).
- **Session/CharacterSession**: Relação de participação que definirá se os bloqueios se aplicam ou não a este personagem específico.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos personagens que já estiveram em sessão são impedidos de alterar regras baseadas em mecânica de jogo pelo formulário de edição.
- **SC-002**: O tempo para editar um único campo e salvar diminui para menos da metade do tempo anterior (pois não requer mais navegação pela tela "Resumo").

## Assumptions

- Assumimos que o modelo de banco de dados ou estado da aplicação já tenha uma forma confiável de dizer se o personagem participou de alguma sessão (ex: um campo booleano `has_played` ou consultar a tabela de relacionamento sessões-personagens).
- Apenas a interface de edição já existente (wizard) sofrerá as mudanças de layout e bloqueios; a de criação continua permitindo navegar normalmente e não requer as mesmas travas.
