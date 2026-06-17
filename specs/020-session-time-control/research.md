# Research & Technical Decisions

## 1. Como representar current_day e current_period no banco de dados?
**Decision**: Adicionar duas colunas na tabela `game_sessions`: `current_day` (integer, default 1) e `current_period` (text, default 'Manhã', com check in ('Manhã', 'Tarde', 'Noite')).
**Rationale**: O tempo da sessão pertence ao estado global da sessão, então armazená-lo em `game_sessions` é o ideal.
**Alternatives considered**: Usar a tabela de status ou metadados de JSON. Adicionar colunas explícitas facilita a manipulação de tipagem no Supabase.

## 2. Como notificar os jogadores e sincronizar em tempo real?
**Decision**: Utilizar o `game_sessions` realtime subscription (já configurado no código). Ao detectar uma alteração do estado de `current_period` (de 'Noite' para 'Manhã' localmente comparado com o novo payload), um componente exibirá o diálogo.
**Rationale**: Já temos a inscrição no `postgres_changes` em `ActiveSessionPage.tsx`.

## 3. Onde colocar o botão de controle de tempo?
**Decision**: Adicionar o botão no header de `ActiveSessionPage.tsx` ou em uma seção "Controle de Sessão" ao lado do botão "Dados" no Header, apenas visível se for o GM (`isGM === true`).
**Rationale**: O botão do mestre deve ter acesso rápido. Adicionalmente, as informações do tempo (Ex: DIA 1 - Manhã) precisam estar visíveis para todos os usuários em uma Badge no mesmo Header.
