# Feature Specification: Finalização das Regras Base do RPG Bíblico

**Feature Branch**: `001-regras-base-finalizacao`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "Melhorar as regras base do que já foi criado e planejar os próximos passos para finalizar as regras do jogo"

## Clarifications

### Session 2026-06-14

- Q: Qual método de geração de atributos usar? → A: O jogador escolhe entre **Standard Array** (15, 14, 13, 12, 10, 8) ou **4d6 descarta o menor** (rola 4d6, remove o dado mais baixo, repete 6 vezes). Ambos são métodos oficiais; a escolha fica com o jogador na criação do personagem.
- Q: As Classes (Vocações) têm progressão própria? → A: **Sim, progressão simples.** Cada classe (Guerreiro, Batedor, Caçador/Nômade, Sacerdote/Sábio) ganha habilidades passivas/ativas em marcos de nível (2, 6, 10, 14, 18), complementando a progressão tribal (1, 4, 8, 12, 16, 20). Isso garante que dois personagens da mesma tribo com classes diferentes joguem de forma distinta.
- Q: Qual o valor inicial de Fé na criação? → A: **Fé 50** (faixa "Comum") para todas as tribos, exceto **Levi que começa com Fé 60** (ainda "Comum", mas com vantagem espiritual temática por ser a tribo sacerdotal).
- Q: José é 1 tribo ou 2 tribos (Efraim/Manassés)? → A: **2 tribos separadas.** Efraim e Manassés têm fichas próprias, cada uma com 2 passivas e 2 caminhos. Total do sistema: **13 tribos** (7 existentes + 6 a criar: Dã, Naftali, Aser, Zebulom, Efraim, Manassés).
- Q: Terminologia canônica — "Classe" ou "Vocação"? → A: **"Vocação"** é o termo oficial do sistema. Primeira menção em cada documento usa "Vocação (classe no D&D)" para referência. Todas as ocorrências subsequentes usam apenas "Vocação".

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Game Designer revisa e expande as Regras Base (Priority: P1)

O Game Designer (autor do RPG) precisa revisar o documento `regras-base.md` existente para identificar lacunas mecânicas, adicionar seções faltantes (combate, criação de personagem, progressão de nível, equipamentos) e garantir que cada regra é clara, testável em mesa e consistente com a Constituição do projeto.

**Why this priority**: Sem regras base completas e sólidas, nenhuma sessão de jogo pode ser executada de forma justa. É o alicerce de tudo.

**Independent Test**: Pode ser validado ao simular uma sessão zero — se um Mestre consegue criar personagens e resolver situações usando apenas o `regras-base.md`, está funcional.

**Acceptance Scenarios**:

1. **Given** o documento `regras-base.md` existente, **When** o Game Designer o revisa, **Then** todas as seções obrigatórias estão presentes: Atributos, CA, Vocações, Sistema de Fé, Combate, Criação de Personagem, Progressão de Nível, e Equipamentos.
2. **Given** uma regra existente (ex: Sistema de Fé), **When** o Game Designer a revisa, **Then** ela possui valores numéricos concretos, condições de ativação claras e exemplos de uso onde necessário.
3. **Given** as regras base revisadas, **When** comparadas contra a Constituição do projeto, **Then** nenhuma regra viola os 6 princípios fundamentais (Sem Magia Arcana, Sem Itens Mágicos, Fé como Núcleo, Tribos como Raças, Regra de Levi, Documentação como Verdade).

---

### User Story 2 — Game Designer completa as 6 tribos faltantes (Priority: P2)

Atualmente existem 7 de 13 tribos documentadas (Judá, Levi, Gade, Benjamim, Rúben, Issacar, Simeão). O Game Designer precisa criar as fichas das 6 tribos restantes — **Dã**, **Naftali**, **Aser**, **Zebulom**, **Efraim** e **Manassés** — seguindo o mesmo padrão de progressão (Nível 1 → 4 → 8 → 12 → 16 → 20) com 2 passivas iniciais e 2 caminhos de especialização. Efraim e Manassés são tratadas como tribos independentes (não como sub-opções de José).

**Why this priority**: As tribos são a identidade racial do sistema. Sem as 13, o jogo está incompleto e jogadores têm opções limitadas.

**Independent Test**: Cada tribo pode ser testada independentemente — basta criar um personagem de nível 1 daquela tribo e verificar que as passivas funcionam sem conflito com as existentes.

**Acceptance Scenarios**:

1. **Given** as 7 tribos documentadas, **When** as 6 novas são criadas, **Then** o `README.md` de tribos lista todas as 13 com links corretos.
2. **Given** uma nova tribo (ex: Dã), **When** sua ficha é escrita, **Then** ela segue exatamente a estrutura: Passivas Nível 1, Caminho A/B no Nível 4, Aprimoramentos 8/12/16, Habilidade Suprema 20.
3. **Given** todas as 13 tribos, **When** comparadas entre si, **Then** não há sobreposição direta de nicho (cada tribo tem identidade mecânica distinta).

