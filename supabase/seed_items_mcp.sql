DO $$
BEGIN

  UPDATE items SET 
    category = 'Armadura',
    description = 'CA: 11 + Des. Desvantagem em Furtividade',
    is_consumable = false,
    price = 5,
    level = 1,
    armor_class = 11,
    damage = NULL,
    condition_resistances = ARRAY['poisoned']::text[]
  WHERE name = 'Túnica Grossa (Acolchoada)';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Túnica Grossa (Acolchoada)', 'Armadura', 'CA: 11 + Des. Desvantagem em Furtividade', false, 5, 1, 11, NULL, ARRAY['poisoned']::text[]);
  END IF;

  UPDATE items SET 
    category = 'Armadura',
    description = 'CA: 11 + Des. Abençoada contra medos.',
    is_consumable = false,
    price = 20,
    level = 2,
    armor_class = 11,
    damage = NULL,
    condition_resistances = ARRAY['frightened']::text[]
  WHERE name = 'Túnica Sagrada (Levita)';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Túnica Sagrada (Levita)', 'Armadura', 'CA: 11 + Des. Abençoada contra medos.', false, 20, 2, 11, NULL, ARRAY['frightened']::text[]);
  END IF;

  UPDATE items SET 
    category = 'Armadura',
    description = 'CA: 11 + Des. Armadura básica',
    is_consumable = false,
    price = 10,
    level = 1,
    armor_class = 11,
    damage = NULL,
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Couro Cru';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Couro Cru', 'Armadura', 'CA: 11 + Des. Armadura básica', false, 10, 1, 11, NULL, ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Armadura',
    description = 'CA: 12 + Des. Armadura leve reforçada',
    is_consumable = false,
    price = 45,
    level = 2,
    armor_class = 12,
    damage = NULL,
    condition_resistances = ARRAY['grappled']::text[]
  WHERE name = 'Couro Batido (com tachas)';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Couro Batido (com tachas)', 'Armadura', 'CA: 12 + Des. Armadura leve reforçada', false, 45, 2, 12, NULL, ARRAY['grappled']::text[]);
  END IF;

  UPDATE items SET 
    category = 'Armadura',
    description = 'CA: 14 + Des (máx 2). Desvantagem em Furtividade',
    is_consumable = false,
    price = 50,
    level = 2,
    armor_class = 14,
    damage = NULL,
    condition_resistances = ARRAY['bleeding']::text[]
  WHERE name = 'Cota de Escamas de Bronze';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Cota de Escamas de Bronze', 'Armadura', 'CA: 14 + Des (máx 2). Desvantagem em Furtividade', false, 50, 2, 14, NULL, ARRAY['bleeding']::text[]);
  END IF;

  UPDATE items SET 
    category = 'Armadura',
    description = 'CA: 14 + Des (máx 2). Proteção superior no peito',
    is_consumable = false,
    price = 400,
    level = 3,
    armor_class = 14,
    damage = NULL,
    condition_resistances = ARRAY['bleeding','poisoned']::text[]
  WHERE name = 'Peitoral de Bronze/Ferro';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Peitoral de Bronze/Ferro', 'Armadura', 'CA: 14 + Des (máx 2). Proteção superior no peito', false, 400, 3, 14, NULL, ARRAY['bleeding','poisoned']::text[]);
  END IF;

  UPDATE items SET 
    category = 'Armadura',
    description = 'CA: 14. Desvantagem em Furtividade',
    is_consumable = false,
    price = 30,
    level = 3,
    armor_class = 14,
    damage = NULL,
    condition_resistances = ARRAY['bleeding']::text[]
  WHERE name = 'Cota de Malha de Anéis';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Cota de Malha de Anéis', 'Armadura', 'CA: 14. Desvantagem em Furtividade', false, 30, 3, 14, NULL, ARRAY['bleeding']::text[]);
  END IF;

  UPDATE items SET 
    category = 'Armadura',
    description = 'CA: 16. Desvantagem em Furtividade, Requer For 13',
    is_consumable = false,
    price = 75,
    level = 4,
    armor_class = 16,
    damage = NULL,
    condition_resistances = ARRAY['bleeding','stunned']::text[]
  WHERE name = 'Lorica de Escamas Pesada';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Lorica de Escamas Pesada', 'Armadura', 'CA: 16. Desvantagem em Furtividade, Requer For 13', false, 75, 4, 16, NULL, ARRAY['bleeding','stunned']::text[]);
  END IF;

  UPDATE items SET 
    category = 'Armadura',
    description = 'Proteção básica para a cabeça.',
    is_consumable = false,
    price = 2,
    level = 1,
    armor_class = 0,
    damage = NULL,
    condition_resistances = ARRAY['blinded']::text[]
  WHERE name = 'Chapéu de Couro Fervido';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Chapéu de Couro Fervido', 'Armadura', 'Proteção básica para a cabeça.', false, 2, 1, 0, NULL, ARRAY['blinded']::text[]);
  END IF;

  UPDATE items SET 
    category = 'Armadura',
    description = 'Proteção total do rosto. Desvantagem em Percepção.',
    is_consumable = false,
    price = 15,
    level = 3,
    armor_class = 0,
    damage = NULL,
    condition_resistances = ARRAY['stunned','blinded']::text[]
  WHERE name = 'Elmo de Bronze Fechado';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Elmo de Bronze Fechado', 'Armadura', 'Proteção total do rosto. Desvantagem em Percepção.', false, 15, 3, 0, NULL, ARRAY['stunned','blinded']::text[]);
  END IF;

  UPDATE items SET 
    category = 'Escudo',
    description = '+2 CA. Ocupa uma mão',
    is_consumable = false,
    price = 10,
    level = 2,
    armor_class = 2,
    damage = NULL,
    condition_resistances = ARRAY['restrained']::text[]
  WHERE name = 'Escudo (Madeira/Bronze)';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Escudo (Madeira/Bronze)', 'Escudo', '+2 CA. Ocupa uma mão', false, 10, 2, 2, NULL, ARRAY['restrained']::text[]);
  END IF;

  UPDATE items SET 
    category = 'Arma',
    description = 'Acuidade, Leve, Arremesso (6/18m)',
    is_consumable = false,
    price = 2,
    level = 1,
    armor_class = 0,
    damage = '1d4 perfurante',
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Faca/Adaga de Bronze';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Faca/Adaga de Bronze', 'Arma', 'Acuidade, Leve, Arremesso (6/18m)', false, 2, 1, 0, '1d4 perfurante', ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Arma',
    description = 'Acuidade, Leve',
    is_consumable = false,
    price = 10,
    level = 1,
    armor_class = 0,
    damage = '1d6 cortante',
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Espada Curta (Ferro)';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Espada Curta (Ferro)', 'Arma', 'Acuidade, Leve', false, 10, 1, 0, '1d6 cortante', ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Arma',
    description = 'Versátil (1d10)',
    is_consumable = false,
    price = 15,
    level = 1,
    armor_class = 0,
    damage = '1d8 cortante',
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Espada Longa / Khopesh';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Espada Longa / Khopesh', 'Arma', 'Versátil (1d10)', false, 15, 1, 0, '1d8 cortante', ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Arma',
    description = 'Arremesso (6/18m), Versátil (1d8)',
    is_consumable = false,
    price = 5,
    level = 1,
    armor_class = 0,
    damage = '1d6 perfurante',
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Lança Comum';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Lança Comum', 'Arma', 'Arremesso (6/18m), Versátil (1d8)', false, 5, 1, 0, '1d6 perfurante', ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Arma',
    description = 'Versátil (1d10)',
    is_consumable = false,
    price = 10,
    level = 1,
    armor_class = 0,
    damage = '1d8 cortante',
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Machado de Batalha';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Machado de Batalha', 'Arma', 'Versátil (1d10)', false, 10, 1, 0, '1d8 cortante', ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Arma',
    description = 'Versátil (1d8)',
    is_consumable = false,
    price = 1,
    level = 1,
    armor_class = 0,
    damage = '1d6 concussão',
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Cajado de Pastor';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Cajado de Pastor', 'Arma', 'Versátil (1d8)', false, 1, 1, 0, '1d6 concussão', ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Arma',
    description = 'Distância (9/36m), Munição',
    is_consumable = false,
    price = 1,
    level = 1,
    armor_class = 0,
    damage = '1d4 concussão',
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Funda';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Funda', 'Arma', 'Distância (9/36m), Munição', false, 1, 1, 0, '1d4 concussão', ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Arma',
    description = 'Distância (24/96m), Duas mãos, Munição',
    is_consumable = false,
    price = 25,
    level = 1,
    armor_class = 0,
    damage = '1d6 perfurante',
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Arco Curto';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Arco Curto', 'Arma', 'Distância (24/96m), Duas mãos, Munição', false, 25, 1, 0, '1d6 perfurante', ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Arma',
    description = 'Distância (45/180m), Duas mãos, Pesada',
    is_consumable = false,
    price = 50,
    level = 1,
    armor_class = 0,
    damage = '1d8 perfurante',
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Arco Longo';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Arco Longo', 'Arma', 'Distância (45/180m), Duas mãos, Pesada', false, 50, 1, 0, '1d8 perfurante', ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Arma',
    description = 'Arremesso (9/36m)',
    is_consumable = false,
    price = 3,
    level = 1,
    armor_class = 0,
    damage = '1d6 perfurante',
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Dardo / Azagaia';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Dardo / Azagaia', 'Arma', 'Arremesso (9/36m)', false, 3, 1, 0, '1d6 perfurante', ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Consumível',
    description = 'Cura 2 PV. Sobrevivência no deserto (1 dia)',
    is_consumable = true,
    price = 1,
    level = 1,
    armor_class = 0,
    damage = NULL,
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Odre (Água)';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Odre (Água)', 'Consumível', 'Cura 2 PV. Sobrevivência no deserto (1 dia)', true, 1, 1, 0, NULL, ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Consumível',
    description = 'Ilumina 6m. Queima por 1h',
    is_consumable = true,
    price = 1,
    level = 1,
    armor_class = 0,
    damage = NULL,
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Tocha';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Tocha', 'Consumível', 'Ilumina 6m. Queima por 1h', true, 1, 1, 0, NULL, ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Consumível',
    description = 'Cura 1d4 HP em Descanso',
    is_consumable = true,
    price = 5,
    level = 1,
    armor_class = 0,
    damage = NULL,
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Bálsamo Curativo / Óleo';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Bálsamo Curativo / Óleo', 'Consumível', 'Cura 1d4 HP em Descanso', true, 5, 1, 0, NULL, ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Consumível',
    description = 'Cura 1d4 PV. 1 dia de nutrição',
    is_consumable = true,
    price = 1,
    level = 1,
    armor_class = 0,
    damage = NULL,
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Ração de Viagem';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Ração de Viagem', 'Consumível', 'Cura 1d4 PV. 1 dia de nutrição', true, 1, 1, 0, NULL, ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Consumível',
    description = '20 pedras',
    is_consumable = true,
    price = 1,
    level = 1,
    armor_class = 0,
    damage = NULL,
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Saco de Pedras para Funda';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Saco de Pedras para Funda', 'Consumível', 'Pedras para funda', true, 1, 1, 0, NULL, ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Consumível',
    description = 'Flechas para arcos',
    is_consumable = true,
    price = 1,
    level = 1,
    armor_class = 0,
    damage = NULL,
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Flechas';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Flechas', 'Consumível', 'Flechas para arcos', true, 1, 1, 0, NULL, ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Utilidade',
    description = 'Escalada, amarras',
    is_consumable = false,
    price = 1,
    level = 1,
    armor_class = 0,
    damage = NULL,
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Corda de Cânhamo (15m)';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Corda de Cânhamo (15m)', 'Utilidade', 'Escalada, amarras', false, 1, 1, 0, NULL, ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Utilidade',
    description = 'Carregar itens extras',
    is_consumable = false,
    price = 2,
    level = 1,
    armor_class = 0,
    damage = NULL,
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Mochila de Lona';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Mochila de Lona', 'Utilidade', 'Carregar itens extras', false, 2, 1, 0, NULL, ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Utilidade',
    description = 'Abrigo para 2 pessoas',
    is_consumable = false,
    price = 10,
    level = 1,
    armor_class = 0,
    damage = NULL,
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Tenda Comum';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Tenda Comum', 'Utilidade', 'Abrigo para 2 pessoas', false, 10, 1, 0, NULL, ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Utilidade',
    description = 'Iniciar fogo',
    is_consumable = false,
    price = 2,
    level = 1,
    armor_class = 0,
    damage = NULL,
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Pederneira e Isqueiro';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Pederneira e Isqueiro', 'Utilidade', 'Iniciar fogo', false, 2, 1, 0, NULL, ARRAY[]::text[]);
  END IF;

  UPDATE items SET 
    category = 'Utilidade',
    description = 'Amuleto profano que subtrai Fé',
    is_consumable = false,
    price = 0,
    level = 1,
    armor_class = 0,
    damage = NULL,
    condition_resistances = ARRAY[]::text[]
  WHERE name = 'Amuleto/Símbolo (Proibido)';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('Amuleto/Símbolo (Proibido)', 'Utilidade', 'Amuleto profano que subtrai Fé', false, 0, 1, 0, NULL, ARRAY[]::text[]);
  END IF;
END $$;