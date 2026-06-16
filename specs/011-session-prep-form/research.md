# Research & Technical Decisions: Criação de Sessões

## Decision 1: Gerenciamento de Estado do Formulário Multi-Step

**Decision**: Utilizar `Zustand` (ou Contexto do React) para criar uma "Store" temporária no frontend chamada `useSessionDraftStore` durante o preenchimento do formulário de 5 passos.

**Rationale**: O usuário pode avançar e voltar etapas sem perder os dados. As entidades (Inimigos, NPCs) precisam ser editadas (CRUD local) em memória. Fazer isso em localStorage seria complicado para manipular arrays em cada alteração; fazer no Supabase em cada passo geraria "lixo" no banco (drafts abandonados). Manter no Zustand e enviar tudo de uma vez no Step 5 é muito mais simples e seguro.

**Alternatives considered**: 
- Salvar no Supabase a cada step: rejeitado para evitar lixo no banco caso o Mestre desista.
- LocalStorage nativo: rejeitado pela complexidade de manipulação de JSON e falta de reatividade nativa com React sem bibliotecas adicionais.

## Decision 2: Inserção Transacional da Sessão

**Decision**: Criar uma função de borda (Supabase Edge Function) ou Remote Procedure Call (RPC - Postgres Function) para "Create Session". Essa função receberá o JSON do draft e inserirá nas tabelas `game_sessions`, `session_enemies`, `session_npcs` e `session_participants` em uma única transação atômica.

**Rationale**: O frontend enviará todas as informações de uma vez. Se o frontend tiver que fazer 4 requests (uma para cada tabela), uma falha de conexão pode deixar o banco inconsistente (Sessão sem inimigos inseridos, etc). Transações garantem integridade.

**Alternatives considered**:
- Várias mutations do cliente: Rejeitado por risco de "Partial Inserts".

## Decision 3: Tempo Real (Supabase Realtime)

**Decision**: A tabela `game_sessions`, bem como as tabelas `characters`, `session_enemies` e `session_npcs`, deverão ter o Realtime habilitado para o projeto via `supabase migrations`. 

**Rationale**: O Mestre e os Jogadores precisarão ver mudanças de HP instantaneamente sem recarregar a página.

**Alternatives considered**:
- Polling via React Query: Rejeitado devido ao limite de escalabilidade e latência, que vai contra o requisito "real-time".
