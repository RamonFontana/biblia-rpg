-- RLS (Onda 3, passo 7): is_session_gm, is_session_participant e is_trade_participant só servem às
-- políticas de quem está logado; perdem o EXECUTE de anon (o que o aviso do Security Advisor pede).
-- Isto só é seguro porque a migration anterior limitou as políticas a authenticated: anon não
-- avalia mais essas funções. Funções SECURITY DEFINER novas precisam do mesmo `revoke ... from
-- public, anon`; o scripts/check-rls.mjs cobra isso.

revoke execute on function public.is_session_gm(uuid) from public, anon;
revoke execute on function public.is_session_participant(uuid) from public, anon;
revoke execute on function public.is_trade_participant(uuid) from public, anon;
