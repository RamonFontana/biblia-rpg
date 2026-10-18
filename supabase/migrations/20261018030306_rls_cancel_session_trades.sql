-- RLS (Onda 3, passo 7): cancel_session_trades.
-- Antes: SECURITY DEFINER sem checagem, executável por anon: qualquer um cancelava as trocas de
-- qualquer sessão. Agora só o Mestre da sessão e só para usuário logado.

create or replace function public.cancel_session_trades(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_session_gm(p_session_id) then
    raise exception 'Apenas o Mestre da sessão pode cancelar as trocas' using errcode = '42501';
  end if;

  update public.trades
  set status = 'cancelled', completed_at = now()
  where session_id = p_session_id
    and status in ('pending', 'active');
end;
$$;

revoke execute on function public.cancel_session_trades(uuid) from public, anon;
