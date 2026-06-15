# Tasks: Completar Sistema Base do RPG Bíblico

**Input**: Design documents from `/specs/004-completar-sistema-base/`

**Prerequisites**: plan.md (✅), spec.md (✅), research.md (✅), data-model.md (✅), quickstart.md (✅)

**Tests**: Não solicitados — validação manual pelo Mestre.

**Organization**: Tasks agrupadas por user story para implementação independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User story a que pertence (US1, US2, US3, US4)
- Caminhos exatos de arquivo incluídos nas descrições

---

## Phase 1: Setup

**Purpose**: Não há setup de projeto — o repositório e a estrutura `docs/` já existem. Esta fase valida que todos os artefatos de design foram lidos.

- [X] T001 Ler e confirmar constitution check em specs/004-completar-sistema-base/plan.md
- [X] T002 Ler e confirmar data-model.md para as entidades Bênção, Stat Block, Condição e Gancho

---

## Phase 2: Foundational (Condições de Combate)

**Purpose**: Adicionar as 3 condições faltantes ao `regras-base.md`. Estas são **bloqueantes** pois são referenciadas por habilidades de vocação, fichas do bestiário e pelo Guia do Mestre.

**⚠️ CRITICAL**: Bestiário e Guia do Mestre referenciam estas condições — completar antes.

- [X] T003 Adicionar condição "Caído (Prone)" na seção 6.4 de docs/regras-base.md — efeito: ataques a 1,5m têm Vantagem; à distância têm Desvantagem; levantar custa metade do movimento
- [X] T004 Adicionar condição "Agarrado (Grappled)" na seção 6.4 de docs/regras-base.md — efeito: deslocamento 0; escapar exige teste de Atletismo/Acrobacias vs Atletismo
- [X] T005 Adicionar condição "Cego (Blinded)" na seção 6.4 de docs/regras-base.md — efeito: falha em testes visuais; ataques têm Desvantagem; ataques contra têm Vantagem
- [X] T006 Adicionar nota de bom senso ao final da seção 6.4 de docs/regras-base.md — "Situações não cobertas são resolvidas pelo bom senso do Mestre"

**Checkpoint**: `regras-base.md` deve ter 7 condições (4 existentes + 3 novas) + nota de bom senso.

---

## Phase 3: User Story 1 — Mestre roda sessão completa (Priority: P1) 🎯 MVP

**Goal**: Mestre iniciante consegue montar e rodar um encontro de combate completo usando apenas a documentação do projeto.

**Independent Test**: Entregar fichas de vocação + 5 inimigos a um Mestre iniciante e pedir que narre um combate.

### Implementation for User Story 1

- [X] T007 [US1] Revisar docs/vocacoes/guerreiro.md — garantir que cada habilidade caiba em ≤3 linhas de texto, ajustar redação se necessário
- [X] T008 [P] [US1] Revisar docs/vocacoes/batedor.md — garantir que cada habilidade caiba em ≤3 linhas de texto, ajustar redação se necessário
- [X] T009 [P] [US1] Revisar docs/vocacoes/cacador.md — garantir que cada habilidade caiba em ≤3 linhas de texto, ajustar redação se necessário
- [X] T010 [P] [US1] Revisar docs/vocacoes/sacerdote.md — garantir que cada habilidade caiba em ≤3 linhas de texto, ajustar redação se necessário
- [X] T011 [US1] Criar ficha "Sentinela Amalequita" (ND 1/4, humano, arqueiro) em docs/bestiario/inimigos-humanos.md — seguir formato stat block do data-model.md
- [X] T012 [P] [US1] Criar ficha "Sacerdote de Baal" (ND 2, humano, herege com ataque de Fé) em docs/bestiario/inimigos-humanos.md — seguir formato stat block do data-model.md
- [X] T013 [P] [US1] Criar ficha "Endemoniado Comum" (ND 2, aplicação do template a bandido) em docs/bestiario/endemoniado-comum.md — novo arquivo, exemplo pronto do template
- [X] T014 [US1] Atualizar índice em docs/bestiario/README.md — adicionar links para os 3 novos inimigos e atualizar contagem total

**Checkpoint**: Bestiário tem 10 inimigos prontos. Vocações revisadas com redação ≤3 linhas. Mestre pode rodar sessão.

---

## Phase 4: User Story 2 — Jogador cria personagem sabendo o que pode fazer (Priority: P2)

