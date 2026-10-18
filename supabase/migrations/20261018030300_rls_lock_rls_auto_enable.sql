-- RLS (Onda 3, passo 7): rls_auto_enable é só a função do gatilho ensure_rls (liga o RLS em toda
-- tabela nova). Ninguém precisa chamá-la pela API (/rest/v1/rpc), então perde o EXECUTE de anon e
-- authenticated. O gatilho de evento segue funcionando: o Postgres não checa EXECUTE ao disparar.

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
