# Feature Specification: Sistema de Habilidades com Uso e Recarga

**Feature Branch**: `040-ability-usage-system`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Deixar as habilidades mais reais com o jogo, mostrando até o dado que pode se rolar para algum feito, ter também um botão de utilização com uma unidade de medida para saber quando vai poder usar a habilidade novamente. As unidades pode ser: uma quantidade de vezes para usar por dia, uma quantidade de vezes para usar por combate (só pode usar dentro do combate), e/ou certas habilidades podem ser recuperadas de forma parcial quando faz um descanso curto ou descanso longo recupera ela por inteiro, ou uma habilidade só pode ser recuperada no descanso curto ou longo. As habilidades não precisam afetar o sistema no resultado delas (não aplicam efeitos automaticamente), mas o sistema precisa saber quando estão disponíveis e ter um botão para utilizar."

## Clarifications

### Session 2026-06-26

- Q: Qual o escopo da atualização da documentação? As tribos e vocações têm formatos inconsistentes — algumas com dados de rolagem/uso claros (Judá, Gade, Sacerdote) e outras sem especificar tipo de ação, dado ou frequência (Simeão, Issacar, Benjamim, Guerreiro, Batedor, Caçador). → A: Padronizar TODAS as 13 tribos e 4 vocações com tabela de habilidades no formato do Sacerdote (Nome | Nível Min. | Tipo Ação | Dado | Usos/Recarga | Efeito), garantindo que o sistema possa consumir os dados de forma confiável.
- Q: A tabela `characters` não possui campo para indicar o caminho de especialização (A ou B) escolhido pelo personagem. Como persistir essa escolha, que determina as habilidades a partir do nível 4? → A: Persistir as escolhas de caminho **por nível** dentro do jsonb `skills` (ex: `{ "path_choices": { "4": "A", "8": "B", "12": "A" } }`), pois o jogador pode escolher caminhos diferentes em cada nível de progressão da tribo, criando builds híbridos. O campo `tribe_path` simples foi descartado.
- Q: Onde persistir o estado de usos das habilidades? A coluna `skills` (jsonb) já existe na tabela `characters` mas está vazia em todos os personagens. → A: Reutilizar a coluna `skills` (jsonb) existente para armazenar o estado de usos como mapa `{ "ability_key": { "current_uses": N, "max_uses": M } }`, evitando criar tabela/migração nova.
- Q: As vocações também oferecem escolhas pontuais por nível (ex: Guerreiro escolhe entre Defesa/Duelo/Proteção no nível 2, Caçador entre Arquearia/Duas Armas). Como persistir? → A: Persistir escolhas de vocação também no jsonb `skills` junto com os usos (ex: `{ "vocation_choices": { "2": "defense", "10": "beast_companion" } }`). Os caminhos de tribo e vocação são independentes e ambos armazenados por nível, permitindo builds híbridos.
- Q: Como o jogador fará as escolhas de caminho na UI (nível 2, 4, 8, etc)? A ficha atual não tem isso. → A: A interface para tomada de decisão de caminhos ficará para uma feature futura (provavelmente na listagem de personagens). Para esta feature, o foco será no uso e recarga das habilidades (focando em habilidades de Nível 1 que não exigem escolhas), mas a estrutura de dados (jsonb `skills`) já será preparada para receber os caminhos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar Habilidades com Detalhes de RPG (Priority: P1)

O jogador abre sua ficha de personagem durante uma sessão ativa e vê suas habilidades de Tribo e Vocação com informações detalhadas de jogo: o dado associado (ex: "2d8 + SAB"), o tipo de ação necessária (Ação, Ação Bônus, Reação, Passiva), e o estado atual de disponibilidade da habilidade (disponível ou esgotada).

**Why this priority**: Esta é a base de todo o sistema. Sem cards informativos ricos, as demais funcionalidades de uso e recarga não fazem sentido visualmente.

**Independent Test**: Pode ser testado abrindo a ficha de um personagem da Tribo de Judá com Vocação Guerreiro e verificando que as habilidades de ambas as fontes aparecem com dados de rolagem, tipo de ação e indicador de disponibilidade.

**Acceptance Scenarios**:

