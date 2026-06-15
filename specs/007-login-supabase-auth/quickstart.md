# Quickstart: Auth & Supabase

Este guia descreve como rodar o fluxo de autenticação localmente.

## Configuração do Supabase Localmente ou Remotamente

1. Obtenha as credenciais do seu projeto Supabase (Project URL e Anon Key).
2. Na raiz do projeto React, copie o arquivo de exemplo (se houver) ou crie o arquivo `.env.local`:

```env
VITE_SUPABASE_URL=sua-url-do-supabase-aqui
VITE_SUPABASE_ANON_KEY=sua-anon-key-do-supabase-aqui
```

3. No painel do Supabase:
   - Vá em **Authentication > Providers**.
   - Habilite **Email** e desative a opção "Confirm email" se quiser facilitar os testes locais (ou mantenha ativado se testar o fluxo completo de email).
   - Habilite **Google** e insira seu `Client ID` e `Client Secret` gerados no Google Cloud Console.

## Como testar o Login

- Inicie o servidor frontend com `npm run dev`.
- Navegue para a rota `/login`.
- Faça o cadastro de uma nova conta ou clique em "Continuar com Google".
- Verifique na aba **Network** do navegador se os requests para o endpoint de auth do Supabase retornam `200 OK`.
- Se o login for bem-sucedido, você será redirecionado para a página inicial protegida.
