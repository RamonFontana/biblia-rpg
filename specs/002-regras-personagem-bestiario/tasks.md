---
description: "Lista de tarefas para a implementação da funcionalidade"
---

# Tasks: Regras de Personagem e Bestiário

**Input**: Documentos de design em `/specs/002-regras-personagem-bestiario/`

**Prerequisites**: plan.md (obrigatório), spec.md (obrigatório para histórias de usuário), research.md, data-model.md, quickstart.md

**Organization**: As tarefas estão agrupadas por história de usuário para permitir a implementação e testes independentes de cada história.

## Formato: `[ID] [P?] [Story] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: A qual história de usuário esta tarefa pertence (ex: US1, US2, US3)
- As descrições incluem os caminhos exatos dos arquivos

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Propósito**: Inicialização e estrutura básica do projeto

- [x] T001 Criar o diretório raiz para o bestiário: `docs/bestiario/`

---

## Phase 2: Foundational (Pré-requisitos)

**Propósito**: Infraestrutura central que DEVE ser concluída antes que QUALQUER história de usuário possa ser implementada

- [x] T002 Atualizar a documentação base com novas mecânicas (reserva) se necessário (neste caso, a atualização de `regras-base.md` será acoplada à US2).

**Checkpoint**: Fundação pronta - a implementação das histórias de usuário pode começar.

---

## Phase 3: User Story 1 - Passo a Passo de Criação de Personagem (Priority: P1) 🎯 MVP

**Objetivo**: Um guia passo a passo claro para criar o personagem, indicando a ordem exata de escolhas.

**Teste Independente**: Um novo jogador consegue ler o documento e criar um personagem mecanicamente válido (Atributos, HP, CA, Fé, Itens).

### Implementação para User Story 1

- [x] T003 [US1] Criar o arquivo base `docs/criacao-de-personagem.md` com a estrutura definida no data-model
- [x] T004 [US1] Adicionar os passos numéricos de criação (Tribo, Vocação, Atributos, Cálculos) em `docs/criacao-de-personagem.md`
- [x] T005 [US1] Documentar as regras e pacotes de equipamentos iniciais em `docs/criacao-de-personagem.md`

**Checkpoint**: O Passo a Passo de Criação de Personagem está documentado e funcional de forma independente.

---

## Phase 4: User Story 2 - Fortalezas e Tentações (Priority: P1)

**Objetivo**: Criar mecânica e lista de Fortalezas (virtudes) e Tentações (falhas).

**Teste Independente**: Jogadores podem escolher suas características e o Mestre sabe como aplicar ganho/perda de Fé.

### Implementação para User Story 2

- [x] T006 [P] [US2] Criar o documento `docs/fortalezas-tentacoes.md` com as listas de virtudes e defeitos
- [x] T007 [P] [US2] Atualizar a seção de Fé e criação de personagem em `docs/regras-base.md` para incluir a exigência de escolher 1 Fortaleza e 1 Tentação no nível 1

**Checkpoint**: As histórias de usuário 1 e 2 estão prontas independentemente.

---

## Phase 5: User Story 3 - Bestiário Básico (Priority: P2)

**Objetivo**: Um bestiário com criaturas, animais selvagens e inimigos humanos do período bíblico.

**Teste Independente**: O Mestre pode consultar um inimigo em combate e ter todas as informações mecânicas em um *stat block* legível.

### Implementação para User Story 3

- [x] T008 [P] [US3] Criar o índice explicativo em `docs/bestiario/README.md`
- [x] T009 [P] [US3] Criar blocos de estatísticas de bandidos, soldados e generais em `docs/bestiario/inimigos-humanos.md`
- [x] T010 [P] [US3] Criar blocos de estatísticas de feras (urso, leão, cobras) em `docs/bestiario/animais-selvagens.md`
- [x] T011 [P] [US3] Criar blocos de estatísticas para os descendentes dos Anakim em `docs/bestiario/gigantes.md`
- [x] T012 [P] [US3] Criar o modificador mecânico de possessão em `docs/bestiario/template-endemoniado.md`

**Checkpoint**: Todas as histórias de usuário são funcionalmente independentes.

---

## Phase N: Polish & Revisão Final

**Propósito**: Melhorias que afetam múltiplas histórias de usuário e validações.

- [x] T013 Revisar todos os documentos criados e modificados em `docs/` garantindo que não existam menções a "Magia Arcana" ou "Itens Mágicos"
- [x] T014 Validar a formatação Markdown dos *stat blocks* nas páginas do bestiário garantindo a legibilidade

---

## Dependências & Ordem de Execução

### Dependências das Fases

- **Setup (Phase 1)**: Sem dependências - pode começar imediatamente.
- **Foundational (Phase 2)**: Depende do Setup - bloqueia as histórias de usuário.
- **User Stories (Phase 3+)**: Todas dependem do Foundational. Podem ocorrer sequencialmente na ordem das prioridades ou em paralelo.
- **Polish (Phase N)**: Depende da conclusão de todas as histórias desejadas.

### Oportunidades Paralelas

- Tarefas marcadas com `[P]` (ex: os diferentes arquivos do bestiário ou o arquivo `fortalezas-tentacoes.md` vs `regras-base.md`) podem ser escritas ao mesmo tempo por agentes ou colaboradores distintos sem causar conflitos de *merge*.
