# Feature Specification: Completar Sistema Base do RPG Bíblico

**Feature Branch**: `004-completar-sistema-base`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "Ajustar e melhorar as 5 lacunas essenciais identificadas para o jogo ser simples e jogável: habilidades de vocações, milagres do sacerdote, bestiário básico, guia rápido do mestre e condições de combate faltantes."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mestre roda uma sessão completa sem consultar material externo (Priority: P1)

Um Mestre iniciante que nunca jogou RPG antes abre a documentação do RPG Bíblico e consegue conduzir uma sessão de 2-3 horas com um grupo de 4 jogadores sem precisar improvisar regras ou consultar o livro do D&D 5e.

**Why this priority**: Sem regras completas de vocação e um bestiário mínimo, o Mestre fica sem suporte para as partes mais críticas do jogo: o que cada personagem pode fazer e com quem o grupo vai lutar.

**Independent Test**: Pode ser testado entregando apenas as fichas de vocação concluídas e 5 inimigos prontos para um Mestre iniciante e pedindo que ele narre um confronto básico.

**Acceptance Scenarios**:

1. **Given** um Mestre iniciante com a documentação, **When** ele monta um encontro com inimigos, **Then** ele encontra pelo menos 5 inimigos prontos com CA, HP e ataques definidos sem precisar criar nada do zero.
2. **Given** um jogador de Guerreiro no Nível 2, **When** ele sobe de nível, **Then** existe uma habilidade nova claramente descrita para ele receber, sem ambiguidade.
3. **Given** o Sacerdote do grupo quiser ajudar um aliado ferido, **When** o jogador consulta o material, **Then** ele encontra uma lista direta de bênçãos/milagres com custo de Fé e efeito mecânico imediato.

---

### User Story 2 - Jogador cria personagem e sabe exatamente o que pode fazer (Priority: P2)

Um jogador leigo escolhe a Vocação de Batedor e consegue entender o que seu personagem pode fazer nos níveis 1, 2 e 6, sem precisar perguntar ao Mestre.

**Why this priority**: Vocações sem habilidades definidas nos marcos de progressão (níveis 2, 6, 10, 14, 18) tornam a progressão sem sentido e desmotivam os jogadores.

**Independent Test**: Pode ser testado entregando a ficha de uma Vocação completa a um leigo e pedindo que ele crie um personagem do zero e liste o que ele pode fazer no Nível 1 e no Nível 6.

**Acceptance Scenarios**:

1. **Given** um jogador leigo, **When** ele lê a ficha de Guerreiro, **Then** ele consegue identificar as habilidades dos níveis 1, 2 e 6 sem ambiguidade em menos de 5 minutos.
2. **Given** um personagem de Sacerdote no Nível 6, **When** o jogador consulta a lista de milagres, **Then** ele sabe exatamente quais bênçãos estão disponíveis e quanto custam de Fé.
3. **Given** um personagem de Caçador, **When** ele tenta usar uma habilidade de combate a distância, **Then** existe uma regra clara definida na ficha da vocação que ele pode aplicar.

---

### User Story 3 - Mestre arbitra condições de combate sem discussão (Priority: P3)

Durante um combate, uma situação de condição especial acontece (um personagem cai, um inimigo tenta agarrar alguém) e o Mestre resolve a situação imediatamente consultando o documento de regras.

**Why this priority**: Discussões sobre regras quebram o ritmo da sessão. Um conjunto mínimo de condições bem definidas elimina a maioria das dúvidas sem tornar o sistema pesado.

**Independent Test**: Pode ser testado simulando 3 situações de combate incomuns com um Mestre iniciante e verificando se ele resolve corretamente sem consultar material externo ao projeto.

**Acceptance Scenarios**:

1. **Given** um personagem que é derrubado por um ataque, **When** o Mestre consulta as condições, **Then** ele encontra a regra de "Caído" com efeito mecânico claro (vantagem para atacantes em corpo a corpo).
2. **Given** um inimigo tenta agarrar um personagem, **When** o Mestre olha as condições, **Then** existe a condição "Agarrado" com regra simples de movimento.
3. **Given** um personagem fica às cegas em uma caverna, **When** o Mestre consulta as condições, **Then** ele encontra "Cego" com penalidades diretas a aplicar.

