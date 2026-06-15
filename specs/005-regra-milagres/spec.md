# Feature Specification: Regra de Milagres e Revisão de Sacerdote

**Feature Branch**: `005-regra-milagres`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "quero melhorar essa questão que comentei sobre os milagres, revise os arquivos e defina uma regra de milagre: quando o mestre pode definir que vai acontecer o milagre, quem vai definir o valor que tem que chegar, qual dados nos temos que jogar com base na fé, quem vai ter que jogar o dado se vai ser os jogadores envolvidos ou o mestre, como o mestre defini o nível de dificulade do milagre\n\nMilagre nunca pode ser algo que o mestre defini que vai acontecer, quando surgir a oportunidade deve ser algo na sorte no dado. E sobre o sacerdote, não é algo que vai ser realacionado a milagre e sim uma questão de insentivo/benção como por exemplo @[/Users/take5dev1/projects/rpg-biblico/docs/vocacoes/sacerdote.md:L46], nesse caso não tem problema. Se houver algo que faz com que defina que o mestre ou o personagem faz um milagre, tire ou altere para que tudo que está relacionado a milagre, tenha que ser na sorte como fosse Deus escolhendo o caminho"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Regra Base de Milagres (Priority: P1)

Como jogador e como mestre, quero ter uma regra clara e baseada em rolagem de dados para determinar a ocorrência de milagres, garantindo que o Mestre não decida arbitrariamente se um milagre acontece ou não, mas que seja decidido pela mecânica de "sorte/vontade divina".

**Why this priority**: É o núcleo da requisição e garante a integridade mecânica e narrativa do sistema, mantendo a imprevisibilidade divina.

**Independent Test**: Pode ser testado através de uma simulação de jogo onde um momento de grande necessidade surge, e a regra guia perfeitamente quem rola, qual dado, e contra qual número alvo (Dificuldade).

**Acceptance Scenarios**:

1. **Given** um grupo em situação de perigo extremo, **When** um jogador ou grupo decide clamar por um milagre, **Then** a regra deve estipular que o jogador rola um dado específico com base na Fé contra uma dificuldade definida pelo Mestre, e o resultado do dado dita se o milagre ocorre.

---

### User Story 2 - Revisão da Vocação Sacerdote (Priority: P1)

Como jogador com a vocação de Sacerdote, quero que minhas habilidades sejam claramente categorizadas como bênçãos, incentivos ou ritos de fé, e não como milagres garantidos, de forma que o sistema mantenha a premissa de que milagres dependem da vontade de Deus (rolagem de dado) e não do meu controle direto.

**Why this priority**: Garante consistência com a nova regra de milagres. Nenhuma classe deve ter o poder absoluto de garantir a manifestação do sobrenatural.

**Independent Test**: Pode ser testado revisando a ficha do sacerdote. As habilidades de Nível 10 e 18 devem ter mecânicas de rolagem aleatória, e as de níveis inferiores devem ser reformuladas como "bênçãos".

**Acceptance Scenarios**:

1. **Given** um sacerdote usando Intervenção Divina Maior, **When** ele clama por intervenção, **Then** a habilidade não acontece automaticamente, exigindo uma rolagem com chance de sucesso ou falha, refletindo a Vontade de Deus.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST definir que Milagres nunca são garantidos por decisão narrativa do Mestre, mas sim por uma rolagem de dados.
- **FR-002**: O sistema MUST definir claramente quem estipula a Dificuldade do milagre (o Mestre) e como o faz.
- **FR-003**: O sistema MUST definir quais dados devem ser rolados para tentativas de milagres (ex: 1d100 ou 1d20 modificado pela Fé/Sabedoria).
- **FR-004**: O sistema MUST definir quem rola o dado na tentativa de milagre (o jogador envolvido/suplicante).
- **FR-005**: O documento da vocação Sacerdote MUST ter todas as suas habilidades que garantem milagres alteradas para exigir uma rolagem de dado com chance de falha.
- **FR-006**: O documento da vocação Sacerdote MUST renomear descrições de suas habilidades mundanas para deixá-las claras como "incentivos", "fortificação espiritual" e "bênçãos" ao invés de atos sobrenaturais garantidos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O documento de regras base e o documento de sacerdote contêm zero menções de que o Mestre decide o desfecho de um milagre sem a necessidade de um dado.
- **SC-002**: Todas as habilidades da classe Sacerdote possuem mecânicas baseadas em bênçãos/incentivos ou exigem rolagens explícitas (como o d100 de Intervenção) sem garantias de sucesso automático.
- **SC-003**: O guia rápido do mestre e as regras base explicam em passos sequenciais (1, 2, 3...) como julgar e rolar um milagre.

## Assumptions

- Assumimos que o d100 já utilizado na Intervenção Divina Menor é o padrão preferido para testar a intervenção divina, ou que um teste de Sabedoria/Fé baseado no d20 possa complementar isso.
- Assumimos que as habilidades de cura menores do sacerdote, como "Imposição de Mãos" e "Súplica Curativa", já estão enquadradas adequadamente como bênçãos e não requerem alteração de mecânica, apenas reforço narrativo em suas descrições.