**Goal**: Jogador leigo lê a ficha da vocação e entende exatamente o que pode fazer nos Níveis 1, 2 e 6.

**Independent Test**: Entregar ficha de Sacerdote completa a um leigo e pedir que crie personagem em <10 min.

### Implementation for User Story 2

- [X] T015 [US2] Criar seção "Bênçãos e Milagres" no final de docs/vocacoes/sacerdote.md — tabela consolidada com colunas: Nome, Nível Min., Custo de Fé, Ação, Usos, Efeito
- [X] T016 [US2] Adicionar Bênção "Imposição de Mãos" (Nível 1) na tabela de docs/vocacoes/sacerdote.md — cura 1d6 HP fora de combate, custo 3 Fé, 2/Descanso Longo
- [X] T017 [US2] Adicionar Bênção "Oração de Proteção" (Nível 1) na tabela de docs/vocacoes/sacerdote.md — aliado recebe +2 CA temporário por 1 minuto, custo 5 Fé, 1/Descanso Longo
- [X] T018 [US2] Adicionar Bênção "Guia Espiritual" (Nível 1) na tabela de docs/vocacoes/sacerdote.md — aliado recebe Vantagem no próximo teste de Sabedoria, custo 2 Fé, 3/Descanso Longo
- [X] T019 [US2] Adicionar Bênção "Repreensão Divina" (Nível 2) na tabela de docs/vocacoes/sacerdote.md — endemoniado faz teste SAB CD 12+SAB ou foge por 1 minuto, custo 8 Fé, 1/Descanso Curto
- [X] T020 [US2] Adicionar Bênção "Consagração" (Nível 6) na tabela de docs/vocacoes/sacerdote.md — purifica área 9m contra influência demoníaca por 8h, custo 10 Fé, 1/Descanso Longo
- [X] T021 [US2] Consolidar habilidades existentes do Sacerdote (Súplica Curativa, Purificação, Intervenção, Barreira, Retribuição) na mesma tabela de Bênçãos em docs/vocacoes/sacerdote.md
- [X] T022 [US2] Adicionar nota na seção de Bênçãos de docs/vocacoes/sacerdote.md — "Todos os milagres falham automaticamente quando a Barra de Fé está em Ruptura (0 pontos)"

**Checkpoint**: Sacerdote tem 10-12 Bênçãos/Milagres na tabela. Jogador leigo sabe o que pode fazer em cada nível.

---

## Phase 5: User Story 3 — Mestre arbitra condições sem discussão (Priority: P3)

**Goal**: Durante combate, condições especiais são resolvidas imediatamente pelo Mestre consultando as regras.

**Independent Test**: Simular 3 situações (cair, agarrar, cegar) com Mestre iniciante.

### Implementation for User Story 3

> Esta fase foi completada pela Phase 2 (Foundational). As condições Caído, Agarrado e Cego já foram adicionadas em T003–T006.

- [X] T023 [US3] Validar que docs/regras-base.md seção 6.4 contém as 7 condições no formato correto (Sangrando, Atordoado, Amedrontado, Envenenado, Caído, Agarrado, Cego)
- [X] T024 [US3] Verificar que habilidades das vocações e bestiário que referenciam condições (ex: Leão "Salto e Bote" → Caído) usam terminologia consistente com regras-base.md

**Checkpoint**: Todas as condições referenciadas no jogo existem e são consistentes.

---

## Phase 6: User Story 4 — Mestre conduz narrativa bíblica com orientações (Priority: P4)

**Goal**: Mestre usa o Guia Rápido para saber quando chamar testes de Fé, recompensar o grupo e ter ideias de aventura.

**Independent Test**: Mestre lê o Guia e narra uma cena de tentação com Barra de Fé em risco.

### Implementation for User Story 4

- [X] T025 [US4] Criar arquivo docs/guia-do-mestre.md com cabeçalho e seção 1 "A Regra de Ouro" (~10 linhas) — como arbitrar o sobrenatural e manter o clima bíblico
- [X] T026 [US4] Escrever seção 2 "Usando Fé, Fortalezas e Tentações" (~25 linhas) em docs/guia-do-mestre.md — gatilhos narrativos, CDs sugeridas (CD 10 fácil, CD 13 médio, CD 16 difícil), exemplos de cenas
- [X] T027 [US4] Escrever seção 3 "Recompensas por Nível de Desafio" (~15 linhas) em docs/guia-do-mestre.md — tabela: ND → faixa de SP de loot + itens sugeridos
- [X] T028 [US4] Escrever seção 4 "Ganchos de Aventura Prontos" (~40 linhas) em docs/guia-do-mestre.md — 5 mini-cenários: título, premissa (2-3 linhas), ND sugerido, pilares (Combate/Fé/Exploração)
- [X] T029 [US4] Escrever seção 5 "Dicas de Combate para Iniciantes" (~15 linhas) em docs/guia-do-mestre.md — como montar encontros balanceados usando o ND do bestiário
- [X] T030 [US4] Validar que docs/guia-do-mestre.md tem ≤150 linhas no total