1. **Given** um personagem de nível 2 da Tribo de Judá com Vocação Guerreiro, **When** o jogador abre sua ficha, **Then** vê as habilidades "Aura de Autoridade" (Passiva, sem dado), "Resistência Sólida" (Passiva, sem dado), "Postura de Batalha" (Passiva, sem dado) e "Surto de Ação" (Ação, 1/Descanso Curto) listadas com ícones e informação de dado/uso.
2. **Given** uma habilidade com dado associado (ex: "Conhecimento da Saúde" da Tribo de Judá - Médico), **When** o jogador visualiza a habilidade, **Then** vê claramente o dado "2d8 + SAB" exibido no card.
3. **Given** uma habilidade puramente passiva (ex: "Muralha Humana" de Gade), **When** o jogador visualiza, **Then** o card mostra o rótulo "Passiva" e não exibe botão de utilização.

---

### User Story 2 - Usar Habilidade com Botão de Utilização (Priority: P1)

O jogador quer usar uma habilidade ativa durante o combate ou sessão. Ele clica no botão "Usar" da habilidade, o sistema decrementa o contador de usos restantes, e o botão fica desabilitado quando não há mais usos disponíveis.

**Why this priority**: O botão de uso é a mecânica central que dá controle tangível ao jogador e ao Mestre sobre o gasto de recursos do personagem.

**Independent Test**: Pode ser testado usando a habilidade "Surto de Ação" (1/Descanso Curto) do Guerreiro: clicar em "Usar", verificar que o contador vai de 1/1 para 0/1, e que o botão fica desabilitado.

**Acceptance Scenarios**:

1. **Given** uma habilidade com 1 uso restante (ex: "Surto de Ação"), **When** o jogador clica em "Usar", **Then** o uso restante diminui para 0 e o botão fica visualmente desabilitado com estilo de "esgotado".
2. **Given** uma habilidade com 0 usos restantes, **When** o jogador tenta clicar no botão, **Then** o botão está desabilitado e nada acontece.
3. **Given** uma habilidade marcada como "uso em combate" (ex: "Hafekhadah" de Gade — 1x/luta), **When** o personagem NÃO está em combate, **Then** o botão "Usar" não aparece ou está desabilitado com tooltip "Apenas em combate".

---

### User Story 3 - Recarregar Habilidades por Descanso (Priority: P2)

Quando o Mestre aciona um Descanso Curto ou Descanso Longo para o grupo, as habilidades dos personagens são automaticamente recarregadas conforme suas regras de recuperação individuais.

**Why this priority**: É o complemento natural do sistema de uso — sem recarga, as habilidades ficariam permanentemente esgotadas.

**Independent Test**: Pode ser testado fazendo um Descanso Curto e verificando que "Surto de Ação" (1/Descanso Curto) é recarregado, mas "Determinação" (1/Descanso Longo) permanece esgotada.

**Acceptance Scenarios**:

1. **Given** o Guerreiro usou "Surto de Ação" (recarga: descanso curto), **When** o Mestre aciona um Descanso Curto, **Then** os usos de "Surto de Ação" são restaurados para o máximo (1/1).
2. **Given** o Guerreiro usou "Determinação" (recarga: descanso longo), **When** o Mestre aciona um Descanso Curto, **Then** "Determinação" permanece esgotada (0/1).
3. **Given** o Guerreiro usou ambas as habilidades acima, **When** o Mestre aciona um Descanso Longo, **Then** AMBAS são restauradas ao máximo.
4. **Given** uma habilidade com uso diário (ex: "Merape Miadi" — 1x/dia), **When** um Descanso Longo ocorre, **Then** seus usos são restaurados (pois o Descanso Longo reseta usos diários).

---

### User Story 4 - Reset de Habilidades por Combate (Priority: P2)

Habilidades com recarga "por combate" (ex: "Hafekhadah" de Gade — 1x/luta, "Estandarte de Judá" — 1x/combate) são automaticamente recarregadas quando um novo combate é iniciado pelo Mestre.

**Why this priority**: Garante que habilidades limitadas a combate estejam sempre disponíveis quando um novo encontro começa.

**Independent Test**: Pode ser testado usando "Hafekhadah" em um combate, encerrando o combate, e verificando que ao iniciar um novo combate a habilidade está disponível novamente.

**Acceptance Scenarios**:

1. **Given** "Hafekhadah" foi usada no combate atual (0/1), **When** o combate é encerrado e um novo combate é iniciado, **Then** "Hafekhadah" é restaurada para 1/1.
2. **Given** "Hafekhadah" não foi usada no combate atual (1/1), **When** o combate é encerrado e um novo combate é iniciado, **Then** "Hafekhadah" permanece 1/1 (nenhuma mudança visível).

---

### User Story 5 - Mestre Visualiza e Gerencia Habilidades do Jogador (Priority: P3)

O Mestre pode ver o estado atual das habilidades de cada personagem (usos restantes) ao abrir a ficha de um jogador durante a sessão, podendo também restaurar ou gastar usos manualmente como override.

