# Implementation Plan: Itens e Equipamentos

**Branch**: `003-itens-equipamentos` | **Date**: 2026-06-14 | **Spec**: [spec.md](./spec.md)

**Input**: "crie uma pasta itens em docs e um arquivo para cada tipo de item. Um arquivo para armas, um arquivo para armadura, outra para items utilizaveis outro para consumiveis"

## Summary

O objetivo é estruturar a documentação dos equipamentos e itens disponíveis no cenário. Conforme instrução do usuário, a documentação não ficará concentrada apenas no `regras-base.md`, mas será expandida para arquivos específicos na nova pasta `docs/itens/`: `armas.md`, `armaduras.md`, `utilizaveis.md` e `consumiveis.md`. Essa abordagem modular facilitará a expansão e consulta.

## Technical Context

**Language/Version**: Markdown (Markdown do GitHub)

**Primary Dependencies**: N/A (Apenas documentação)

**Storage**: Arquivos `.md` no repositório

**Testing**: Revisão humana e verificação da estrutura da tabela.

**Target Platform**: GitHub / Obsidian / Leitor de Markdown

**Project Type**: Documentação de Sistema de RPG

**Performance Goals**: N/A

**Constraints**: Respeitar a fidelidade histórica (Idade do Bronze/Ferro), sem introdução de itens mágicos.

**Scale/Scope**: 4 arquivos de documentação para o inventário padrão do sistema.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I & II**: Sem itens mágicos, todos baseados em materiais e designs da Idade do Bronze/Ferro. [PASSED]
- **Principle VI**: Tudo documentado na pasta `docs/`. O usuário pediu explicitamente `docs/itens/`. [PASSED]
- **Restrições de Cenário**: Todo equipamento novo validará a ausência de magia e de tecnologia avançada. [PASSED]

## Project Structure

### Documentation (this feature)

```text
specs/003-itens-equipamentos/
├── plan.md              # This file
├── research.md          # Output
├── data-model.md        # Output
└── tasks.md             # To be created by /speckit-tasks
```

### Source Code (repository root)

```text
docs/
└── itens/
    ├── armas.md         # Estatísticas e descrições de armas
    ├── armaduras.md     # Estatísticas e regras de armaduras e escudos
    ├── utilizaveis.md   # Itens gerais (cordas, ferramentas, etc.)
    └── consumiveis.md   # Consumíveis (rações, bálsamos, tochas)
```

**Structure Decision**: Criaremos a pasta `docs/itens/` conforme pedido expresso do usuário e dividiremos os itens listados previamente no `regras-base.md` em arquivos individuais, adicionando maior descritivo, se necessário, ou pelo menos organizando-os em tabelas definitivas.

## Complexity Tracking

*N/A - Sem violações ou aumento de complexidade arquitetural (trata-se apenas de modularização de markdown).*
