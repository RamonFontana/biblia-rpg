-- RLS (Onda 3, passo 7): use_consumable_item.
-- Antes: SECURITY DEFINER sem search_path e sem checar quem chama, executável por anon: qualquer
-- um gastava os consumíveis de qualquer personagem. Agora fixa o search_path, exige o dono do
-- personagem ou o Mestre de uma sessão ativa dele (can_manage_character) e perde o EXECUTE de anon.
-- O corpo continua o mesmo: só desconta uma unidade e apaga a linha no fim.

create or replace function public.use_consumable_item(
  p_character_item_id uuid,
  p_target_character_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_quantity integer;
  v_is_consumable boolean;
  v_character_id uuid;
begin
  -- Get current quantity and check if consumable
  select ci.quantity, i.is_consumable, ci.character_id
  into v_quantity, v_is_consumable, v_character_id
  from public.character_items ci
  join public.items i on i.id = ci.item_id
  where ci.id = p_character_item_id;

  if not found then
    return false;
  end if;

  if not public.can_manage_character(v_character_id) then
    raise exception 'Apenas o dono do personagem ou o Mestre da sessão usa o item' using errcode = '42501';
  end if;

  if not v_is_consumable then
    return false;
  end if;

  if v_quantity > 1 then
    update public.character_items set quantity = quantity - 1 where id = p_character_item_id;
  else
    delete from public.character_items where id = p_character_item_id;
  end if;

  return true;
end;
$$;

revoke execute on function public.use_consumable_item(uuid, uuid) from public, anon;
