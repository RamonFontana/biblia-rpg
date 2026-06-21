# Research: Ajuste de Botões da Sessão (Home)

## Technical Findings

### 1. Localização da UI e Regras Atuais
- A tela inicial está implementada em `src/App.tsx` no componente `Home`.
- As sessões onde o usuário é jogador são buscadas pelo hook `useActiveSession` (em `src/hooks/useActiveSession.ts`), que faz uma query na tabela `session_participants`.
- A sessão onde o usuário é Mestre (GM) é buscada diretamente dentro do `useEffect` no componente `Home`, e salva no estado `activeSessionId`.

### 2. Causa da Duplicação de Botões
- O hook `useActiveSession` faz uma query em `session_participants` filtrando por `user_id`. Se um usuário tiver **múltiplos personagens participando da mesma sessão**, a API do Supabase retorna múltiplas linhas para a mesma sessão.
- Como o `map` no React renderiza um botão para cada item retornado por esse hook, a mesma sessão aparece múltiplas vezes na tela.

### 3. Conflito Mestre x Jogador
- Atualmente, se um Mestre também tiver um registro de participação na própria sessão, a sessão será listada duas vezes: uma como o botão verde do mestre (renderizado usando `activeSessionId`) e outra como o botão azul de jogador (vindo de `activeSessions`).
- O hook já traz a propriedade `gm_id` na query. Basta filtrar a lista de `activeSessions` para remover as instâncias onde `session.gm_id === user.id`.

## Design Decisions

**Decision 1: Filtragem e Desduplicação no Hook**
- **Decision**: O hook `useActiveSession` será modificado para desduplicar as sessões pelo `session_id`.
- **Rationale**: Isso garante que a UI receba apenas uma entrada por sessão, resolvendo o bug de repetição e melhorando a qualidade dos dados fornecidos aos componentes.

**Decision 2: Filtragem de Mestre na UI (App.tsx)**
- **Decision**: Na renderização do `Home` em `App.tsx`, os botões de jogador iterarão sobre `activeSessions` filtrando aquelas em que `session.gm_id !== user.id`.
- **Rationale**: Impede que o botão "Entrar: [nome]" apareça junto ao botão verde de "Acessar Sessão Ativa (Mestre)".

**Decision 3: Botão de Criar Sessão**
- **Decision**: O botão de "Mestre: Criar Sessão" já possui lógica `{!activeSessionId && ...}` no componente, o que atende ao requisito "na visão do jogador, tenha a opção de criar uma nova sessão". Não é necessário alterar a regra de exibição deste botão em específico, apenas renomear ou garantir que o texto siga a semântica da issue, se necessário.

Todos os itens do "NEEDS CLARIFICATION" foram resolvidos analisando o código existente e o Supabase.
