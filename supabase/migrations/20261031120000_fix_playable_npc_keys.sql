-- Converte as fichas de NPC jogável gravadas com chaves em inglês (Onda 6, ticket 07).
--
-- Antes, a criação da sessão gravava `attributes` como strength/dexterity/constitution/intelligence/
-- wisdom/charisma e a CA em `stats.armor_class`, mas todo leitor espera for/des/con/int/sab/car, e a
-- CA vem do equipamento. O NPC ficava com modificadores 0, CA 10 e a CD da Habilidade errada.
-- A função renomeia as chaves e tira `stats.armor_class`; é idempotente (só mexe em quem ainda tem
-- as chaves antigas) e devolve quantas fichas converteu.

create function public.convert_playable_npc_keys()
returns integer
language plpgsql
set search_path to 'public'
as $$
declare converted integer;
begin
  update public.characters
  set attributes = (attributes - 'strength' - 'dexterity' - 'constitution' - 'intelligence' - 'wisdom' - 'charisma')
        || jsonb_build_object(
          'for', coalesce(attributes -> 'strength', attributes -> 'for', '10'::jsonb),
          'des', coalesce(attributes -> 'dexterity', attributes -> 'des', '10'::jsonb),
          'con', coalesce(attributes -> 'constitution', attributes -> 'con', '10'::jsonb),
          'int', coalesce(attributes -> 'intelligence', attributes -> 'int', '10'::jsonb),
          'sab', coalesce(attributes -> 'wisdom', attributes -> 'sab', '10'::jsonb),
          'car', coalesce(attributes -> 'charisma', attributes -> 'car', '10'::jsonb)
        ),
      stats = stats - 'armor_class'
  where is_npc
    and (attributes ? 'strength' or attributes ? 'dexterity' or attributes ? 'constitution'
      or attributes ? 'intelligence' or attributes ? 'wisdom' or attributes ? 'charisma'
      or stats ? 'armor_class');
  get diagnostics converted = row_count;
  return converted;
end $$;

revoke execute on function public.convert_playable_npc_keys() from public, anon, authenticated;

select public.convert_playable_npc_keys();
