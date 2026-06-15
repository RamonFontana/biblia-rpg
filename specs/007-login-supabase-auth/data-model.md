# Data Model & Interfaces

Embora o Supabase Auth gerencie internamente o esquema no PostgreSQL (tabela `auth.users`), documentamos as entidades como serão consumidas pelo frontend.

## Entities

### User (Supabase Auth User)

Interface mapeada do retorno de `@supabase/supabase-js`.

```typescript
interface User {
  id: string; // UUID do usuário no Supabase
  email: string;
  user_metadata: {
    avatar_url?: string;
    full_name?: string; // Vem via Google OAuth
  };
  created_at: string;
}
```

### AuthSession

```typescript
interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}
```

### AuthStore (Zustand)

O estado global gerenciado pelo Zustand.

```typescript
interface AuthState {
  session: AuthSession | null;
  user: User | null;
  isLoading: boolean;
  setSession: (session: AuthSession | null) => void;
  signOut: () => Promise<void>;
}
```

## Flow Contracts

1. **Login com Email**: Chama `supabase.auth.signInWithPassword`.
2. **Cadastro**: Chama `supabase.auth.signUp`.
3. **Login Google**: Chama `supabase.auth.signInWithOAuth({ provider: 'google' })`.
4. **Recuperação de Senha**: Chama `supabase.auth.resetPasswordForEmail`.
5. **Redefinição de Senha**: Acessado via link de email, chama `supabase.auth.updateUser` com a nova senha.
