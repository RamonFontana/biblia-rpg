# Feature Specification: Efeitos de Armas e Novos Itens

**Feature Branch**: `044-weapon-effects-items`

**Created**: 2026-07-01

**Status**: Draft — Clarificado

**Input**: User description: "Quero criar mais itens de armas (martelo, clava, espada de duas mãos), sincronizar com a tabela de itens no Supabase, e criar uma nova mecânica para o Mestre atribuir efeitos/condições às armas. Quero discutir como esse efeito será de fato aplicado inspirado em D&D — se em todo golpe ou apenas em rolagens altas (d20 ≥ 18, por exemplo)."

## Clarifications

### Session 2026-07-01
- Q: Qual o gatilho padrão para ativação do efeito da arma? → **Natural 18+ no d20** (~15% de chance por ataque). Balanceado e emocionante — cria momentos épicos sem ser opressor. O Mestre pode optar por outro gatilho no futuro se necessário.
- Q: O efeito da arma é configurado na definição global do item ou por instância? → **Por instância (character_items)**. Cada arma de cada personagem pode ter efeitos diferentes. O Mestre configura individualmente. Exemplo: "esta espada foi untada com veneno de escorpião".
- Q: Quais os dados de dano e categoria das novas armas de duas mãos? → **Padrão D&D 5e**: Espada Grande de Ferro (2d6 cortante, 50 SP, Marcial, Pesada), Martelo de Guerra (2d6 concussão, 50 SP, Marcial, Pesada), Clava Grande (1d10 concussão, 5 SP, Simples, Pesada).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mestre atribui efeito a uma arma (Priority: P1)

Como Mestre, quero poder selecionar uma arma no sistema e configurar que ela pode causar uma condição (ex: Sangramento), definindo também a regra de ativação (ex: apenas em rolagens naturais ≥ 18), para criar armas especiais com justificativas mundanas (lâmina serrilhada, ponta envenenada, etc.).

**Why this priority**: É a mecânica principal solicitada. Sem ela, as novas armas seriam apenas números — o efeito é o que as diferencia e adiciona profundidade tática ao combate.

**Independent Test**: Pode ser testado abrindo o painel do Mestre, selecionando a arma "Espada Grande de Ferro" do inventário de um personagem, clicando em "Adicionar Efeito", selecionando "Sangrando" como condição e "Natural 18+" como gatilho, e verificando que a configuração é salva no banco de dados.

**Acceptance Scenarios**:

1. **Given** o Mestre está visualizando o inventário de um personagem, **When** ele seleciona uma arma e abre o menu de efeitos, **Then** ele vê um dropdown com todas as condições disponíveis no sistema (Sangrando, Envenenado, Atordoado, etc.).
2. **Given** o Mestre selecionou a condição "Sangrando" e o gatilho "Natural 18+", **When** ele confirma, **Then** a configuração é persistida no campo `effects` da relação `character_items` (ou da tabela `items`, conforme a decisão de design) e a arma exibe um badge visual indicando o efeito configurado.
3. **Given** o Mestre já atribuiu "Sangrando" a uma arma, **When** ele abre o menu de efeitos novamente, **Then** ele vê o efeito existente com a opção de editar ou remover.

---

### User Story 2 - Novos itens de armas de duas mãos no sistema (Priority: P1)

Como Mestre e jogador, quero ter acesso a novas armas de duas mãos (Espada Grande, Martelo de Guerra, Clava Grande) na loja e no inventário, sincronizadas com a tabela `items` do Supabase, para oferecer mais diversidade tática no combate corpo a corpo.

**Why this priority**: Coexiste com a P1 acima pois amplia o catálogo de armas que receberão os efeitos. É simples de implementar e agrega valor imediato.

**Independent Test**: Pode ser testado criando um personagem Guerreiro, abrindo a loja de equipamentos e verificando que as três novas armas aparecem com dados, preço e propriedade "Duas mãos / Pesada".

**Acceptance Scenarios**:

1. **Given** um jogador está na tela de criação de personagem (Merchant), **When** ele filtra por armas Marciais, **Then** as armas "Espada Grande de Ferro", "Martelo de Guerra" e "Clava Grande" aparecem na lista com seus valores corretos.
2. **Given** as novas armas estão no `ITEMS_DB`, **When** o sistema de sincronização de inventário roda (ao criar personagem ou via Mestre), **Then** as armas são inseridas na tabela `items` do Supabase com os campos `damage`, `category`, `effects` e `properties` preenchidos corretamente.
3. **Given** um personagem Guerreiro comprou a "Espada Grande de Ferro", **When** ele a equipa, **Then** ela ocupa os dois slots de mão (`mainHand` e `offHand`) e o dado de dano exibido é `2d6 cortante`.

---

### User Story 3 - Efeito da arma é aplicado durante o combate (Priority: P2)

Como jogador em combate, quero que quando eu acerto um golpe com uma arma que tem efeito configurado e o gatilho é cumprido (ex: rolagem natural ≥ 18), a condição seja automaticamente sugerida para aplicação no alvo, para acelerar o fluxo de combate.

**Why this priority**: Depende da User Story 1 (configuração do efeito) e da mecânica de combate existente. É o "fechamento do loop" mas pode ser implementada depois da configuração.

