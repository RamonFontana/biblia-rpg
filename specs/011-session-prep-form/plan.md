# Implementation Plan: Início da Criação de Sessão (Preparação)

**Branch**: `011-session-prep-form` | **Date**: 2026-06-15 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/011-session-prep-form/spec.md)

**Input**: Feature specification from `/specs/011-session-prep-form/spec.md`

## Summary

O objetivo é criar um fluxo de criação de sessão em etapas (Multi-step form) para o Mestre de Jogo. O fluxo engloba Preparação, Inimigos, NPCs, Personagens/Jogadores e um Resumo. Ao final, a sessão é inserida no Supabase e ativada, abrindo um canal Realtime. O escopo atual cobre o formulário e a tela inicial da sessão ativa com um botão "Finalizar Sessão".

## Technical Context

**Language/Version**: TypeScript, React (Next.js ou Vite - de acordo com o projeto atual)

**Primary Dependencies**: React Hook Form, Zod (validação), Zustand ou React Context (para estado local entre etapas), @supabase/supabase-js

**Storage**: PostgreSQL (Supabase)

**Testing**: Jest / React Testing Library (assumido)

**Target Platform**: Web Browser

**Project Type**: Web Application

**Performance Goals**: Tempo de carregamento entre etapas < 100ms (estado puramente local no frontend).

**Constraints**: O estado do formulário deve ser preservado localmente se o usuário avançar/voltar. As tabelas necessárias no Supabase ainda não existem e precisam ser criadas via migração.

**Scale/Scope**: Formulário de 5 passos, cerca de 4 novas tabelas no banco de dados.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Fidelidade Bíblica (Sem Magia Arcana) - Respeitado (bestiário será usado).
- [x] Materialismo Histórico (Sem Itens Mágicos) - Respeitado.
- [x] Documentação como Fonte de Verdade - A especificação e este plano documentam o recurso antes da implementação.

## Project Structure

### Documentation (this feature)

```text
specs/011-session-prep-form/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── session/
│       ├── CreateSessionForm/
│       │   ├── Step1Preparation.tsx
│       │   ├── Step2Enemies.tsx
│       │   ├── Step3NPCs.tsx
│       │   ├── Step4Players.tsx
│       │   ├── Step5Summary.tsx
│       │   └── index.tsx
│       └── ActiveSession/
│           └── index.tsx
├── store/
│   └── createSessionStore.ts
├── pages/
│   ├── session/
│   │   ├── create.tsx
│   │   └── [id].tsx
└── supabase/
    └── migrations/
        └── [timestamp]_create_session_tables.sql
```

**Structure Decision**: Utilizamos pastas dedicadas para componentes de domínio (`session`) contendo os formulários fragmentados e a tela de sessão ativa. O gerenciamento de estado será feito via um `store` global/contextual específico para a criação da sessão.