---

### User Story 3 — Game Designer define o Sistema de Combate (Priority: P2)

O `regras-base.md` menciona classes e atributos mas não define as mecânicas de combate: iniciativa, turnos, ações por turno, tipos de ataque, dano, descansos e condições (atordoado, sangrando, etc.). O Game Designer precisa documentar um sistema de combate completo, adaptado do D&D 5e mas sem magia arcana.

**Why this priority**: O combate é a interação mecânica mais frequente em sessões de RPG. Sem ele formalizado, cada Mestre improvisa diferente.

**Independent Test**: Simular um encontro de combate (3 PJs vs. 5 inimigos) usando apenas as regras documentadas, sem precisar consultar o D&D 5e original.

**Acceptance Scenarios**:

1. **Given** dois personagens em combate, **When** um turno inicia, **Then** as regras definem claramente: ordem de iniciativa, ações disponíveis (Ação, Ação Bônus, Reação, Movimento), e como resolver ataques.
2. **Given** um combate em curso, **When** um personagem recebe dano, **Then** as regras cobrem: cálculo de dano, condições aplicáveis, queda a 0 HP e testes de morte.
3. **Given** o fim de um combate, **When** o grupo descansa, **Then** as regras definem Descanso Curto vs. Descanso Longo com efeitos claros de recuperação (HP, Fé, habilidades).

---

### User Story 4 — Game Designer cria o Guia de Criação de Personagem (Priority: P3)

Não existe um fluxo passo-a-passo para criar um personagem. O Game Designer precisa documentar o processo completo: escolher tribo, definir atributos (método de geração), escolher vocação, definir Fortaleza e Tentação, calcular HP inicial, CA, e recursos (equipamento inicial, Fé inicial).

**Why this priority**: Novos jogadores precisam de um guia claro; sem ele, a "sessão zero" é caótica.

**Independent Test**: Um jogador novato consegue criar um personagem completo seguindo apenas o guia, sem ajuda externa.

**Acceptance Scenarios**:

1. **Given** um novo jogador, **When** ele segue o guia de criação, **Then** em no máximo 6 passos ele tem um personagem jogável com todos os campos preenchidos.
2. **Given** um jogador que escolhe Levi, **When** ele chega na etapa de vocação, **Then** o guia impõe automaticamente a Regra de Levi (Sacerdote/Sábio obrigatório).
3. **Given** um personagem criado, **When** validado contra as regras, **Then** todos os valores (HP, CA, Fé, Fortaleza, Tentação) estão dentro dos limites definidos.

---

### User Story 5 — Game Designer documenta Equipamentos da Época (Priority: P3)

O sistema proíbe itens mágicos mas não lista os equipamentos permitidos. O Game Designer precisa criar uma lista de armas (espadas de bronze, fundas, lanças, arcos), armaduras (couro, bronze, escudos) e itens comuns (cordas, odres, tochas) com valores de dano, CA e preço, coerentes com a Idade do Bronze/Ferro.

**Why this priority**: Sem lista de equipamentos, os jogadores não sabem o que podem ter e Mestres inventam valores arbitrários.

**Independent Test**: Um jogador pode equipar seu personagem consultando apenas a lista de equipamentos, e os valores de dano/CA são consistentes com o sistema de combate.

**Acceptance Scenarios**:

1. **Given** a lista de equipamentos, **When** um jogador procura uma arma, **Then** encontra: nome, tipo de dano, dado de dano, propriedades e preço (em moeda da época).
2. **Given** a lista de armaduras, **When** um jogador escolhe uma, **Then** a CA resultante está de acordo com as regras de CA do `regras-base.md`.
3. **Given** todos os equipamentos, **When** verificados contra a Constituição, **Then** nenhum concede bônus sobrenaturais e todos usam materiais da Idade do Bronze/Ferro.

---

### Edge Cases

