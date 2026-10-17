-- Identidade estável dos itens (ADR 0003, Onda 3 passo 4): `items.slug` é o id do item em
-- src/content/items.ts. O app passa a procurar o item por slug em vez de por nome.
--
-- 1. adiciona a coluna e preenche as linhas existentes pelo nome (catálogo + os dois nomes que o
--    banco guardava de outro jeito: "Flechas" e "Saco de Pedras para Funda");
-- 2. aborta se sobrar linha sem slug ou se dois itens caírem no mesmo slug (duplicata criada pelo
--    app antes desta migration: una as linhas à mão e rode de novo);
-- 3. torna o slug obrigatório e único;
-- 4. `price` passa a numeric: o catálogo tem preços fracionados (flecha 0,05; pedra 0,025) que a
--    coluna integer arredondava.

alter table public.items add column slug text;

update public.items as i
set slug = m.slug
from (values
  ('Túnica Grossa (Acolchoada)', 'tunica'),
  ('Túnica Sagrada (Levita)', 'tunica_sagrada'),
  ('Couro Cru', 'couro_cru'),
  ('Couro Batido (com tachas)', 'couro_batido'),
  ('Cota de Escamas de Bronze', 'cota_escamas'),
  ('Peitoral de Bronze/Ferro', 'peitoral_bronze'),
  ('Cota de Malha de Anéis', 'cota_malha'),
  ('Lorica de Escamas Pesada', 'lorica'),
  ('Chapéu de Couro Fervido', 'chapeu_couro'),
  ('Elmo de Bronze Fechado', 'elmo_bronze'),
  ('Escudo (Madeira/Bronze)', 'escudo'),
  ('Faca/Adaga de Bronze', 'adaga'),
  ('Espada Curta (Ferro)', 'espada_curta'),
  ('Espada Longa / Khopesh', 'espada_longa'),
  ('Lança Comum', 'lanca'),
  ('Machado de Batalha', 'machado'),
  ('Cajado de Pastor', 'cajado'),
  ('Funda', 'funda'),
  ('Arco Curto', 'arco_curto'),
  ('Arco Longo', 'arco_longo'),
  ('Dardo / Azagaia', 'dardo'),
  ('Espada Grande de Ferro', 'espada_grande'),
  ('Martelo de Guerra', 'martelo_guerra'),
  ('Clava Grande', 'clava_grande'),
  ('Odre (Água)', 'odre'),
  ('Tocha', 'tocha'),
  ('Bálsamo Curativo / Óleo', 'balsamo'),
  ('Ração de Viagem', 'racao'),
  ('Pedra para Funda', 'pedras_funda'),
  ('Flecha', 'flechas'),
  ('Corda de Cânhamo (15m)', 'corda'),
  ('Mochila de Lona', 'mochila'),
  ('Tenda Comum', 'tenda'),
  ('Pederneira e Isqueiro', 'pederneira'),
  ('Amuleto/Símbolo (Proibido)', 'simbolo_proibido'),
  ('Flechas', 'flechas'),
  ('Saco de Pedras para Funda', 'pedras_funda')
) as m(name, slug)
where i.name = m.name;

do $$
begin
  if exists (select 1 from public.items where slug is null) then
    raise exception 'items sem slug: %',
      (select string_agg(name, ', ' order by name) from public.items where slug is null);
  end if;
  if exists (select 1 from public.items group by slug having count(*) > 1) then
    raise exception 'itens duplicados para o slug: %',
      (select string_agg(slug, ', ' order by slug) from (
        select slug from public.items group by slug having count(*) > 1
      ) as dup);
  end if;
end
$$;

alter table public.items alter column slug set not null;
alter table public.items add constraint items_slug_key unique (slug);

alter table public.items alter column price type numeric using price::numeric;
