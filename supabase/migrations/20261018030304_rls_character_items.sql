-- RLS (Onda 3, passo 7): character_items.
-- Antes: "Users can manage their own character items" deixava qualquer usuário logado inserir,
-- alterar e apagar os itens de qualquer personagem. Agora a leitura segue para todo usuário
-- logado (a lista de personagens também é aberta a ele) e a escrita só para o dono do personagem
-- ou o Mestre de uma sessão ativa em que ele participa (can_manage_character). As trocas seguem
-- pela função execute_trade, que ignora o RLS.

drop policy "Users can manage their own character items" on public.character_items;

create policy "Owner and session GM can insert character items"
  on public.character_items for insert to authenticated
  with check (public.can_manage_character(character_id));

create policy "Owner and session GM can update character items"
  on public.character_items for update to authenticated
  using (public.can_manage_character(character_id))
  with check (public.can_manage_character(character_id));

create policy "Owner and session GM can delete character items"
  on public.character_items for delete to authenticated
  using (public.can_manage_character(character_id));
