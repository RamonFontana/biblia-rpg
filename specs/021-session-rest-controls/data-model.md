# Data Model: Controle de Descansos da Sessão

## Entidades e Tabelas Alteradas

### `game_sessions` (Tabela Existente)

Novas colunas a serem adicionadas na migration do Supabase:
- `short_rests_today`: `integer` (default: `0`) - Conta quantos descansos curtos foram tirados no dia de jogo atual. É resetado para `0` sempre que o período avança de 'Noite' para 'Manhã'.
- `last_long_rest_day`: `integer` (default: `1`) - Registra em qual dia (`current_day`) da campanha o último descanso longo foi tirado, para garantir a regra de restrição de 2 dias.