**Independent Test**: Iniciar um combate, equipar uma arma com efeito "Sangrando / Natural 18+", rolar um ataque com resultado natural de 19, e verificar que o sistema sugere/aplica "Sangrando" ao alvo.

**Acceptance Scenarios**:

1. **Given** o atacante tem uma arma com efeito "Sangrando" (gatilho: Natural 18+), **When** ele rola um ataque natural de 19 que acerta o alvo, **Then** o sistema exibe um alerta ao Mestre indicando que a condição "Sangrando" deve ser aplicada ao alvo.
2. **Given** a mesma arma, **When** o atacante rola um natural 12 que acerta, **Then** nenhum efeito adicional é sugerido (o dano é aplicado normalmente).
3. **Given** o alvo possui armadura com resistência a "Sangrando" (da feature 043), **When** o efeito da arma é acionado, **Then** a resistência da armadura é verificada antes de aplicar a condição, respeitando o Sistema de Resistência.

---

### Edge Cases

- O que acontece se o Mestre atribuir duas condições diferentes à mesma arma (ex: Sangrando E Envenenado)? → O sistema deve permitir múltiplos efeitos por arma.
- O que acontece se o Mestre editar um item que está equipado por vários personagens? → Se o efeito for na tabela `items`, afeta todos. Se for em `character_items`, afeta apenas aquele personagem.
- O que acontece com armas de arremesso (dardo, lança) — o efeito se aplica em ataques à distância? → Sim, o efeito se aplica independentemente do tipo de ataque, desde que o gatilho de rolagem seja cumprido.
- E se o personagem usar a arma no modo "Versátil" (1 mão vs 2 mãos)? → O efeito é da arma, não do modo. Aplica em ambos os modos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE adicionar pelo menos 3 novas armas de duas mãos ao `ITEMS_DB` e à tabela `items` do Supabase: Espada Grande de Ferro (2d6 cortante, Marcial, Pesada), Martelo de Guerra (2d6 concussão, Marcial, Pesada) e Clava Grande (1d10 concussão, Simples, Pesada).
- **FR-002**: O sistema DEVE sincronizar as novas armas com a tabela `items` do Supabase via migration SQL ou inserção direta, incluindo os campos `damage`, `category`, `effects`, `price` e `description`.
- **FR-003**: O sistema DEVE suportar uma nova estrutura de dados para efeitos ofensivos em armas na tabela `character_items` (por instância), contendo pelo menos: `conditionId` (ID da condição a aplicar) e `trigger` fixo em `natural_18_plus` (gatilho padrão: rolagem natural de 18 ou mais no d20).
- **FR-004**: O Mestre DEVE poder atribuir/editar/remover efeitos de condição na instância da arma de cada personagem específico, através de uma interface visual no painel de gestão de inventário.
- **FR-005**: A UI de inventário e loja DEVE exibir visualmente os efeitos atribuídos à arma (badges ou ícones com tooltip mostrando a condição e o gatilho).
- **FR-006**: Durante o combate, quando um ataque com uma arma que possui efeito é resolvido, o sistema DEVE verificar se o gatilho foi cumprido e, em caso positivo, sugerir a aplicação da condição ao Mestre (ou aplicá-la automaticamente, conforme a configuração de automação).
- **FR-007**: A documentação em `docs/itens/armas.md` DEVE ser atualizada com as novas armas e com uma seção explicando a mecânica de efeitos de armas.

### Key Entities

- **Character Item (`character_items` table)**: Receberá um novo campo para armazenar os efeitos ofensivos atribuídos pelo Mestre à instância específica da arma daquele personagem. Estrutura: `weaponEffects: [{ conditionId: string, trigger: 'natural_18_plus' }]`.
- **Item (`items` table)**: A coluna `effects` (Json) existente continua usada para dados base da arma (slot, damageDie, etc). Não armazena efeitos ofensivos — esses ficam por instância.
- **ShopItem / ITEMS_DB**: Expandido com as 3 novas armas de duas mãos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: As 3 novas armas de duas mãos estão visíveis na loja de criação de personagem e podem ser compradas e equipadas por personagens com proficiência Marcial.
- **SC-002**: As novas armas existem na tabela `items` do Supabase com todos os campos preenchidos corretamente.
- **SC-003**: O Mestre consegue atribuir um efeito de condição a uma arma com no máximo 3 cliques na interface de gestão.
- **SC-004**: Em combate, quando o gatilho de efeito é cumprido, o sistema exibe a notificação correta em menos de 1 segundo após a confirmação do ataque.
- **SC-005**: Os efeitos de arma interagem corretamente com o Sistema de Resistência de Armadura (feature 043) — se o alvo tem resistência, ela é considerada.

## Assumptions

- A tabela `items` no Supabase já existe e possui a coluna `effects` (tipo Json), conforme confirmado no `database.types.ts`.
- O sistema de condições (feature 042) já definiu a infraestrutura básica para aplicar/remover condições em personagens e participantes de combate.
- O sistema de Resistência de Armadura (feature 043) será implementado antes ou em paralelo, e o motor de combate já terá suporte para checar resistências.
- As novas armas de duas mãos são historicamente plausíveis para o período bíblico (Idade do Bronze/Ferro), sem propriedades mágicas.
- O MCP do Supabase está configurado e funcional para realizar inserções e migrações na tabela `items`.
