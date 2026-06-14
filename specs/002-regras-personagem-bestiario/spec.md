# Feature Specification: Regras de Personagem e Bestiário

**Feature Branch**: `002-regras-personagem-bestiario`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "Quero deixar definido quais são as fortalezas e tentações, definir o bestiário e definir o passo a passo decriação de personagem"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Passo a Passo de Criação de Personagem (Priority: P1)

Como jogador novato, quero um guia passo a passo claro para criar meu personagem, indicando a ordem exata de escolhas (tribo, vocação, atributos, etc.), para que eu possa começar a jogar rapidamente e sem confusão.

**Why this priority**: É a porta de entrada para qualquer jogador no sistema. Sem um guia de criação claro, o sistema se torna inacessível.

**Independent Test**: Um novo jogador consegue ler o documento e criar um personagem mecanicamente válido sem precisar da ajuda do Mestre.

**Acceptance Scenarios**:

1. **Given** que o jogador decide criar um personagem de nível 1, **When** ele segue os passos numerados do guia, **Then** ele finaliza com uma ficha completa, possuindo Tribo, Vocação, valores de Atributos, Pontos de Vida e Pontos de Fé calculados corretamente.
2. **Given** que o jogador tem dúvidas sobre o que fazer primeiro, **When** ele consulta o guia, **Then** o guia deixa explícito o que tem prioridade (ex: escolher Tribo antes da Vocação).

---

### User Story 2 - Fortalezas e Tentações (Priority: P1)

Como jogador ou mestre, quero ter acesso a uma mecânica clara e a uma lista de Fortalezas (virtudes) e Tentações (falhas), para enriquecer o roleplay e entender como isso afeta a perda e ganho de pontos de Fé no jogo.

**Why this priority**: O sistema de Fé é o pilar central do RPG Bíblico, substituindo a magia tradicional. Fortalezas e Tentações são os motores narrativos que movimentam essa mecânica.

**Independent Test**: Um jogador consegue escolher uma Fortaleza e uma Tentação que se apliquem ao seu conceito de personagem, e o Mestre consegue aplicar penalidades ou bônus claros de Fé baseados nessas escolhas durante a sessão.

**Acceptance Scenarios**:

1. **Given** um personagem com a Tentação "Ira", **When** o personagem cede à raiva em uma situação de conflito, **Then** ele sofre as consequências mecânicas previstas (ex: perda de pontos de Fé).
2. **Given** um personagem com a Fortaleza "Compaixão", **When** o personagem se sacrifica para ajudar um necessitado, **Then** ele ganha benefícios previstos (ex: recuperação de pontos de Fé).

---

### User Story 3 - Bestiário Básico (Priority: P2)

Como mestre de jogo (Mestre), quero consultar um bestiário com criaturas, animais selvagens e inimigos humanos do período bíblico (Idade do Bronze/Ferro), para poder povoar meus encontros e criar desafios de combate adequados.

**Why this priority**: O mestre precisa de blocos de estatísticas prontos para inimigos, a fim de não ter o trabalho excessivo de criá-los do zero, permitindo que a campanha flua.

**Independent Test**: O Mestre pode selecionar um inimigo do bestiário, colocá-lo em uma cena de combate e ter todas as informações necessárias para rolar ataques, dano e gerenciar os Pontos de Vida da criatura.

**Acceptance Scenarios**:

1. **Given** uma cena de emboscada no deserto, **When** o Mestre precisa de estatísticas para "Bandidos do Deserto", **Then** ele encontra um bloco de estatísticas (Stat Block) completo e pronto para uso no bestiário.
2. **Given** um combate contra feras, **When** o Mestre escolhe um "Leão da Judeia", **Then** as habilidades e ataques da fera refletem ameaças naturais, sem elementos de magia arcana.

## Clarifications

### Session 2026-06-14
- Q: Como será estruturado o passo a passo de criação de personagem? → A: Será criado um arquivo separado em `docs/` detalhando desde a seleção de raça (tribo) e atributos até a quantidade e tipos de itens iniciais.
- Q: Onde ficarão as Fortalezas e Tentações e quantas cada personagem terá? → A: Será criado um arquivo separado listando-as. Será definida uma quantidade obrigatória por personagem, que também será atualizada nas regras base.
- Q: Como o bestiário será organizado e quais tipos de inimigos terá? → A: Será criada uma pasta específica para o bestiário. Conterá categorias de soldados (fracos/generais), gigantes (ex: Golias), animais (urso, leão, cobras) e a mecânica de endemoniados (atributo/template para modificar inimigos).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST fornecer um arquivo separado na pasta `docs/` listando o passo a passo da criação de um personagem, abrangendo desde a escolha de tribo e atributos até a definição de quais e quantos itens o personagem inicia.
- **FR-002**: O sistema MUST incluir um arquivo separado contendo a lista de "Fortalezas" e "Tentações", além de definir a quantidade obrigatória que cada personagem deve escolher.
- **FR-003**: O sistema MUST atualizar as regras base (`regras-base.md`) para incluir a quantidade obrigatória de Fortalezas e Tentações, bem como a mecânica de impacto na Fé.
- **FR-004**: O sistema MUST apresentar um formato padrão de Ficha de Criatura/NPC (Stat Block) a ser utilizado no bestiário.
- **FR-005**: O sistema MUST criar uma pasta para o bestiário contendo arquivos separados para diferentes inimigos, abrangendo pelo menos: soldados fracos, generais, gigantes (ex: Golias), animais selvagens (urso, leão, cobras) e "endemoniados" (que pode atuar como um atributo/modificador sobre outros inimigos).
- **FR-006**: Todas as criaturas do bestiário MUST respeitar o princípio do projeto de "Sem magia arcana" e usar armamentos condizentes com a Idade do Bronze/Ferro.

### Key Entities

- **Guia de Criação**: Documento que centraliza as regras e direciona para as seções de Tribos e Vocações.
- **Fortaleza/Tentação**: Características de personalidade que geram gatilhos de recuperação ou perda de Fé.
- **Entrada do Bestiário (Criatura/NPC)**: Representação de um inimigo contendo Atributos, Pontos de Vida, Defesa, Ataques (armas de bronze/ferro ou naturais) e Habilidades Especiais (passivas/ações).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O guia de criação de personagem permite que um leitor leigo complete o processo de criação de uma ficha em menos de 15 minutos de leitura/aplicação.
- **SC-002**: O documento de Fortalezas e Tentações fornece pelo menos 10 opções distintas de cada categoria.
- **SC-003**: O bestiário inicial inclui, no mínimo, 10 blocos de estatísticas de inimigos prontos para uso em combate.
- **SC-004**: Todas (100%) as criaturas e regras adicionadas seguem estritamente a restrição tecnológica e de cenário (Idade do Bronze/Ferro, sem itens mágicos ou magia arcana).

## Assumptions

- As regras base (Atributos, Degradação/Recuperação, Sistema de Fé) já estão descritas no `regras-base.md` e serão apenas referenciadas no passo a passo de criação de personagem.
- As Tribos e Vocações já possuem ou possuirão documentos próprios, e o guia servirá apenas como um agregador/roteiro que ensina em qual momento escolher cada uma.
- O bestiário será focado inicialmente em ameaças de nível baixo e médio (condizentes com os primeiros níveis de jogo).
