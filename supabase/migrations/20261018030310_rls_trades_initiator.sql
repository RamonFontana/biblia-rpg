-- RLS (Onda 3, passo 7): trades (INSERT).
-- Antes: qualquer participante da sessão criava uma troca em nome de OUTRO usuário
-- (initiator_user_id) e com o personagem de outro como iniciador; com o alvo sendo o dele, ele
-- marcava os dois lados como prontos e execute_trade movia os itens da vítima. Agora quem cria a
-- troca é o iniciador (initiator_user_id = auth.uid()) e o personagem iniciador, se houver, é dele.
-- O Mestre inicia troca de loja sem personagem iniciador.

drop policy "Session participants can create trades" on public.trades;

create policy "Session participants can create their own trades"
  on public.trades for insert to authenticated
  with check (
    initiator_user_id = auth.uid()
    and (public.is_session_gm(session_id) or public.is_session_participant(session_id))
    and (
      initiator_character_id is null
      or exists (
        select 1 from public.characters c
        where c.id = initiator_character_id and c.user_id = auth.uid()
      )
    )
  );
