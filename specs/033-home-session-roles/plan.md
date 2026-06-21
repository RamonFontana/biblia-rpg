# Implementation Plan: Ajuste de Botões da Sessão (Home)

**Branch**: `033-home-session-roles` | **Date**: 2026-06-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/033-home-session-roles/spec.md`

## Summary

A tela inicial precisa exibir corretamente os botões de controle de sessão com base na regra do usuário: o Mestre da sessão (criador) deve ver apenas o botão "Acessar Sessão Ativa (Mestre)", enquanto um Jogador convidado deve ver os botões de "Entrar na Sessão" correspondente, além da opção de criar uma nova sessão. Adicionalmente, devemos corrigir um bug que causa a duplicação de botões de sessão (ex: "Entrar: teste" repetido) listados na tela.

## Technical Context

**Language/Version**: TypeScript / React 18+

**Primary Dependencies**: Vite, Tailwind, Shadcn UI, Zustand, React Query

**Storage**: Supabase (PostgreSQL)

**Testing**: Vitest / Playwright

**Target Platform**: Web App

**Project Type**: Web Application

**Performance Goals**: N/A - Renderização O(N) onde N é o número de sessões do usuário.

**Constraints**: As checagens devem se basear no `gm_id` da tabela `game_sessions` e `user_id` na tabela `session_participants`.

**Scale/Scope**: Limitado ao dashboard/home screen da aplicação.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Nenhum princípio fundamental do RPG Bíblico (Magia Arcana, Itens Mágicos, etc.) está sendo afetado por este ajuste de UI. As permissões e visibilidade de Mestre vs Jogador estão alinhadas com a arquitetura definida.
- [x] Princípio I a V: N/A (Ajuste apenas de navegação/UI)
- [x] Documentação (Princípio VI): A especificação foi gerada antes de implementar.

## Project Structure

### Documentation (this feature)

```text
specs/033-home-session-roles/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (to be created)
```

### Source Code (repository root)

```text
src/
├── pages/
│   └── dashboard/        # Ou onde a home de sessões está localizada (verificaremos na research)
├── features/
│   └── session/
│       └── components/   # Botões de sessão e lista de convites
└── types/
    └── database.types.ts # Tipos do Supabase
```

**Structure Decision**: A implementação ocorrerá nos componentes React atuais que renderizam os botões da Home/Dashboard.

## Complexity Tracking

Nenhuma complexidade adicional além do React state handling.
