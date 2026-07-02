# Feature Specification: Sistema de Perícias e Proficiência

**Feature Branch**: `046-skills-proficiency-system`

**Created**: 2026-07-02

**Status**: Draft

## Clarifications

### Session 2026-07-02

- Q: O campo `level` não existe na tabela `characters` nem no tipo TypeScript. Como resolver? → A: Adicionar a coluna `level` na tabela `characters` (default: 1) e no tipo TypeScript como pré-requisito desta feature.
- Q: O campo `skills` já é usado para `path_choices` e `ability_uses`. Onde armazenar as perícias? → A: Criar uma nova coluna `proficiencies` (JSON) na tabela `characters`, exclusiva para perícias e saving throws, evitando conflito com o campo `skills` existente.
- Q: A spec define quantas perícias por vocação, mas não restringe quais perícias cada vocação pode escolher. Livre ou restrito? → A: Restringir — cada vocação tem uma lista fixa de perícias elegíveis, conforme o D&D 5e adaptado.
- Q: Os TEST_TYPES atuais no sistema de testes de sessão são incompatíveis com o sistema de perícias. Refatorar? → A: Sim, refatorar para incluir 6 testes de atributo, 18 perícias e Fé (mecânica especial do RPG bíblico, usa d100 e não recebe bônus de proficiência).
- Q: O que acontece com as perícias selecionadas se o jogador mudar a vocação durante a edição? → A: Resetar as perícias automaticamente — o jogador precisa reescolher na etapa de perícias com a lista da nova vocação.

**Input**: User description: "Adicionar o sistema de Perícias e reformular definitivamente a mecânica de Proficiência na plataforma auxiliar de RPG. O foco principal é a clareza visual e funcional para o jogador, tanto na montagem quanto durante a gameplay."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Escolher Perícias na Criação do Personagem (Priority: P1)

Como jogador criando um novo personagem, quero selecionar as perícias em que meu personagem é proficiente, para que a ficha reflita corretamente meus bônus em testes de habilidade desde o início.

**Why this priority**: É o ponto de entrada de todas as perícias no sistema. Sem esse passo, nenhum personagem terá perícias registradas e as demais funcionalidades ficam vazias.

**Independent Test**: Pode ser testado criando um personagem completo e verificando que as perícias selecionadas foram gravadas corretamente no banco de dados.

**Acceptance Scenarios**:

1. **Given** o jogador está no fluxo de criação do personagem e já escolheu tribo, vocação e atributos, **When** avança para a etapa de perícias, **Then** o sistema exibe apenas as perícias elegíveis para a vocação escolhida, agrupadas por atributo associado, com o número de perícias que ele ainda pode selecionar.
2. **Given** o jogador está na etapa de perícias e já atingiu o número máximo de seleções permitidas, **When** tenta selecionar uma perícia adicional, **Then** o sistema bloqueia a seleção e indica visualmente que o limite foi atingido.
3. **Given** o jogador está editando um personagem já existente, **When** acessa a etapa de perícias na tela de edição, **Then** o sistema exibe as perícias já selecionadas previamente e permite alterá-las respeitando as mesmas regras de limite.

---

### User Story 2 - Visualizar Proficiência e Perícias na Ficha (Priority: P1)

Como jogador em gameplay, quero ver claramente na minha ficha quais perícias possuem bônus de proficiência e qual é o valor total calculado de cada perícia, para tomar decisões informadas durante a partida.

**Why this priority**: É a funcionalidade de leitura principal — durante o jogo, o jogador precisa consultar rapidamente suas perícias e entender seus bônus.

**Independent Test**: Pode ser testado abrindo a ficha de um personagem com perícias registradas e verificando que o destaque visual, os valores calculados e os tooltips estão corretos.

**Acceptance Scenarios**:

1. **Given** o jogador abre a ficha de um personagem que possui perícias com proficiência, **When** visualiza a seção de perícias, **Then** cada perícia em que possui proficiência recebe um indicador visual inconfundível (ícone preenchido e cor diferenciada) e as perícias sem proficiência ficam visualmente distintas (ícone vazio, tom mais neutro).
2. **Given** o jogador está visualizando a seção de perícias, **When** passa o mouse (ou toca) sobre uma perícia com proficiência, **Then** um tooltip aparece mostrando a composição do bônus: "Modificador de [Atributo] (±X) + Bônus de Proficiência (+Y) = Total (±Z)".
3. **Given** o jogador está visualizando a seção de perícias, **When** o personagem possui nível 5 (proficiência +3), **Then** o bônus de proficiência exibido no cabeçalho da ficha e aplicado nas perícias selecionadas reflete automaticamente o valor +3.

---

### User Story 3 - Ver Testes de Resistência com Proficiência (Priority: P2)

Como jogador em gameplay, quero que os testes de resistência (saving throws) em que tenho proficiência sejam claramente destacados na ficha, para saber exatamente quais salvaguardas tenho durante o combate.

**Why this priority**: Complementa a exibição de perícias. Testes de resistência são frequentemente pedidos pelo Mestre, mas são menos consultados que as perícias de habilidade.

**Independent Test**: Pode ser testado abrindo a ficha e verificando que os testes de resistência corretos estão destacados conforme a vocação do personagem.

**Acceptance Scenarios**:

1. **Given** o jogador tem um personagem Guerreiro, **When** visualiza a seção de testes de resistência na ficha, **Then** FOR e CON aparecem com o indicador de proficiência e seus valores incluem o bônus de proficiência.
2. **Given** o jogador tem um personagem de nível 1 com SAB 14, **When** visualiza o teste de resistência de SAB sem proficiência, **Then** o valor exibido é +2 (apenas modificador), sem indicador de proficiência.

---

### User Story 4 - Cálculo Automático do Bônus de Proficiência por Nível (Priority: P2)

Como jogador, quero que o bônus de proficiência seja recalculado automaticamente quando meu personagem sobe de nível, refletindo nos valores totais de todas as perícias e testes de resistência em que tenho proficiência.

**Why this priority**: É a mecânica de progressão que garante que a ficha se mantém atualizada. Sem isso, os valores ficam defasados.

**Independent Test**: Pode ser testado mudando o nível de um personagem e verificando que o bônus de proficiência e todos os valores derivados foram atualizados corretamente.

**Acceptance Scenarios**:

1. **Given** um personagem de nível 4 (proficiência +2) com proficiência em Percepção e SAB 16, **When** o personagem sobe para nível 5 (proficiência +3), **Then** o valor total de Percepção muda de +4 (2+2) para +6 (3+3) automaticamente.
2. **Given** um personagem que acabou de subir de nível, **When** visualiza a ficha, **Then** o badge de proficiência no cabeçalho da ficha reflete o novo valor.

---

### User Story 5 - Indicador de Proficiência nas Rolagens (Priority: P3)

Como jogador, quero que ao realizar uma rolagem de perícia ou teste de resistência durante a sessão, o sistema indique claramente se e como o bônus de proficiência foi aplicado, para ter confiança de que o resultado está correto.

**Why this priority**: Melhora a transparência e a confiança do jogador no sistema, mas não é bloqueante para as funcionalidades base.

**Independent Test**: Pode ser testado solicitando um teste de perícia durante uma sessão ativa e verificando que o resultado da rolagem exibe a decomposição do bônus.

**Acceptance Scenarios**:

1. **Given** o Mestre solicita um teste de Percepção (perícia), **When** o jogador rola o teste e possui proficiência em Percepção, **Then** o resultado da rolagem exibe: "1d20 (X) + SAB (+Y) + Proficiência (+Z) = Total".
2. **Given** o Mestre solicita um teste de Intimidação (perícia), **When** o jogador rola o teste mas NÃO possui proficiência, **Then** o resultado exibe "1d20 (X) + CAR (+Y) = Total" sem menção ao bônus de proficiência.
3. **Given** o Mestre solicita um teste de Fé, **When** o jogador rola, **Then** o sistema usa a mecânica especial de Fé (d100 contra Fé atual), sem aplicar bônus de proficiência, mantendo o comportamento existente.