**Checkpoint**: Guia Rápido do Mestre completo e dentro do limite de tamanho.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validação cruzada, consistência e atualização de índices.

- [X] T031 Verificar que docs/vocacoes/README.md está atualizado e referencia corretamente as 4 vocações
- [X] T032 [P] Verificar que docs/regras-base.md seção 7 (Guia de Criação) referencia o novo Guia do Mestre
- [X] T033 [P] Verificar consistência de terminologia entre todos os arquivos modificados (nomes de condições, custos de Fé, NDs)
- [X] T034 Executar validação final via quickstart.md — confirmar todos os critérios de pronto

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — validação inicial
- **Foundational (Phase 2)**: Depende de Phase 1 — **BLOQUEIA** todas as user stories
- **US1 (Phase 3)**: Depende de Phase 2 — vocações + bestiário
- **US2 (Phase 4)**: Depende de Phase 2 — pode rodar **em paralelo** com US1
- **US3 (Phase 5)**: Depende de Phase 2 — validação do trabalho da Phase 2
- **US4 (Phase 6)**: Depende de Phase 3 (bestiário pronto) — referencia inimigos e condições
- **Polish (Phase 7)**: Depende de todas as fases anteriores

### User Story Dependencies

- **US1 (P1)**: Após Phase 2 → independente
- **US2 (P2)**: Após Phase 2 → independente (pode rodar em paralelo com US1)
- **US3 (P3)**: Após Phase 2 → valida Phase 2 (sequencial)
- **US4 (P4)**: Após Phase 3 (US1) → referencia bestiário e condições

### Parallel Opportunities

- T007, T008, T009, T010 (revisão de vocações) podem rodar em paralelo
- T011, T012, T013 (novos inimigos) podem rodar em paralelo
- US1 e US2 inteiras podem rodar em paralelo
- T031, T032, T033 (polish) podem rodar em paralelo

---

## Parallel Example: User Story 1

```text
# Revisão de vocações (T007–T010) — todas em paralelo:
Task: "Revisar docs/vocacoes/guerreiro.md"
Task: "Revisar docs/vocacoes/batedor.md"
Task: "Revisar docs/vocacoes/cacador.md"
Task: "Revisar docs/vocacoes/sacerdote.md"

# Novos inimigos (T011–T013) — em paralelo:
Task: "Criar Sentinela Amalequita em docs/bestiario/inimigos-humanos.md"
Task: "Criar Sacerdote de Baal em docs/bestiario/inimigos-humanos.md"
Task: "Criar Endemoniado Comum em docs/bestiario/endemoniado-comum.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. ✅ Complete Phase 1: Setup (leitura de artefatos)
2. ✅ Complete Phase 2: Foundational (3 condições no regras-base)
3. ✅ Complete Phase 3: User Story 1 (vocações + bestiário)
4. **STOP and VALIDATE**: Mestre pode rodar sessão completa?
5. Se sim → MVP funcional!

### Incremental Delivery

1. Setup + Foundational → Condições de combate completas
2. US1 (vocações + bestiário) → **MVP jogável** 🎯
3. US2 (milagres do Sacerdote) → Sacerdote ganha profundidade
4. US3 (validação de condições) → Consistência confirmada
5. US4 (Guia do Mestre) → Suporte narrativo para iniciantes
6. Polish → Tudo validado e coerente

---

## Notes

- Este projeto é 100% documentação Markdown — não há código, build ou deploy
- [P] = arquivos diferentes, sem dependências entre si
- [Story] mapeia a task para a user story correspondente da spec.md
- Cada user story pode ser validada independentemente
- Commit após cada phase ou grupo lógico de tasks
- Simplicidade é princípio: habilidades ≤3 linhas, guia ≤150 linhas, ≤2 passivas por inimigo
