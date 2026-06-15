# Implementation Plan: Tela de Login e Autenticação

**Branch**: `007-login-supabase-auth` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-login-supabase-auth/spec.md`

## Summary

Implementação do fluxo completo de autenticação (Login, Cadastro, Esqueci a Senha e Redefinição) integrando o Supabase Auth. Inclui suporte para autenticação via Email/Senha e Login Social (Google OAuth), utilizando formulários customizados com Shadcn UI, React Hook Form e Zod no frontend React (Vite).

## Technical Context

**Language/Version**: TypeScript

**Primary Dependencies**: React 18, React Router Dom, `@supabase/supabase-js`, React Hook Form, Zod, Zustand (para state da sessão), Shadcn UI

**Storage**: Supabase Auth (PostgreSQL gerido pelo Supabase)

**Testing**: Vitest + React Testing Library

**Target Platform**: Modern Web Browser

**Project Type**: Web Application SPA

**Performance Goals**: Renderização inicial das rotas de auth em < 1s. Feedback imediato em caso de erros de validação.

**Constraints**: Pure Client-Side application (SPA). Requer configuração adequada de variáveis de ambiente do Supabase.

**Scale/Scope**: 5 telas principais de fluxo de autenticação e configuração do cliente do Supabase no frontend.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle VI (Documentação como Fonte de Verdade)**: PASSED. As interfaces e regras de fluxo de autenticação estão documentadas neste plano antes de qualquer linha de código.
- Os demais princípios focam em mecânicas do RPG, mas o uso do Supabase para gestão de sessão está perfeitamente alinhado com manter uma arquitetura leve e dependente de serviços confiáveis.

## Project Structure

### Documentation (this feature)

```text
specs/007-login-supabase-auth/
├── plan.md              # This file
├── research.md          # Technical decisions rationale
├── data-model.md        # Authentication entities
└── quickstart.md        # Environment setup guide
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── supabase.ts                # Supabase client initialization
├── store/
│   └── authStore.ts               # Zustand store for user session
├── pages/
│   └── auth/
│       ├── LoginPage.tsx          # Login form + Google Auth button
│       ├── RegisterPage.tsx       # Signup form
│       ├── ForgotPasswordPage.tsx # Request reset link
│       ├── ResetPasswordPage.tsx  # Define new password
│       └── AuthCallbackPage.tsx   # Handle OAuth redirects
└── components/
    └── auth/
        └── ProtectedRoute.tsx     # Guard for authenticated routes
```

**Structure Decision**: Criar uma pasta dedicada `pages/auth/` para as telas, e isolar a inicialização do client em `lib/supabase.ts`. O estado da sessão será mantido globalmente via Zustand (`store/authStore.ts`).

## Complexity Tracking

N/A - Sem violações da constituição ou uso de padrões complexos desnecessários.
