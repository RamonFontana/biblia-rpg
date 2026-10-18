-- RLS (Onda 3, passo 7): session_tests.
-- Antes: SELECT, INSERT e UPDATE com `true` para todos os papéis, inclusive anon. Agora só quem
-- está logado: o Mestre da sessão cria e altera os Testes; o Mestre e os jogadores da sessão leem.

drop policy "Anyone can read session_tests" on public.session_tests;
drop policy "Masters can insert session_tests" on public.session_tests;
drop policy "Masters can update session_tests" on public.session_tests;

create policy "Session members can read tests"
  on public.session_tests for select to authenticated
  using (public.is_session_gm(session_id) or public.is_session_participant(session_id));

create policy "Session GM can create tests"
  on public.session_tests for insert to authenticated
  with check (public.is_session_gm(session_id));

create policy "Session GM can update tests"
  on public.session_tests for update to authenticated
  using (public.is_session_gm(session_id))
  with check (public.is_session_gm(session_id));