---

### User Story 4 - Mestre conduz narrativa fiel ao cenário bíblico com orientações claras (Priority: P4)

Um Mestre usa o Guia Rápido do Mestre para saber quando chamar testes de Fé, como recompensar o grupo e ter ideias básicas de aventuras bíblicas sem precisar inventar tudo do zero.

**Why this priority**: Sem orientação narrativa mínima, o Mestre pode rodar combates mecanicamente mas vai lutar para manter o clima e a fidelidade temática do jogo.

**Independent Test**: Pode ser testado pedindo que um Mestre leia apenas o Guia Rápido e narre uma cena de tentação de um personagem com Barra de Fé em risco.

**Acceptance Scenarios**:

1. **Given** um jogador cujo personagem tem uma Tentação de "Cobiça", **When** o grupo encontra tesouro abandonado, **Then** o Guia instrui claramente o Mestre a solicitar um teste e como lidar com o resultado.
2. **Given** o grupo completa uma missão importante, **When** o Mestre quer recompensar os jogadores, **Then** o Guia oferece uma tabela simples de recompensas (moedas, itens) calibrada para o cenário.
3. **Given** um Mestre sem ideias de aventura, **When** ele consulta o Guia, **Then** ele encontra pelo menos 5 ganchos de aventura prontos para usar ambientados no período bíblico.

---

### Edge Cases

- O que acontece quando o Sacerdote tenta usar um milagre mas a Barra de Fé do grupo está abaixo de 10? (Ruptura — milagres devem falhar automaticamente, já coberto nas regras base, mas precisa estar referenciado na lista de milagres.)
- O que acontece quando um inimigo do bestiário encontra um personagem com Fé acima de 70 (estado Inabalável)? (A Inspiração do estado Inabalável precisa ter efeito definido em combate.)
- O que acontece se um jogador quiser usar uma condição que não está listada? (O documento deve indicar que condições não listadas seguem o senso comum do Mestre, sem consulta externa obrigatória.)

---

## Requirements *(mandatory)*

### Functional Requirements

**Habilidades de Vocação (Progressão Completa)**

- **FR-001**: Cada uma das 4 vocações (Guerreiro, Batedor, Caçador, Sacerdote) DEVE ter habilidades definidas para os marcos de nível 1, 2, 6, 10, 14 e 18, com nome, descrição e efeito mecânico direto.
- **FR-002**: Cada habilidade DEVE ser descrita em no máximo 3 linhas, sem jargão que exija consulta externa.
- **FR-003**: As habilidades de vocação DEVEM ser compatíveis com as passivas de tribo existentes, sem contradições mecânicas.

**Lista de Milagres / Bênçãos do Sacerdote**

- **FR-004**: A ficha do Sacerdote DEVE incluir uma lista de 8 a 12 Bênçãos/Milagres disponíveis, cada um com: nome temático bíblico, custo em Fé, efeito mecânico direto (ex: cura X HP, remove condição Y) e nível mínimo para uso.
- **FR-005**: Nenhum milagre DEVE ter efeito comparável a magias arcanas de D&D; todos os efeitos DEVEM ser compatíveis com o cenário sobrenatural bíblico (cura, expulsão, proteção, guia espiritual).
- **FR-006**: A lista DEVE indicar claramente que milagres falham automaticamente quando a Barra de Fé do Sacerdote está em Ruptura (0 pontos).

**Bestiário Básico (Inimigos Prontos)**

- **FR-007**: O bestiário DEVE conter no mínimo 10 inimigos prontos para uso imediato, cobrindo as 3 categorias já existentes: humanos (pelo menos 4), animais (pelo menos 2) e ameaças sobrenaturais (pelo menos 2 gigantes/endemoniados).
- **FR-008**: Cada ficha de inimigo DEVE conter: nome, Nível de Desafio (ND), HP, CA, Deslocamento, atributos relevantes (FOR/DES/CON), ataques com dano, habilidades especiais simples (máx. 2) e uma descrição de contexto de 1 linha.
- **FR-009**: Os inimigos DEVEM ser balanceados para grupos de 4 personagens, com faixa de ND claramente indicando para qual nível de grupo são adequados.

