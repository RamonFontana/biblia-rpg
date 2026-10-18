-- RLS (Onda 3, passo 7): apaga add_kit_to_character.
-- Nenhum código a chama e ela já não funciona: o ON CONFLICT (character_id, item_id) não casa com
-- a restrição única atual (character_id, item_id, level). Era SECURITY DEFINER sem checagem de
-- dono, executável por anon: qualquer um podia dar itens a qualquer personagem.

drop function public.add_kit_to_character(uuid, uuid);
