# Implementation Plan: Mobile & Dark Mode Layout Redesign

**Branch**: `030-mobile-dark-layout` | **Date**: 2026-06-19 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/030-mobile-dark-layout/spec.md)

**Input**: Feature specification from `/specs/030-mobile-dark-layout/spec.md`

## Summary

O objetivo é resolver problemas de legibilidade/contraste e layout em dispositivos móveis, além de padronizar toda a aplicação em um tema escuro (Dark Theme) seguindo a estética já aprovada na tela de Criação de Personagem. Essa abordagem garantirá responsividade em telas reduzidas (como agrupamento de conteúdo em única coluna) e melhorará a acessibilidade (hitboxes de `44px`).

## Technical Context

**Language/Version**: TypeScript 5.2+

**Primary Dependencies**: React 18, Vite, Tailwind CSS v3, Radix UI

**Storage**: N/A (Alterações apenas de CSS e Layout React)

**Testing**: Não aplicável a regras de negócio. Validações manuais e via Lighthouse (Acessibilidade)

**Target Platform**: Navegadores Web (Foco em Dispositivos Móveis e Desktop)

**Project Type**: Web Application

**Performance Goals**: WCAG AA Contraste (4.5:1), Target Touch Size >= 44x44px

**Constraints**: Resoluções mobile (>= 320px) sem overflows horizontais.

**Scale/Scope**: Todas as telas do RPG, com ênfase no Dashboard de Combate e Telas de Sessão.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Fidelidade Bíblica:** N/A
- **II. Materialismo Histórico:** N/A
- **III. Sistema de Fé como Núcleo:** N/A
- **IV. Tribos como Raças:** N/A
- **V. A Regra de Levi:** N/A
- **VI. Documentação como Fonte de Verdade:** Alterações estritamente visuais. Não fere a fonte da verdade do sistema.

## Project Structure

### Documentation (this feature)

```text
specs/030-mobile-dark-layout/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── components/          # Atualização de classes do Tailwind (dark, flex-col, grid)
├── pages/               # Atualização de page layouts para responsividade
└── index.css            # Definição do background global e cores padrão dark
```

**Structure Decision**: Option 1 (Single Project) - Repositório único React. Alterações focadas dentro da pasta `src/components` e folhas de estilo globais em `src/index.css`.

## Complexity Tracking

> Nenhuma violação à Constituição e arquitetura direta. Alterações puramente de Design.
