-- Realtime: `session_participants` entra na publicação.
--
-- O app assina essa tabela no mesmo canal de `characters`, `character_items`, `session_npcs` e
-- `combats` (`useSessionCharacters`). Sem ela na publicação o servidor responde "Unable to
-- subscribe to changes with given parameters" e descarta o canal inteiro, então nenhuma dessas
-- mudanças chegava à mesa em tempo real (um NPC tornado visível só aparecia ao recarregar).
--
-- A leitura continua protegida pelas políticas de SELECT da tabela: o Realtime só entrega a linha a
-- quem poderia consultá-la. O bloco é idempotente: se a tabela já estiver na publicação, nada muda.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'session_participants'
  ) then
    alter publication supabase_realtime add table public.session_participants;
  end if;
end
$$;
