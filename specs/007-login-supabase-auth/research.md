# Research & Technical Decisions

## Autenticação com Supabase Auth vs UI Pre-build

**Decision**: Utilizaremos `@supabase/supabase-js` diretamente com formulários customizados (Shadcn UI + React Hook Form + Zod) em vez do pacote `@supabase/auth-ui-react`.

**Rationale**: 
O `auth-ui-react` é rápido para prototipar, mas engessa o layout e a customização profunda. Como o RPG Bíblico tem uma temática visual específica e utilizaremos Shadcn UI extensamente (conforme plano 006), manter os formulários sob controle do nosso próprio código garante coesão visual e integração perfeita com nossas validações (Zod).

**Alternatives considered**: 
- `@supabase/auth-ui-react`: Rejeitado por falta de flexibilidade no estilo e integração mais difícil com o design system do projeto.

## Gerenciamento de Sessão

**Decision**: A sessão será ouvida pelo `supabase.auth.onAuthStateChange` e sincronizada em uma store global com Zustand.

**Rationale**:
O Zustand é leve e foi escolhido no setup inicial do projeto (006). Escutar os eventos do Supabase no topo da árvore de componentes (ex: App.tsx) e atualizar a store do Zustand permite que qualquer componente reaja a mudanças de estado de login (ex: botão de logout no header, redirecionamento de rotas protegidas) sem precisar de contextos complexos.

**Alternatives considered**:
- Context API: Rejeitado por ser mais verboso que o Zustand que já está no stack.
- React Query: Melhor para dados do banco, mas para a sessão do auth (que já gerencia seu próprio cache local via Supabase JS), sincronizar com o Zustand é mais simples para uso em guards de rota.

## Configuração do OAuth (Google)

**Decision**: O fluxo OAuth utilizará PKCE (gerenciado automaticamente pelo Supabase) com redirecionamento.

**Rationale**:
Redirecionamento é o padrão mais seguro para SPAs. O Supabase tratará a volta para a URL de callback que processará o token e atualizará a sessão antes de levar o usuário ao Dashboard principal.