**Guia Rápido do Mestre**

- **FR-010**: O Guia DEVE caber em no máximo 2 páginas (arquivo Markdown de até 150 linhas) para ser usado como referência rápida na mesa.
- **FR-011**: O Guia DEVE incluir: quando solicitar testes de Fé (gatilhos narrativos), tabela simples de recompensas por ND, pelo menos 5 ganchos de aventura bíblicos prontos e a regra de ouro do Mestre para o cenário (como arbitrar o sobrenatural).
- **FR-012**: O Guia DEVE explicar como usar as Fortalezas e Tentações dos jogadores para criar tensão dramática sem forçar ou punir injustamente.

**Condições de Combate Faltantes**

- **FR-013**: O documento `regras-base.md` DEVE ser expandido com as 3 condições faltantes mais comuns em combate: **Caído** (Prone), **Agarrado** (Grappled) e **Cego** (Blinded).
- **FR-014**: Cada condição DEVE ter efeito mecânico descrito em 1 a 2 linhas, no mesmo formato das condições existentes.
- **FR-015**: O documento DEVE incluir uma nota indicando que situações não cobertas são resolvidas pelo bom senso do Mestre, evitando paralisia nas decisões.

### Key Entities

- **Vocação**: Classe do personagem com marcos de habilidade nos níveis 1, 2, 6, 10, 14, 18. Atributos: nome, dado de vida, habilidades por nível.
- **Bênção/Milagre**: Poder sobrenatural bíblico exclusivo do Sacerdote. Atributos: nome, custo de Fé, efeito mecânico, nível mínimo.
- **Inimigo (Stat Block)**: Perfil mecânico de criatura/pessoa para o Mestre usar. Atributos: nome, ND, HP, CA, ataques, habilidades especiais.
- **Condição**: Estado temporário aplicado a personagens ou inimigos em combate. Atributos: nome, gatilho, efeito mecânico, como encerrar.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um Mestre iniciante consegue conduzir um encontro de combate completo consultando apenas a documentação do projeto, sem improviso em mais de 90% das situações de regra.
- **SC-002**: Um jogador leigo consegue criar um personagem e entender suas habilidades nos Níveis 1 e 2 em menos de 10 minutos usando apenas os documentos de vocação.
- **SC-003**: Todas as 4 vocações possuem habilidades completas e sem lacunas para os 6 marcos de nível (1, 2, 6, 10, 14, 18).
- **SC-004**: O bestiário contém no mínimo 10 fichas de inimigos utilizáveis sem modificação, cobrindo os 3 pilares de ameaça do cenário (humanos, naturais, sobrenaturais).
- **SC-005**: O Guia Rápido do Mestre tem no máximo 2 páginas e pode ser lido completamente em menos de 5 minutos.
- **SC-006**: O conjunto total das condições de combate no `regras-base.md` cobre as 7 situações mais frequentes em mesa sem necessidade de consulta externa.

---

## Assumptions

- O jogo continuará usando o sistema D&D 5e como referência silenciosa — condições como "Caído", "Agarrado" e "Cego" têm efeitos inspirados no D&D 5e mas simplificados e sem referência explícita à marca.
- Os milagres do Sacerdote NÃO são magias arcanas; qualquer efeito mecânico deve ter paralelo direto com eventos bíblicos (cura, proteção divina, expulsão de demônios).
- As habilidades de vocação para os níveis 10, 14 e 18 podem ser mais simples (melhoria de habilidades existentes) dado que sessões de alto nível são menos comuns em grupos iniciantes.
- O Guia Rápido do Mestre foca em narrativa e arbitragem simples; regras avançadas de campanha (construção de fortalezas, aliança entre tribos) estão fora do escopo desta feature.
- O sistema de Fé já está definido e não será alterado; apenas referenciado nas fichas de Sacerdote e no Guia do Mestre.
- Multiclasse continua proibida e não será considerada nas habilidades de vocação.
