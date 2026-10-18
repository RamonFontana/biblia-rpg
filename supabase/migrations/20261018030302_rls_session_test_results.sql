-- RLS (Onda 3, passo 7): session_test_results.
-- Antes: leitura e criação com `true` para todos os papéis, inclusive anon, e qualquer logado podia
-- inserir o resultado de qualquer jogador. Agora: o Mestre e os jogadores da sessão do Teste leem;
-- só o Mestre da sessão cria os resultados; o dono do resultado (player_id) ou o Mestre o grava.
-- O jogador não consegue passar o resultado para outro jogador (WITH CHECK).

drop policy "Anyone can read session_test_results" on public.session_test_results;
drop policy "Masters can insert session_test_results" on public.session_test_results;
drop policy "Players can update their own results" on public.session_test_results;

create policy "Session members can read test results"
  on public.session_test_results for select to authenticated
  using (exists (
    select 1 from public.session_tests t
    where t.id = session_test_results.test_id
      and (public.is_session_gm(t.session_id) or public.is_session_participant(t.session_id))
  ));

create policy "Session GM can create test results"
  on public.session_test_results for insert to authenticated
  with check (exists (
    select 1 from public.session_tests t
    where t.id = session_test_results.test_id and public.is_session_gm(t.session_id)
  ));

create policy "Player and session GM can update test results"
  on public.session_test_results for update to authenticated
  using (
    auth.uid() = player_id
    or exists (
      select 1 from public.session_tests t
      where t.id = session_test_results.test_id and public.is_session_gm(t.session_id)
    )
  )
  with check (
    auth.uid() = player_id
    or exists (
      select 1 from public.session_tests t
      where t.id = session_test_results.test_id and public.is_session_gm(t.session_id)
    )
  );