- O que acontece quando um jogador quer uma tribo que ainda não está documentada? → O sistema deve listar as 13 tribos disponíveis e indicar quais estão prontas.
- Como resolver conflitos entre passivas tribais e habilidades de vocação? → As regras devem definir precedência (tribal > vocação ou vice-versa).
- O que acontece quando um personagem de Fé 0 tenta usar habilidades que dependem de Fé? → As regras devem declarar que habilidades baseadas em Fé falham automaticamente em Ruptura.
- Como lidar com multiclasse? → A posição padrão deve ser "sem multiclasse" a menos que explicitamente documentado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O documento `regras-base.md` DEVE conter seções completas para: Atributos, Classe de Armadura, Vocações (classe no D&D) com progressão nos níveis 2/6/10/14/18, Sistema de Fé, Sistema de Combate, Criação de Personagem, Progressão de Nível e Equipamentos.
- **FR-002**: O Sistema de Fé DEVE ter valores numéricos concretos para cada faixa de degradação, com efeitos mecânicos testáveis (modificadores, vantagem/desvantagem, condições). O valor inicial padrão DEVE ser **50** (Comum), exceto para a Tribo de Levi que DEVE começar com **60**.
- **FR-003**: Cada uma das 13 tribos DEVE ter uma ficha documentada em `docs/tribos/<tribo>.md` seguindo a estrutura de progressão padronizada (Nível 1/4/8/12/16/20). Efraim e Manassés são tribos separadas (não sub-opções de José).
- **FR-004**: O sistema de combate DEVE definir: iniciativa (atributo base e cálculo), ações por turno, tipos de ataque, resolução de dano e condições/debuffs.
- **FR-005**: O guia de criação de personagem DEVE ter um fluxo linear de no máximo 6 passos que produz um personagem jogável. Na etapa de atributos, o jogador DEVE escolher entre Standard Array (15, 14, 13, 12, 10, 8) ou 4d6 descarta o menor.
- **FR-006**: A lista de equipamentos DEVE cobrir pelo menos 10 armas, 5 armaduras e 10 itens comuns, todos historicamente coerentes com a Idade do Bronze/Ferro.
- **FR-007**: As regras de Descanso Curto e Descanso Longo DEVEM definir duração, recuperação de HP, recuperação de Fé e recarga de habilidades.
- **FR-008**: O sistema DEVE definir claramente as condições de debuff (sangrando, envenenado, atordoado, amedrontado, possessão demoníaca temporária) com duração e efeitos mecânicos.
- **FR-009**: A progressão de nível DEVE definir como o personagem ganha XP (ou método alternativo), o que muda a cada nível (HP, atributos, habilidades tribais nos marcos 1/4/8/12/16/20 e habilidades de vocação nos marcos 2/6/10/14/18).
- **FR-010**: Toda regra nova DEVE ser verificável contra a Constituição do projeto antes de ser incorporada oficialmente.

### Key Entities

- **Personagem**: Combinação de Tribo + Classe + Atributos + Fé + Fortaleza/Tentação. Possui HP, CA, nível e equipamento.
- **Tribo**: Raça do personagem. Define 2 passivas e 2 caminhos de especialização com progressão em 6 marcos.
- **Vocação**: Papel no grupo (Guerreiro, Batedor, Caçador/Nômade, Sacerdote/Sábio). Termo canônico do sistema (equivale a "classe" no D&D). Define habilidades de vocação com progressão própria nos marcos 2/6/10/14/18, complementando a progressão tribal.
- **Fé**: Recurso numérico (0–100) que governa acesso ao sobrenatural e saúde espiritual. Valor inicial padrão: 50 (Levi: 60). Possui faixas de degradação com efeitos mecânicos.
- **Equipamento**: Arma, armadura ou item mundano da Idade do Bronze/Ferro. Sem propriedades mágicas.
- **Condição**: Estado temporário que afeta o personagem (sangrando, envenenado, amedrontado, possessão).
- **Combate**: Estrutura de turnos com Iniciativa, Ações e Resolução de dano.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um Mestre de jogo consegue conduzir uma sessão zero completa (criação de personagens + encontro tutorial) usando exclusivamente a documentação em `docs/`, sem consultar o D&D 5e.
- **SC-002**: Todas as 13 tribos estão documentadas com fichas completas, cada uma com identidade mecânica distinta verificável (nenhuma tribo duplica o nicho de outra).
- **SC-003**: O guia de criação de personagem permite que um jogador novato crie um personagem completo em menos de 30 minutos.
- **SC-004**: O sistema de combate resolve qualquer situação de encontro (corpo a corpo, à distância, emboscada, cerco) sem ambiguidades que exijam improvisação do Mestre.
- **SC-005**: Toda regra no `regras-base.md` passa no teste de conformidade com a Constituição do projeto (6 princípios fundamentais).
- **SC-006**: O índice de tribos (`README.md`) e referências cruzadas entre documentos estão 100% corretos (sem links quebrados, sem tribos faltando).
- **SC-007**: A lista de equipamentos contém pelo menos 25 itens (armas + armaduras + itens) com valores numéricos consistentes entre si.

## Assumptions

- O público-alvo são jogadores com familiaridade básica com RPGs de mesa (não é necessário explicar conceitos como "dado", "turno", "Mestre").
- O D&D 5e serve como base mecânica, portanto conceitos como Vantagem/Desvantagem, Testes de Habilidade e Saving Throws seguem as mesmas convenções — exceto onde explicitamente modificado.
- O sistema suporta níveis 1 a 20, seguindo a escala de progressão já definida nas tribos.
- Multiclasse NÃO é suportada na versão base do sistema (pode ser adicionada como expansão futura).
- A moeda do jogo será definida como equivalente histórico (shekels de prata/bronze) para precificação de equipamentos.
- O sistema não inclui bestiário nesta fase — inimigos e NPCs serão abordados em uma especificação futura separada.
- A ordem de trabalho sugerida é: (1) Regras Base expandidas → (2) Tribos faltantes → (3) Equipamentos → (4) Guia de Criação → (5) Bestiário (futuro).