---

### Edge Cases

- O que acontece quando um personagem criado antes da feature de perícias abre a ficha? O sistema deve exibir todas as perícias sem proficiência (sem destaque) e permitir que o jogador edite o personagem para adicioná-las.
- Como o sistema lida com perícias concedidas por fontes além da vocação (ex: passivas de tribo)? Na versão inicial, apenas perícias de vocação são suportadas. Perícias extras de tribo podem ser adicionadas em uma iteração futura.
- O que acontece se o jogador tenta desselecionar uma perícia e selecionar outra durante a edição? O sistema deve permitir livremente, desde que o total final respeite o limite de perícias da vocação.
- O que acontece se o jogador muda a vocação durante a edição de um personagem existente? As perícias selecionadas são **resetadas automaticamente**, pois a lista de perícias elegíveis muda entre vocações. O sistema deve forçar o jogador a passar pela etapa de perícias novamente com a lista da nova vocação.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir uma lista de 18 perícias baseadas no D&D 5e, adaptadas ao cenário bíblico, agrupadas pelo atributo associado (FOR, DES, CON, INT, SAB, CAR).
- **FR-002**: O sistema DEVE incluir uma etapa de seleção de perícias no fluxo de criação do personagem, posicionada após a definição de atributos e antes dos aspectos de fé.
- **FR-003**: O sistema DEVE aplicar as regras de número e **lista restrita** de perícias elegíveis por vocação:
  - Guerreiro: escolher **2** entre: Atletismo, Acrobacias, Intimidação, Intuição, Percepção, Sobrevivência, História
  - Batedor: escolher **4** entre: Acrobacias, Atletismo, Enganação, Furtividade, Intimidação, Investigação, Percepção, Performance, Persuasão, Prestidigitação
  - Caçador / Nômade: escolher **3** entre: Atletismo, Furtividade, Intuição, Investigação, Natureza, Percepção, Sobrevivência, Adestrar Animais
  - Sacerdote / Sábio: escolher **2** entre: História, Intuição, Medicina, Persuasão, Religião
  - A etapa de seleção DEVE exibir apenas as perícias elegíveis para a vocação do personagem
- **FR-004**: O sistema DEVE calcular automaticamente o bônus de proficiência com base no nível do personagem usando a fórmula padrão do D&D 5e: `Math.floor((nível - 1) / 4) + 2`.
- **FR-005**: O sistema DEVE exibir cada perícia na ficha do personagem com: nome, atributo associado, valor total calculado (modificador + proficiência se aplicável), e indicador visual de proficiência.
- **FR-006**: O sistema DEVE exibir uma seção de testes de resistência na ficha, com indicador visual de proficiência por vocação:
  - Guerreiro: FOR e CON
  - Batedor: DES e INT
  - Caçador / Nômade: FOR e DES
  - Sacerdote / Sábio: SAB e CAR
