-- RLS (Onda 3, passo 7): can_manage_character diz se quem chama pode escrever nos itens de um
-- personagem: o dono, ou o Mestre de uma sessão ATIVA da qual o personagem participa (a mesma
-- regra das políticas de UPDATE de characters). Usada pelas políticas de character_items e por
-- use_consumable_item.

create or replace function public.can_manage_character(check_character_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.characters c
    where c.id = check_character_id and c.user_id = auth.uid()
  ) or exists (
    select 1
    from public.session_participants sp
    join public.game_sessions gs on gs.id = sp.session_id
    where sp.character_id = check_character_id
      and gs.gm_id = auth.uid()
      and gs.status = 'active'
  );
$$;

revoke execute on function public.can_manage_character(uuid) from public, anon;
grant execute on function public.can_manage_character(uuid) to authenticated, service_role;