**Why this priority**: Dá ao Mestre controle e visibilidade total sobre o estado dos personagens, essencial para arbitrar situações fora do padrão.

**Independent Test**: O Mestre abre a ficha de um personagem, vê o estado de usos, e usa um botão de admin para restaurar uma habilidade manualmente.

**Acceptance Scenarios**:

1. **Given** o Mestre abre a ficha de um jogador que tem habilidades esgotadas, **When** visualiza a seção de habilidades, **Then** vê claramente quais estão disponíveis e quais estão esgotadas com seus contadores.
2. **Given** o Mestre precisa restaurar uma habilidade por decisão narrativa, **When** clica em "Restaurar" na habilidade esgotada, **Then** os usos são restaurados ao máximo.

---

### Edge Cases

- O que acontece quando o personagem sobe de nível e ganha novas habilidades? Os usos iniciais devem estar no máximo.
- Como o sistema lida com habilidades que têm recarga parcial no descanso curto? (Ex: recupera metade dos usos arredondado para cima).
- O que acontece se o Mestre encerra um combate e imediatamente inicia outro antes de um descanso? As habilidades "por combate" resetam, mas "por dia" e "por descanso" não.
- Como habilidades passivas são diferenciadas visualmente de ativas? Passivas não têm botão de uso nem contador.
- O que acontece se o Mestre faz Descanso Longo/Curto quando não há habilidades gastas? Nenhum efeito visível, sem erros.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir cada habilidade de Tribo e Vocação em um card individual contendo: nome, descrição, dado de rolagem (se aplicável), tipo de ação (Passiva, Ação, Ação Bônus, Reação) e estado de disponibilidade.
- **FR-002**: O sistema DEVE mostrar o dado de rolagem associado à habilidade quando aplicável (ex: "2d8 + SAB", "1d10 + Nível"), formatado de maneira legível e visualmente destacado no card.
- **FR-003**: Cada habilidade ativa (não passiva) DEVE ter um botão "Usar" que decrementa o contador de usos restantes quando clicado.
- **FR-004**: O botão "Usar" DEVE ficar desabilitado quando a habilidade não tem usos restantes (0/máximo).
- **FR-005**: Cada habilidade ativa DEVE exibir um indicador visual de usos restantes no formato "X/Y" (atual/máximo), junto com a unidade de recarga (ex: "1/1 por descanso curto", "1/1 por combate", "1/1 por dia").
- **FR-006**: O sistema DEVE suportar as seguintes unidades de recarga para habilidades:
  - **Por dia**: Restaurada no descanso longo ou início de nova sessão.
  - **Por combate**: Restaurada quando um novo combate é iniciado; o botão de uso só aparece/é habilitado dentro de um combate ativo.
  - **Por descanso curto**: Restaurada em descanso curto ou longo.
  - **Por descanso longo**: Restaurada apenas em descanso longo.
  - **Por semana**: Restaurada semanalmente (para habilidades supremas de nível 20).
  - **Passiva/Ilimitada**: Sempre ativa, sem botão de uso.
- **FR-007**: O sistema DEVE restaurar automaticamente os usos das habilidades quando o evento de recarga correspondente ocorre (descanso curto, descanso longo, novo combate, novo dia/sessão).
- **FR-008**: O sistema DEVE impedir o uso de habilidades marcadas como "por combate" quando o personagem não está em um combate ativo.
- **FR-009**: O Mestre DEVE poder visualizar o estado de usos das habilidades de qualquer personagem na sessão.
- **FR-010**: O Mestre DEVE poder restaurar ou gastar usos de habilidades manualmente como override administrativo.
- **FR-011**: O sistema NÃO DEVE aplicar efeitos mecânicos automaticamente (dano, cura, buffs) ao usar uma habilidade — o uso serve apenas como controle de recurso.
- **FR-012**: Habilidades passivas DEVEM ser exibidas com um estilo visual distinto (sem botão de uso, sem contador) para diferenciação clara.
- **FR-013**: O estado de usos das habilidades DEVE ser persistido na coluna `skills` (jsonb) já existente na tabela `characters`, no formato `{ "ability_key": { "current_uses": N, "max_uses": M } }`, e DEVE sobreviver entre recarregamentos de página e entre sessões.
- **FR-014**: Ao subir de nível e ganhar novas habilidades, os usos iniciais DEVEM ser automaticamente definidos para o valor máximo.
- **FR-015**: A documentação de TODAS as 13 tribos (`docs/tribos/*.md`) e 4 vocações (`docs/vocacoes/*.md`) DEVE ser padronizada com tabela de habilidades no formato: Nome | Nível Min. | Tipo Ação | Dado de Rolagem | Usos/Recarga | Efeito — seguindo o modelo já existente na vocação Sacerdote (`docs/vocacoes/sacerdote.md`).
- **FR-016**: O sistema DEVE persistir as escolhas de caminho de especialização da tribo **por nível** dentro do campo `skills` (jsonb), permitindo que o jogador escolha caminhos diferentes em cada nível de progressão (ex: Caminho A no nível 4, Caminho B no nível 8), criando builds híbridos.
- **FR-017**: O sistema DEVE exibir apenas as habilidades correspondentes aos caminhos escolhidos pelo personagem em cada nível, filtrando com base nas escolhas persistidas no jsonb `skills`.
- **FR-018**: O sistema DEVE persistir as escolhas de especialização da vocação (ex: estilo de luta, foco de combate) também no campo `skills` (jsonb), de forma independente das escolhas de tribo.

