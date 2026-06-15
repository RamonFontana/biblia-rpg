# Implementation Plan: Completar Sistema Base do RPG Bíblico

**Branch**: `004-completar-sistema-base` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-completar-sistema-base/spec.md`

## Summary

Fechar as 5 lacunas essenciais para tornar o RPG Bíblico jogável de ponta a ponta com simplicidade: (1) revisar habilidades de vocações e preencher lacunas na progressão, (2) criar uma lista dedicada de Bênçãos/Milagres para o Sacerdote, (3) expandir o bestiário para 10+ inimigos prontos, (4) escrever um Guia Rápido do Mestre de até 2 páginas, e (5) adicionar 3 condições de combate faltantes ao `regras-base.md`.

## Technical Context

**Language/Version**: Markdown (documentação pura — sem código fonte)

**Primary Dependencies**: N/A — projeto de design de RPG em documentação

**Storage**: Arquivos `.md` na pasta `docs/`

**Testing**: Validação manual (leitura por Mestre iniciante)

**Target Platform**: Documentação impressa / leitura digital (PDF, Markdown)

**Project Type**: Design de sistema de RPG (tabletop)

**Performance Goals**: N/A

**Constraints**: Simplicidade máxima — habilidades descritas em ≤3 linhas, Guia do Mestre em ≤150 linhas Markdown, sem jargão que exija consulta externa

**Scale/Scope**: 4 vocações × 6 marcos de nível + 10 inimigos + 1 guia + 3 condições + lista de milagres

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Observação |
|-----------|--------|------------|
| **I. Fidelidade Bíblica (Sem Magia Arcana)** | ✅ PASS | Milagres do Sacerdote usam Fé, não magia arcana. Lista será baseada em eventos bíblicos. |
| **II. Materialismo Histórico (Sem Itens Mágicos)** | ✅ PASS | Nenhuma habilidade ou milagre concede itens sobrenaturais. Bestiário usa armas da época. |
| **III. Sistema de Fé como Núcleo** | ✅ PASS | Milagres custam Fé. Guia do Mestre foca em gatilhos de Fé. Bestiário inclui ameaça à Fé (endemoniados). |
| **IV. Tribos como Raças** | ✅ PASS | Habilidades de vocação são separadas e compatíveis com passivas de tribo. Não sobrepõem. |
| **V. A Regra de Levi** | ✅ PASS | Nenhuma mudança afeta esta regra. Será referenciada no Guia do Mestre. |
| **VI. Documentação como Fonte de Verdade** | ✅ PASS | Todo conteúdo será escrito em `docs/` como Markdown. |
| **Planaridade (simplicidade)** | ✅ PASS | Restrições de tamanho (≤3 linhas/habilidade, ≤150 linhas/guia) embutidas nos requisitos. |

**GATE RESULT**: ✅ Todos os princípios satisfeitos. Prosseguir para Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/004-completar-sistema-base/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
docs/
├── regras-base.md            # [MODIFY] Adicionar 3 condições + nota de bom senso
├── vocacoes/
│   ├── guerreiro.md           # [REVIEW] Validar progressão existente
│   ├── batedor.md             # [REVIEW] Validar progressão existente
│   ├── cacador.md             # [REVIEW] Validar progressão existente
│   └── sacerdote.md           # [MODIFY] Adicionar seção de Bênçãos/Milagres
├── bestiario/
│   ├── README.md              # [MODIFY] Atualizar índice com novos inimigos
│   ├── inimigos-humanos.md    # [MODIFY] Adicionar Arqueiro Filisteu
│   ├── animais-selvagens.md   # [MODIFY] Adicionar Escorpião do Negev
│   ├── gigantes.md            # [REVIEW] Já possui 1 ficha (Anakim) — OK
│   └── template-endemoniado.md # [REVIEW] Já possui template — OK
└── guia-do-mestre.md          # [NEW] Guia Rápido do Mestre (≤150 linhas)
```

**Structure Decision**: Este projeto é pura documentação Markdown. Não há código, testes automatizados ou build. Cada arquivo `.md` em `docs/` é um "deliverable" independente.

## Complexity Tracking

> Nenhuma violação de constituição — tabela de justificativa não é necessária.
