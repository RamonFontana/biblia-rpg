
INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('tunica', 'Túnica Grossa (Acolchoada)', 'Armadura', 'CA: 11 + Des. Desvantagem em Furtividade', false, 5, 1, 11, NULL, ARRAY['poisoned']::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('tunica_sagrada', 'Túnica Sagrada (Levita)', 'Armadura', 'CA: 11 + Des. Abençoada contra medos.', false, 20, 2, 11, NULL, ARRAY['frightened']::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('couro_cru', 'Couro Cru', 'Armadura', 'CA: 11 + Des. Armadura básica', false, 10, 1, 11, NULL, ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('couro_batido', 'Couro Batido (com tachas)', 'Armadura', 'CA: 12 + Des. Armadura leve reforçada', false, 45, 2, 12, NULL, ARRAY['grappled']::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('cota_escamas', 'Cota de Escamas de Bronze', 'Armadura', 'CA: 14 + Des (máx 2). Desvantagem em Furtividade', false, 50, 2, 14, NULL, ARRAY['bleeding']::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('peitoral_bronze', 'Peitoral de Bronze/Ferro', 'Armadura', 'CA: 14 + Des (máx 2). Proteção superior no peito', false, 400, 3, 14, NULL, ARRAY['bleeding','poisoned']::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('cota_malha', 'Cota de Malha de Anéis', 'Armadura', 'CA: 14. Desvantagem em Furtividade', false, 30, 3, 14, NULL, ARRAY['bleeding']::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('lorica', 'Lorica de Escamas Pesada', 'Armadura', 'CA: 16. Desvantagem em Furtividade, Requer For 13', false, 75, 4, 16, NULL, ARRAY['bleeding','stunned']::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('chapeu_couro', 'Chapéu de Couro Fervido', 'Armadura', 'Proteção básica para a cabeça.', false, 2, 1, 0, NULL, ARRAY['blinded']::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('elmo_bronze', 'Elmo de Bronze Fechado', 'Armadura', 'Proteção total do rosto. Desvantagem em Percepção.', false, 15, 3, 0, NULL, ARRAY['stunned','blinded']::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('escudo', 'Escudo (Madeira/Bronze)', 'Escudo', '+2 CA. Ocupa uma mão', false, 10, 2, 2, NULL, ARRAY['restrained']::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('adaga', 'Faca/Adaga de Bronze', 'Arma', 'Acuidade, Leve, Arremesso (6/18m)', false, 2, 1, 0, '1d4 perfurante', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('espada_curta', 'Espada Curta (Ferro)', 'Arma', 'Acuidade, Leve', false, 10, 1, 0, '1d6 cortante', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('espada_longa', 'Espada Longa / Khopesh', 'Arma', 'Versátil (1d10)', false, 15, 1, 0, '1d8 cortante', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('lanca', 'Lança Comum', 'Arma', 'Arremesso (6/18m), Versátil (1d8)', false, 5, 1, 0, '1d6 perfurante', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('machado', 'Machado de Batalha', 'Arma', 'Versátil (1d10)', false, 10, 1, 0, '1d8 cortante', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('cajado', 'Cajado de Pastor', 'Arma', 'Versátil (1d8)', false, 1, 1, 0, '1d6 concussão', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('funda', 'Funda', 'Arma', 'Distância (9/36m), Munição', false, 1, 1, 0, '1d4 concussão', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('arco_curto', 'Arco Curto', 'Arma', 'Distância (24/96m), Duas mãos, Munição', false, 25, 1, 0, '1d6 perfurante', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('arco_longo', 'Arco Longo', 'Arma', 'Distância (45/180m), Duas mãos, Pesada', false, 50, 1, 0, '1d8 perfurante', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('dardo', 'Dardo / Azagaia', 'Arma', 'Arremesso (9/36m)', false, 3, 1, 0, '1d6 perfurante', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('odre', 'Odre (Água)', 'Consumível', 'Cura 2 PV. Sobrevivência no deserto (1 dia)', true, 1, 1, 0, NULL, ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('tocha', 'Tocha', 'Consumível', 'Ilumina 6m. Queima por 1h', true, 0.5, 1, 0, NULL, ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('balsamo', 'Bálsamo Curativo / Óleo', 'Consumível', 'Cura 1d4 HP em Descanso', true, 5, 1, 0, NULL, ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('racao', 'Ração de Viagem', 'Consumível', 'Cura 1d4 PV. 1 dia de nutrição', true, 1, 1, 0, NULL, ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('pedras_funda', 'Saco de Pedras para Funda', 'Consumível', '20 pedras', true, 0.5, 1, 0, NULL, ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('flechas', 'Flechas', 'Consumível', '20 flechas para arcos', true, 1, 1, 0, NULL, ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('corda', 'Corda de Cânhamo (15m)', 'Utilidade', 'Escalada, amarras', false, 1, 1, 0, NULL, ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('mochila', 'Mochila de Lona', 'Utilidade', 'Carregar itens extras', false, 2, 1, 0, NULL, ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('tenda', 'Tenda Comum', 'Utilidade', 'Abrigo para 2 pessoas', false, 10, 1, 0, NULL, ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('pederneira', 'Pederneira e Isqueiro', 'Utilidade', 'Iniciar fogo', false, 2, 1, 0, NULL, ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;

INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('simbolo_proibido', 'Amuleto/Símbolo (Proibido)', 'Utilidade', 'Amuleto profano que subtrai Fé', false, 0, 1, 0, NULL, ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;
