---
description: "Lista de tarefas para a implementação da feature"
---

# Tasks: Finalização das Regras Base do RPG Bíblico

**Input**: Documentos de design em `/specs/001-regras-base-finalizacao/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Organization**: Tarefas agrupadas por user story para permitir a implementação independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode ser executado em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: A qual user story essa tarefa pertence (ex: US1, US2)

---

## Fase 1: Setup (Infraestrutura Compartilhada)

**Objetivo**: Inicialização do projeto e estrutura básica

- [x] T001 Criar diretório `docs/vocacoes/` se não existir

---

## Fase 2: Fundacional (Pré-requisitos de Bloqueio)

**Objetivo**: Infraestrutura principal que DEVE ser concluída antes de qualquer user story começar

- [x] T002 Criar arquivo índice para vocações em `docs/vocacoes/README.md`

**Checkpoint**: Fundação pronta - implementação de user story pode começar

---

## Fase 3: User Story 1 - Game Designer revisa e expande as Regras Base (Priority: P1) 🎯 MVP

**Objetivo**: Expandir o documento `regras-base.md` com seções faltantes e formalizar Vocações.

**Teste Independente**: Um Mestre consegue usar `regras-base.md` e os arquivos de vocação para guiar os fundamentos do jogo.

### Implementação para User Story 1

- [x] T003 [US1] Atualizar `docs/regras-base.md` com a estrutura geral, Atributos e CA
- [x] T004 [US1] Atualizar `docs/regras-base.md` com o Sistema de Fé (base 50, Levi 60) e faixas de degradação
- [x] T005 [US1] Atualizar `docs/regras-base.md` com regras de Progressão de Nível
- [x] T006 [P] [US1] Criar ficha da vocação Guerreiro em `docs/vocacoes/guerreiro.md`
- [x] T007 [P] [US1] Criar ficha da vocação Batedor em `docs/vocacoes/batedor.md`
- [x] T008 [P] [US1] Criar ficha da vocação Caçador em `docs/vocacoes/cacador.md`
- [x] T009 [P] [US1] Criar ficha da vocação Sacerdote em `docs/vocacoes/sacerdote.md`

**Checkpoint**: US1 funcional com regras base expandidas e vocações separadas.

---

## Fase 4: User Story 2 - Game Designer completa as 6 tribos faltantes (Priority: P2)

**Objetivo**: Criar as fichas das 6 tribos restantes e atualizar o índice.

**Teste Independente**: Personagens de nível 1 podem ser criados para as 6 novas tribos sem conflito de passivas.

### Implementação para User Story 2

- [x] T010 [P] [US2] Criar a ficha da tribo Dã em `docs/tribos/da.md`
- [x] T011 [P] [US2] Criar a ficha da tribo Naftali em `docs/tribos/naftali.md`
- [x] T012 [P] [US2] Criar a ficha da tribo Aser em `docs/tribos/aser.md`
- [x] T013 [P] [US2] Criar a ficha da tribo Zebulom em `docs/tribos/zebulom.md`
- [x] T014 [P] [US2] Criar a ficha da tribo Efraim em `docs/tribos/efraim.md`
- [x] T015 [P] [US2] Criar a ficha da tribo Manassés em `docs/tribos/manasses.md`
- [x] T016 [US2] Atualizar o índice `docs/tribos/README.md` listando todas as 13 tribos

**Checkpoint**: Todas as 13 tribos documentadas e integradas.

---

## Fase 5: User Story 3 - Game Designer define o Sistema de Combate (Priority: P2)

**Objetivo**: Documentar as mecânicas de combate: turnos, ações, dano, condições e descansos.

**Teste Independente**: Simular um combate (3 PJs vs 5 Inimigos) usando as regras.

### Implementação para User Story 3

- [x] T017 [US3] Adicionar seção Sistema de Combate em `docs/regras-base.md` contendo iniciativa, ações, dano, condições e descansos

**Checkpoint**: Mecânicas de combate claramente documentadas e aplicáveis.

---

## Fase 6: User Story 4 - Game Designer cria o Guia de Criação de Personagem (Priority: P3)

**Objetivo**: Criar passo a passo (6 passos) para criação de personagem.

**Teste Independente**: Jogador novato cria personagem sem ajuda externa.

### Implementação para User Story 4

- [x] T018 [US4] Adicionar fluxo de Criação de Personagem em `docs/regras-base.md`

**Checkpoint**: Criação de personagem clara e passo a passo.

---

## Fase 7: User Story 5 - Game Designer documenta Equipamentos da Época (Priority: P3)

**Objetivo**: Adicionar armas, armaduras e itens de uso geral.

**Teste Independente**: Jogador pode equipar seu personagem com itens consistentes com a época.

### Implementação para User Story 5

- [x] T019 [US5] Adicionar seção de Equipamentos em `docs/regras-base.md` listando armas, armaduras e itens

**Checkpoint**: Listas de equipamentos disponíveis.

---

## Fase 8: Polimento & Regras Transversais

**Objetivo**: Melhorias e validações finais em todas as documentações.

- [x] T020 Validar todos os documentos contra a constituição e verificar os links cruzados
- [x] T021 Revisão manual cruzada com `constitution.md` para garantir aderência aos princípios do projeto

---

## Dependências & Ordem de Execução

### Dependências de Fase

- **Setup (Fase 1)**: Sem dependências - iniciar imediatamente
- **Fundacional (Fase 2)**: Depende do Setup
- **User Stories (Fases 3+)**: Todas dependem da fase Fundacional
- **Polimento (Última Fase)**: Depende da conclusão de todas as histórias

### Oportunidades Paralelas

- Tarefas [P] nas vocações (T006 a T009) podem ser criadas concorrentemente.
- Tarefas [P] nas tribos (T010 a T015) podem ser executadas concorrentemente.