- **FR-007**: O sistema DEVE exibir tooltips ao interagir com uma perícia ou teste de resistência, detalhando a composição do bônus (modificador do atributo ± proficiência = total).
- **FR-008**: O sistema DEVE persistir as perícias selecionadas em uma nova coluna `proficiencies` (JSON) na tabela `characters`, separada do campo `skills` existente (que armazena `path_choices` e `ability_uses`). O formato será: `{ "skill_proficiencies": string[] }`.
- **FR-009**: O sistema DEVE permitir edição das perícias selecionadas na tela de edição do personagem, mantendo as mesmas regras de limite da vocação.
- **FR-013**: O sistema DEVE resetar as perícias selecionadas automaticamente se a vocação do personagem for alterada durante a edição, redirecionando o jogador para a etapa de perícias com a lista elegível da nova vocação.
- **FR-010**: O sistema DEVE ser retrocompatível com personagens criados antes da feature, tratando-os como sem perícias selecionadas (todos os valores exibidos sem bônus de proficiência).
- **FR-011**: O sistema DEVE adicionar uma coluna `level` (inteiro, default 1) na tabela `characters` do banco de dados e no tipo TypeScript `Character`, como pré-requisito para o cálculo automático do bônus de proficiência. Personagens existentes receberão nível 1 por padrão.
- **FR-012**: O sistema DEVE refatorar a lista de tipos de teste de sessão (TEST_TYPES) para ser categorizada em 3 grupos:
  - **Testes de Atributo**: FOR, DES, CON, INT, SAB, CAR — rolam 1d20 + modificador do atributo (sem proficiência)
  - **Testes de Perícia**: As 18 perícias — rolam 1d20 + modificador do atributo associado + bônus de proficiência (se o personagem for proficiente)
  - **Teste de Fé**: Mecânica especial exclusiva do RPG bíblico — rola 1d100 contra a Fé atual do personagem, sem bônus de proficiência, mantendo toda a lógica existente (penalidade, misericórdia, etc.)

### Key Entities *(include if feature involves data)*

- **Perícia (Skill Check)**: Representa uma habilidade treinável do personagem. Atributos: nome, atributo associado (FOR/DES/CON/INT/SAB/CAR), se possui proficiência (boolean). 18 perícias no total: Atletismo (FOR); Acrobacias, Furtividade, Prestidigitação (DES); Arcanismo, História, Investigação, Natureza, Religião (INT); Adestrar Animais, Intuição, Medicina, Percepção, Sobrevivência (SAB); Enganação, Intimidação, Performance, Persuasão (CAR).
- **Teste de Resistência (Saving Throw)**: Determinado pela vocação, não é selecionável. 6 testes (um por atributo).
- **Bônus de Proficiência**: Valor numérico derivado do nível do personagem. Aplicado a perícias selecionadas, testes de resistência da vocação, e rolagens de ataque com armas proficientes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos personagens criados após a implantação da feature possuem perícias selecionadas salvas no banco de dados.
- **SC-002**: O jogador consegue identificar visualmente se tem proficiência em uma perícia em menos de 2 segundos ao olhar a ficha.
- **SC-003**: Os valores totais das perícias são recalculados corretamente em menos de 1 segundo após a mudança de nível do personagem.
- **SC-004**: 100% das rolagens de teste em sessão que envolvem perícias com proficiência exibem a decomposição do bônus no resultado.
- **SC-005**: Personagens existentes (criados antes da feature) continuam funcionando sem erros ao abrir a ficha.

## Assumptions

- A lista de 18 perícias segue a adaptação do D&D 5e ao cenário bíblico. Perícias como "Arcanismo" são renomeadas contextualmente para o cenário (ex: "Conhecimento Antigo") a critério da implementação, mas a mecânica segue o padrão 5e.
- O campo `skills` (JSON) já existe na tabela `characters` e é usado para `path_choices` (progressão de trilha) e `ability_uses` (usos de habilidades). **NÃO será usado** para perícias. Uma nova coluna `proficiencies` (JSON, nullable, default null) será criada exclusivamente para perícias e saving throws.
- O campo `level` não existe atualmente na tabela `characters` nem no tipo TypeScript. Será criado como parte desta feature (migration + tipo). Personagens existentes receberão `level = 1` como default.
- O sistema de rolagem de dados já existe na plataforma (session tests) e será estendido para incluir a decomposição do bônus.
- Antecedentes (Backgrounds) do D&D não estão implementados no sistema. As perícias provêm exclusivamente da vocação na versão inicial.
- O fluxo de criação tem 8 passos atualmente; a etapa de perícias será adicionada como um novo passo, ajustando a contagem total para 9.
