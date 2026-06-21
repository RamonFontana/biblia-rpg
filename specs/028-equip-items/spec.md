# Feature Specification: Sistema de Equipamentos e Inventário

**Feature Branch**: `[028-equip-items]`

**Created**: 2026-06-19

**Status**: Draft

**Input**: User description: "I want to add now the part of equipping and unequipping the item, making references if the item is two-handed, it occupies both hands, if it's one-handed occupies one and you can equip the second hand, equipping on the head, the body and everything else. Make a validation also in the items verifying the availability of each item where it will have to be placed and making this configuration so that the items can have this option of being equipped. And also do the configuration looking at the docs of each item how much is the damage die that has to roll in case of weapons."

## Clarifications
### Session 2026-06-19
- Q: Como o equipamento funciona para inimigos e proficiência de personagens? → A: Para inimigos, mostrar apenas a arma equipada e o dado de dano (simplificado). Para personagens, a interface da ficha deve mostrar a proficiência com a arma equipada.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Equipar Arma de Uma Mão e Escudo (Priority: P1)

O jogador quer equipar uma espada curta (uma mão) e um escudo (outra mão) no seu personagem.

**Why this priority**: É o fluxo principal de combate defensivo e teste fundamental do sistema de slots de mãos.

**Independent Test**: Pode ser testado independentemente verificando se a interface permite selecionar os dois itens simultaneamente para cada slot das mãos, sem conflitos.

**Acceptance Scenarios**:

1. **Given** um personagem com slots de mãos vazios e os itens "Espada Curta" e "Escudo" no inventário, **When** ele escolhe equipar a "Espada Curta" na Mão Principal e o "Escudo" na Mão Secundária, **Then** ambos os itens ficam marcados como equipados e a CA (Classe de Armadura) e ataque são atualizados.
2. **Given** um personagem com uma arma de duas mãos equipada, **When** ele tenta equipar um escudo, **Then** a arma de duas mãos deve ser desequipada automaticamente e o escudo equipado.

---

### User Story 2 - Equipar Arma de Duas Mãos (Priority: P1)

O jogador quer equipar um Arco Longo (duas mãos) para atacar a distância.

**Why this priority**: Garante que regras de restrição de slots funcionem corretamente e bloqueiem combinações impossíveis.

**Independent Test**: Pode ser testado tentando equipar outros itens nas mãos após equipar a arma de duas mãos.

**Acceptance Scenarios**:

1. **Given** um personagem com uma espada em uma mão e um escudo na outra, **When** ele equipa um "Arco Longo" (duas mãos), **Then** a espada e o escudo são desequipados automaticamente e apenas o Arco Longo ocupa os slots das mãos.

---

### User Story 3 - Equipar Armadura Corporal e Cabeça (Priority: P2)

O jogador quer vestir uma "Cota de Escamas de Bronze" (Corpo) para melhorar sua defesa.

**Why this priority**: O sistema precisa lidar com diferentes tipos de slots (Corpo, Cabeça) independentes dos slots de mão.

**Independent Test**: Vestir armadura e verificar se a CA do personagem reflete a mudança.

**Acceptance Scenarios**:

1. **Given** um personagem sem armadura, **When** ele equipa a "Cota de Escamas", **Then** seu CA base se torna 14 + modificador de Destreza (máx +2).

---

### User Story 4 - Atualização de Dano de Arma (Priority: P2)

Ao equipar uma arma, o sistema deve associar corretamente os dados de dano da arma configurados (ex: 1d4, 1d6) para os rolamentos de combate.

**Why this priority**: As mecânicas de ataque do jogo dependem que cada arma cause o dano especificado nos documentos do jogo.

**Independent Test**: Realizar um ataque com diferentes armas equipadas e conferir os dados rolados.

**Acceptance Scenarios**:

1. **Given** uma Faca equipada, **When** um ataque é realizado, **Then** o dano base a ser rolado deve ser 1d4.
2. **Given** um Arco Longo equipado, **When** um ataque é realizado, **Then** o dano base a ser rolado deve ser 1d8.

---

### User Story 5 - Equipamento Simplificado de Inimigos e Proficiência (Priority: P2)

O mestre quer visualizar rapidamente o dano que um inimigo causa sem gerenciar slots complexos, e o jogador quer ver sua proficiência com a arma equipada.

