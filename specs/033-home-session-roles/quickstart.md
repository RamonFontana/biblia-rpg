# Quickstart: Ajuste de Botões da Sessão (Home)

Este guia rápido detalha a implementação das correções e refatorações no fluxo de botões da Home da aplicação.

## Passos de Implementação

1. **Atualizar `src/hooks/useActiveSession.ts`:**
   - Adicionar uma lógica na resposta da API do Supabase para desduplicar a lista de sessões ativas pelo `session_id`. Uma abordagem simples é usar um Map ou Set, ou encadear um `reduce` na array `sessions`.

   *Exemplo de código sugerido:*
   ```typescript
   // ... após mapear os dados da api:
   const uniqueSessions = Array.from(
     new Map(sessions.map((item) => [item.session_id, item])).values()
   );
   setActiveSessions(uniqueSessions);
   ```

2. **Atualizar a UI em `src/App.tsx`:**
   - Localizar a listagem do botão `Entrar: {session.session_name}`.
   - Adicionar uma filtragem antes do `.map` para excluir as sessões em que o usuário atual já é o mestre (`gm_id === user.id`).
   
   *Exemplo de código sugerido:*
   ```tsx
   {!loadingSessions && activeSessions
     .filter(session => session.gm_id !== user?.id)
     .map((session) => (
       <Link 
         key={session.session_id}
         to={`/session/${session.session_id}`} 
         className="px-6 py-3 bg-blue-700 text-stone-100 font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20"
       >
         Entrar: {session.session_name}
       </Link>
   ))}
   ```

3. **Verificação de Regressão:**
   - Logar com usuário que seja mestre de uma sessão e verifique se aparece apenas o botão verde de Mestre.
   - Logar com um usuário que possua múltiplos personagens na mesma sessão, e verifique se o botão "Entrar" não está duplicado.
