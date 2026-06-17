# Data Model

## Entidade `game_sessions`

A entidade de sessão precisará sofrer uma alteração de schema simples no Supabase.

**Novos Campos**:
- `current_day` (INTEGER): Padrão `1`.
- `current_period` (TEXT): Padrão `'Manhã'`. Restrito idealmente por Constraint ou assumido nas regras de negócio para assumir os valores `'Manhã'`, `'Tarde'` e `'Noite'`.

Não há novas entidades ou relações necessárias para suprir o escopo da especificação atual. A interface receberá esses dados sincronizados via broadcast/realtime e a alteração será feita através de um botão no front-end enviando `update()` pelo cliente do Supabase.