**Why this priority**: Melhora a agilidade do mestre no combate e a clareza da ficha do jogador.

**Independent Test**: Verificar se os inimigos mostram arma e dano diretamente, e se os personagens mostram a proficiência com a arma equipada.

**Acceptance Scenarios**:

1. **Given** a ficha de um inimigo no combate, **When** visualizada, **Then** apenas a arma atual e seu dado de dano (ex: "Espada Curta (1d6)") devem ser exibidos de forma simplificada.
2. **Given** um personagem com uma arma equipada, **When** visualiza a área de combates na ficha, **Then** o sistema destaca a proficiência aplicável ao ataque com aquela arma.

---

### Edge Cases

- O que acontece quando o personagem tenta equipar um item num slot que não existe para aquele item? (Ex: Colocar uma espada na cabeça).
- Como o sistema lida com armas "Versáteis" (podem ser usadas com uma ou duas mãos)?
- O que acontece se o inventário está cheio e desequipar múltiplos itens de slots excede algum limite de peso/espaço?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST suportar slots de equipamentos definidos para os personagens: Cabeça, Corpo (Armadura), Mão Principal e Mão Secundária.
- **FR-002**: O sistema MUST classificar os itens no inventário por tipo de slot compatível (Arma 1 Mão, Arma 2 Mãos, Armadura, Escudo, Cabeça).
- **FR-003**: O sistema MUST garantir que um item de "Duas Mãos" (como Arco Longo) ocupe simultaneamente os slots Mão Principal e Mão Secundária.
- **FR-004**: O sistema MUST desequipar automaticamente itens conflitantes quando um novo item é equipado em um slot já ocupado.
- **FR-005**: O sistema MUST atualizar os atributos do personagem reativamente: Classe de Armadura (CA) com base em armaduras/escudos equipados, e ações de ataque disponíveis baseadas nas armas equipadas.
- **FR-006**: O sistema MUST usar a referência de dados oficiais do cenário para o dano de armas (`docs/itens/armas.md`). Ex: Espada Longa = 1d8 cortante.
- **FR-007**: O sistema MUST suportar propriedades de armas, como "Versátil" assumindo automaticamente o uso em 2 mãos e seu dano maior se a outra mão estiver livre; se o jogador equipar um escudo ou outra arma secundária, o sistema deve ajustar automaticamente o dano para a versão de 1 mão.
- **FR-008**: O sistema MUST aplicar as penalidades corretas das armaduras listadas em `docs/itens/armaduras.md` (como Desvantagem em Furtividade ou requisitos de Força).
- **FR-009**: O sistema MUST simplificar o inventário de Inimigos/NPCs, exibindo diretamente a arma que estão usando e o dado de dano correspondente para agilizar o combate pelo Mestre.
- **FR-010**: O sistema MUST exibir na ficha do personagem a proficiência ou o bônus de proficiência associado ao uso da arma atualmente equipada.

### Key Entities

- **ItemEquipavel**: Representa a configuração do item (dados de dano, bônus de CA, tipo de slot que ocupa, propriedades como Versátil/Duas Mãos/Acuidade).
- **SlotsDeEquipamento**: A entidade ligada ao Personagem que armazena as referências aos IDs dos itens atualmente equipados no Corpo, Cabeça e Mãos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O jogador consegue equipar e desequipar qualquer combinação válida de equipamentos com zero conflitos de slots.
- **SC-002**: Equipar um Arco Longo (arma de duas mãos) bloqueia/desocupa automaticamente o uso do slot de mão secundária para escudos e armas secundárias em 100% dos testes.
- **SC-003**: As rolagens de dano refletem os dados corretos definidos para a arma equipada (1d4, 1d6, 1d8) em 100% dos ataques realizados no sistema.
- **SC-004**: A alteração visual do equipamento na UI (botão "Equipar"/"Desequipar") é refletida instantaneamente no painel de combate do jogador.

## Assumptions

- Assumimos que o inventário atual já suporta entidades de itens gerais e precisaremos expandi-las com metadata (dano, CA, slots).
- Armas e Armaduras estarão em um catálogo fixo do sistema (seed database/json) baseado nos arquivos `.md` fornecidos.
- As penalidades (Furtividade com desvantagem) serão refletidas futuramente nas rolagens de perícia, mas os flags já precisam constar no equipamento.
