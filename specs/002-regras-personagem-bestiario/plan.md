# Implementation Plan: Regras de Personagem e Bestiário

**Branch**: `002-regras-personagem-bestiario` | **Date**: 2026-06-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-regras-personagem-bestiario/spec.md`

## Summary

Expandir as regras do RPG Bíblico através da criação de três frentes documentais:
1. Um guia separado com o passo a passo de criação de personagem, detalhando itens e seleção de raça.
2. Um documento detalhando opções de Fortalezas e Tentações, com definição de quantias obrigatórias aplicadas também às regras base.
3. Uma estrutura de diretório para o Bestiário (`docs/bestiario/`) que abrigará entradas para soldados, gigantes, animais e mecânicas como o template de endemoniado.

## Technical Context

**Language/Version**: Markdown (Markdown do GitHub)

**Primary Dependencies**: N/A

**Storage**: Arquivos `.md` no repositório

**Testing**: Validação visual e checagem de regras (coerência com `regras-base.md` e Constituição do Projeto)

**Target Platform**: GitHub / Visualizadores de Markdown

**Project Type**: RPG Documentation

**Performance Goals**: N/A

**Constraints**: Respeitar as restrições da Idade do Bronze/Ferro e ausência total de magia arcana ou itens mágicos, conforme a Constituição do Projeto.

**Scale/Scope**:
- Criação de 2 novos arquivos soltos em `docs/`.
- Criação de 1 nova pasta (`docs/bestiario/`) com pelo menos 4 arquivos.
- Atualização do arquivo existente `docs/regras-base.md`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Fidelidade Bíblica (Sem Magia Arcana)**: Aprovado. O bestiário não conterá criaturas mágicas fora do escopo divino/demoníaco do cenário, e o template de endemoniado segue o conceito de sobrenatural hostil estabelecido na Bíblia.
- **II. Materialismo Histórico (Sem Itens Mágicos)**: Aprovado. O passo a passo referenciará apenas equipamentos normais (espadas de bronze, fundas, etc.).
- **III. Sistema de Fé como Núcleo**: Aprovado. A formalização de Fortalezas e Tentações alavanca esta mecânica central.
- **VI. Documentação como Fonte de Verdade**: Aprovado. Todas as regras serão oficializadas em `docs/`.

## Project Structure

### Documentation (this feature)

```text
specs/002-regras-personagem-bestiario/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
docs/
├── criacao-de-personagem.md      # Passo a passo detalhado e regras de itens
├── fortalezas-tentacoes.md       # Opções e regras mecânicas de virtudes/defeitos
├── regras-base.md                # (MODIFICADO) Adição da qtde obrigatória de fortalezas/tentações
└── bestiario/
    ├── README.md                 # Índice do bestiário e regras de uso
    ├── animais-selvagens.md      # Ursos, leões, cobras
    ├── inimigos-humanos.md       # Soldados, generais, bandidos
    ├── gigantes.md               # Descendentes dos Anakim / Golias
    └── template-endemoniado.md   # Modificador para aplicar possessão em outros blocos
```

**Structure Decision**: A estrutura segue a diretriz de separar o conteúdo em arquivos modulares em `docs/` para melhor manutenibilidade.
