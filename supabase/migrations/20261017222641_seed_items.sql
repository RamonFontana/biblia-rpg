-- Gerado de src/content/items.ts por `npm run gen:items-seed`. Não edite à mão.
-- Espelha em `items` a identidade e a exibição de cada item do conteúdo (ADR 0003).

insert into public.items
  (slug, name, description, category, is_consumable, price, condition_resistances)
values
  ('tunica', 'Túnica Grossa (Acolchoada)', 'CA: 11 + Des. Desvantagem em Furtividade', 'Armadura', false, 5, array['envenenado']::text[]),
  ('tunica_sagrada', 'Túnica Sagrada (Levita)', 'CA: 11 + Des. Abençoada contra medos.', 'Armadura', false, 20, array['amedrontado']::text[]),
  ('couro_cru', 'Couro Cru', 'CA: 11 + Des. Armadura básica', 'Armadura', false, 10, '{}'::text[]),
  ('couro_batido', 'Couro Batido (com tachas)', 'CA: 12 + Des. Armadura leve reforçada', 'Armadura', false, 45, array['agarrado']::text[]),
  ('cota_escamas', 'Cota de Escamas de Bronze', 'CA: 14 + Des (máx 2). Desvantagem em Furtividade', 'Armadura', false, 50, array['sangrando']::text[]),
  ('peitoral_bronze', 'Peitoral de Bronze/Ferro', 'CA: 14 + Des (máx 2). Proteção superior no peito', 'Armadura', false, 400, array['sangrando', 'envenenado']::text[]),
  ('cota_malha', 'Cota de Malha de Anéis', 'CA: 14. Desvantagem em Furtividade', 'Armadura', false, 30, array['sangrando']::text[]),
  ('lorica', 'Lorica de Escamas Pesada', 'CA: 16. Desvantagem em Furtividade, Requer For 13', 'Armadura', false, 75, array['sangrando', 'atordoado']::text[]),
  ('chapeu_couro', 'Chapéu de Couro Fervido', 'Proteção básica para a cabeça. CA +1', 'Armadura', false, 2, array['cego']::text[]),
  ('elmo_bronze', 'Elmo de Bronze Fechado', 'Proteção total do rosto. CA +2. Desvantagem em Percepção.', 'Armadura', false, 15, array['atordoado', 'cego']::text[]),
  ('escudo', 'Escudo (Madeira/Bronze)', '+2 CA. Ocupa uma mão', 'Escudo', false, 10, array['impedido']::text[]),
  ('adaga', 'Faca/Adaga de Bronze', 'Acuidade, Leve, Arremesso (6/18m)', 'Arma', false, 2, '{}'::text[]),
  ('espada_curta', 'Espada Curta (Ferro)', 'Acuidade, Leve', 'Arma', false, 10, '{}'::text[]),
  ('espada_longa', 'Espada Longa / Khopesh', 'Versátil (1d10)', 'Arma', false, 15, '{}'::text[]),
  ('lanca', 'Lança Comum', 'Arremesso (6/18m), Versátil (1d8)', 'Arma', false, 5, '{}'::text[]),
  ('machado', 'Machado de Batalha', 'Versátil (1d10)', 'Arma', false, 10, '{}'::text[]),
  ('cajado', 'Cajado de Pastor', 'Versátil (1d8)', 'Arma', false, 1, '{}'::text[]),
  ('funda', 'Funda', 'Distância (9/36m), Munição', 'Arma', false, 1, '{}'::text[]),
  ('arco_curto', 'Arco Curto', 'Distância (24/96m), Duas mãos, Munição', 'Arma', false, 25, '{}'::text[]),
  ('arco_longo', 'Arco Longo', 'Distância (45/180m), Duas mãos, Pesada', 'Arma', false, 50, '{}'::text[]),
  ('dardo', 'Dardo / Azagaia', 'Arremesso (9/36m)', 'Arma', false, 3, '{}'::text[]),
  ('espada_grande', 'Espada Grande de Ferro', 'Pesada, Duas mãos.', 'Arma', false, 50, '{}'::text[]),
  ('martelo_guerra', 'Martelo de Guerra', 'Pesada, Duas mãos.', 'Arma', false, 50, '{}'::text[]),
  ('clava_grande', 'Clava Grande', 'Pesada, Duas mãos.', 'Arma', false, 5, '{}'::text[]),
  ('odre', 'Odre (Água)', 'Sustento: água de 1 dia, consumida no Descanso Longo.', 'Consumível', true, 1, '{}'::text[]),
  ('tocha', 'Tocha', 'Ilumina 6m. Queima por 1h', 'Consumível', true, 0.5, '{}'::text[]),
  ('balsamo', 'Bálsamo Curativo / Óleo', 'Cura 1d4 HP em Descanso', 'Consumível', true, 5, '{}'::text[]),
  ('racao', 'Ração de Viagem', 'Sustento: pão seco, tâmaras e queijo duro, consumida no Descanso Longo.', 'Consumível', true, 1, '{}'::text[]),
  ('pedras_funda', 'Pedra para Funda', 'Munição para funda (0.5 SP = 20 un)', 'Consumível', true, 0.025, '{}'::text[]),
  ('flechas', 'Flecha', 'Munição para arcos (1 SP = 20 un)', 'Consumível', true, 0.05, '{}'::text[]),
  ('corda', 'Corda de Cânhamo (15m)', 'Escalada, amarras', 'Utilidade', false, 1, '{}'::text[]),
  ('mochila', 'Mochila de Lona', 'Carregar itens extras', 'Utilidade', false, 2, '{}'::text[]),
  ('tenda', 'Tenda Comum', 'Abrigo para 2 pessoas', 'Utilidade', false, 10, '{}'::text[]),
  ('pederneira', 'Pederneira e Isqueiro', 'Iniciar fogo', 'Utilidade', false, 2, '{}'::text[]),
  ('simbolo_proibido', 'Amuleto/Símbolo (Proibido)', 'Amuleto profano que subtrai Fé', 'Utilidade', false, 0, '{}'::text[])
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  is_consumable = excluded.is_consumable,
  price = excluded.price,
  condition_resistances = excluded.condition_resistances;