- **FR-019**: O escopo da interface de usuário DESTA feature NÃO inclui a criação de telas para seleção de caminhos. O sistema deve estar preparado no banco, mas focar em exibir e permitir o uso de habilidades (principalmente de Nível 1) na tela de combate/sessão.

### Key Entities

- **Habilidade (Ability Definition)**: Definição estática de uma habilidade contendo nome, descrição, dado de rolagem, tipo de ação, unidade de recarga, número máximo de usos, nível requerido, caminho (A, B, ou ambos) e fonte (Tribo ou Vocação).
- **Uso de Habilidade (Ability Usage)**: Estado dinâmico por personagem contendo referência à habilidade, usos atuais restantes, e timestamp do último uso.
- **Evento de Recarga (Recharge Event)**: Ação do sistema (descanso curto, descanso longo, início de combate, novo dia) que dispara a restauração de usos das habilidades conforme suas regras de recarga.
- **Caminho de Especialização (Path Choices)**: Escolhas persistidas por nível no jsonb `skills`, separadas por fonte: `path_choices` para tribo (ex: `{ "4": "A", "8": "B" }`) e `vocation_choices` para vocação (ex: `{ "2": "defense" }`). Permite builds híbridos mesclando caminhos diferentes em cada nível de progressão.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Jogadores conseguem visualizar todas as habilidades de seu personagem com dados de rolagem, tipo de ação e estado de disponibilidade em menos de 3 segundos ao abrir a ficha.
- **SC-002**: O ato de usar uma habilidade (clicar no botão) é refletido em tempo real para o próprio jogador e para o Mestre em menos de 2 segundos.
- **SC-003**: 100% das habilidades documentadas nas fichas de Tribos e Vocações existentes são representadas no sistema com dados de rolagem e unidades de recarga corretos.
- **SC-004**: Após um descanso curto ou longo acionado pelo Mestre, as habilidades corretas são restauradas automaticamente sem intervenção manual em 100% dos casos.
- **SC-005**: O estado de usos de habilidades é corretamente persistido — ao recarregar a página, os valores de uso permanecem idênticos.

## Assumptions

- O catálogo de habilidades (dados de rolagem, tipo de ação, unidade de recarga) será definido como dados estáticos no frontend baseando-se nos documentos de Tribos (`docs/tribos/*.md`) e Vocações (`docs/vocacoes/*.md`). Estes documentos serão padronizados como parte desta feature antes da implementação do sistema, usando o formato tabular do Sacerdote como modelo.
- O estado de uso (usos restantes por personagem) será persistido na coluna `skills` (jsonb) já existente na tabela `characters`, reutilizando-a com o formato de mapa `{ "ability_key": { "current_uses": N, "max_uses": M } }`. Não será necessário criar tabela nova.
- Os mecanismos de descanso existentes (SessionRestControls) já funcionam e serão estendidos para disparar a recarga de habilidades.
- O sistema de combate existente (combatStore) já gerencia o estado de combate ativo e será usado para determinar se habilidades "por combate" podem ser ativadas.
- As escolhas de caminho de especialização (Caminho A ou B nas tribos, e escolhas de vocação) serão persistidas **por nível** dentro do jsonb `skills`, permitindo builds híbridos. A interface visual para realizar essas escolhas será implementada em uma feature futura. Esta feature focará no uso das habilidades (nível 1).
- Habilidades com recarga "por semana" (nível 20) não necessitam de controle automático de tempo real — o Mestre gerenciará manualmente quando uma semana de jogo se passa.
