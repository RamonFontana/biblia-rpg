# Implementation Plan: Bloqueio e Melhoria na Edição de Personagem

**Branch**: `[045-character-edit-lock]` | **Date**: 2026-07-02 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/045-character-edit-lock/spec.md)

**Input**: Feature specification from `/specs/045-character-edit-lock/spec.md`

## Summary

O objetivo é bloquear a edição de atributos mecânicos de personagens que já participaram de alguma sessão, permitindo apenas a alteração de aspectos narrativos. Além disso, a navegação na interface de edição será melhorada, disponibilizando um botão "Salvar" em todas as etapas, dispensando a necessidade de ir até a aba de "Resumo".

## User Review Required
> [!IMPORTANT]
> - Precisamos ter certeza do caminho e da estrutura exata do formulário de criação de personagens no frontend para garantir que as alterações não quebrem o fluxo atual de criação.
> - Você tem o arquivo do wizard de criação/edição em mãos? Eu notei que você estava editando `Step3NPCs.tsx` em `CreateSessionForm`, mas preciso ter certeza se o Wizard de Personagens está em `src/components/character/...`.

## Technical Context

**Language/Version**: TypeScript, React

**Primary Dependencies**: Supabase, React Hook Form, React Router, TailwindCSS

**Storage**: Supabase (PostgreSQL)

**Testing**: N/A

**Target Platform**: Web Browser

**Project Type**: Web Application

**Performance Goals**: UI responsiva, validação imediata do estado.

**Constraints**: O bloqueio deve ser aplicado visualmente na interface de edição (wizard).

**Scale/Scope**: Refatoração do fluxo de Wizard de Personagem.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Nenhuma violação às regras base do sistema encontradas.

## Project Structure

### Documentation (this feature)

```text
specs/045-character-edit-lock/
├── plan.md
├── research.md
├── data-model.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── components/
│   └── (Componentes do Formulário/Wizard de Personagem)
└── types/
    └── database.types.ts
```

**Structure Decision**: Extenderemos o formulário de personagem atual. Não criaremos tabelas novas. O botão Salvar chamará os métodos já existentes do Supabase passando os dados da aba que está sendo editada.
