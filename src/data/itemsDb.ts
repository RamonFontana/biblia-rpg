import type { EquipmentItem } from '../features/character-creation/types';

export type ItemCategory = 'Simples' | 'Marcial' | 'Leve' | 'Média' | 'Pesada' | 'Escudo' | 'Todas';

export type ShopItem = EquipmentItem & { category: ItemCategory, properties?: string[], statPenalty?: { stat: string, value: number, type: string } };

export const ITEMS_DB: ShopItem[] = [
  // Armaduras
  { id: 'tunica', name: 'Túnica Grossa (Acolchoada)', type: 'Armadura', cost: 5, armorClass: 11, category: 'Leve', description: 'CA: 11 + Des. Desvantagem em Furtividade', properties: ['stealth_disadvantage'] },
  { id: 'couro_cru', name: 'Couro Cru', type: 'Armadura', cost: 10, armorClass: 11, category: 'Leve', description: 'CA: 11 + Des. Armadura básica' },
  { id: 'couro_batido', name: 'Couro Batido (com tachas)', type: 'Armadura', cost: 45, armorClass: 12, category: 'Leve', description: 'CA: 12 + Des. Armadura leve reforçada' },
  { id: 'cota_escamas', name: 'Cota de Escamas de Bronze', type: 'Armadura', cost: 50, armorClass: 14, category: 'Média', description: 'CA: 14 + Des (máx 2). Desvantagem em Furtividade', properties: ['stealth_disadvantage'] },
  { id: 'peitoral_bronze', name: 'Peitoral de Bronze/Ferro', type: 'Armadura', cost: 400, armorClass: 14, category: 'Média', description: 'CA: 14 + Des (máx 2). Proteção superior no peito' },
  { id: 'cota_malha', name: 'Cota de Malha de Anéis', type: 'Armadura', cost: 30, armorClass: 14, category: 'Pesada', description: 'CA: 14. Desvantagem em Furtividade', properties: ['stealth_disadvantage'] },
  { id: 'lorica', name: 'Lorica de Escamas Pesada', type: 'Armadura', cost: 75, armorClass: 16, category: 'Pesada', description: 'CA: 16. Desvantagem em Furtividade, Requer For 13', properties: ['stealth_disadvantage', 'heavy'] },
  { id: 'escudo', name: 'Escudo (Madeira/Bronze)', type: 'Escudo', cost: 10, armorClass: 2, category: 'Escudo', description: '+2 CA. Ocupa uma mão' },

  // Armas
  { id: 'adaga', name: 'Faca/Adaga de Bronze', type: 'Arma', cost: 2, damage: '1d4 perfurante', category: 'Simples', description: 'Acuidade, Leve, Arremesso (6/18m)', properties: ['finesse', 'thrown'] },
  { id: 'espada_curta', name: 'Espada Curta (Ferro)', type: 'Arma', cost: 10, damage: '1d6 cortante', category: 'Marcial', description: 'Acuidade, Leve', properties: ['finesse'] },
  { id: 'espada_longa', name: 'Espada Longa / Khopesh', type: 'Arma', cost: 15, damage: '1d8 cortante', category: 'Marcial', description: 'Versátil (1d10)', properties: ['versatile'] },
  { id: 'lanca', name: 'Lança Comum', type: 'Arma', cost: 5, damage: '1d6 perfurante', category: 'Simples', description: 'Arremesso (6/18m), Versátil (1d8)', properties: ['thrown', 'versatile'] },
  { id: 'machado', name: 'Machado de Batalha', type: 'Arma', cost: 10, damage: '1d8 cortante', category: 'Marcial', description: 'Versátil (1d10)', properties: ['versatile'] },
  { id: 'cajado', name: 'Cajado de Pastor', type: 'Arma', cost: 1, damage: '1d6 concussão', category: 'Simples', description: 'Versátil (1d8)', properties: ['versatile'] },
  { id: 'funda', name: 'Funda', type: 'Arma', cost: 1, damage: '1d4 concussão', category: 'Simples', description: 'Distância (9/36m), Munição', properties: ['ammunition'] },
  { id: 'arco_curto', name: 'Arco Curto', type: 'Arma', cost: 25, damage: '1d6 perfurante', category: 'Marcial', description: 'Distância (24/96m), Duas mãos, Munição', properties: ['ammunition'] },
  { id: 'arco_longo', name: 'Arco Longo', type: 'Arma', cost: 50, damage: '1d8 perfurante', category: 'Marcial', description: 'Distância (45/180m), Duas mãos, Pesada', properties: ['ammunition', 'heavy'] },
  { id: 'dardo', name: 'Dardo / Azagaia', type: 'Arma', cost: 3, damage: '1d6 perfurante', category: 'Simples', description: 'Arremesso (9/36m)', properties: ['thrown'] },

  // Consumíveis
  { id: 'odre', name: 'Odre (Água)', type: 'Consumível', cost: 1, description: 'Cura 2 PV. Sobrevivência no deserto (1 dia)', category: 'Todas' },
  { id: 'tocha', name: 'Tocha', type: 'Consumível', cost: 0.5, description: 'Ilumina 6m. Queima por 1h', category: 'Todas' },
  { id: 'balsamo', name: 'Bálsamo Curativo / Óleo', type: 'Consumível', cost: 5, description: 'Cura 1d4 HP em Descanso', category: 'Todas' },
  { id: 'racao', name: 'Ração de Viagem', type: 'Consumível', cost: 1, description: 'Cura 1d4 PV. 1 dia de nutrição', category: 'Todas' },
  { id: 'pedras_funda', name: 'Saco de Pedras para Funda', type: 'Consumível', cost: 0.5, description: '20 pedras', category: 'Todas' },
  { id: 'flechas', name: 'Flechas', type: 'Consumível', cost: 1, description: '20 flechas para arcos', category: 'Todas' },

  // Utilizáveis
  { id: 'corda', name: 'Corda de Cânhamo (15m)', type: 'Utilidade', cost: 1, description: 'Escalada, amarras', category: 'Todas' },
  { id: 'mochila', name: 'Mochila de Lona', type: 'Utilidade', cost: 2, description: 'Carregar itens extras', category: 'Todas' },
  { id: 'tenda', name: 'Tenda Comum', type: 'Utilidade', cost: 10, description: 'Abrigo para 2 pessoas', category: 'Todas' },
  { id: 'pederneira', name: 'Pederneira e Isqueiro', type: 'Utilidade', cost: 2, description: 'Iniciar fogo', category: 'Todas' },
  { id: 'simbolo_proibido', name: 'Amuleto/Símbolo (Proibido)', type: 'Utilidade', cost: 0, description: 'Amuleto profano que subtrai Fé', category: 'Todas', statPenalty: { stat: 'faith', value: -10, type: 'passive' } },
];

export const KITS_DB: Record<string, { name: string; cost: number; leftover: number; markdown: string }> = {
  'Guerreiro': {
    name: 'Kit Básico de Guerreiro',
    cost: 50,
    leftover: 5,
    markdown: `### Guerreiro\n- Espada curta de bronze (1d6 cortante) ou Lança (1d6 perfurante).\n- Armadura de couro fervido (CA 11 + Mod Des) e um escudo de madeira (+2 CA).\n- 5 rações de viagem e um cantil de água.\n- Uma faca de osso (1d4 perfurante) e 5 Shekels de prata no bolso.`
  },
  'Caçador': {
    name: 'Kit Básico de Caçador/Nômade',
    cost: 50,
    leftover: 10,
    markdown: `### Caçador/Nômade\n- Arco curto (1d6 perfurante) com aljava e 20 flechas OU Funda (1d4 concussão) com 20 pedras.\n- Adaga de bronze (1d4 perfurante).\n- Armadura de couro leve (CA 11 + Mod Des).\n- Um kit de armadilhas, corda de cânhamo (15m), e 10 Shekels de prata.`
  },
  'Batedor': {
    name: 'Kit Básico de Batedor',
    cost: 50,
    leftover: 8,
    markdown: `### Batedor\n- Duas adagas de bronze (1d4 perfurante).\n- Armadura de couro leve (CA 11 + Mod Des).\n- Corda de cânhamo (15m) e um gancho.\n- Kit de ferramentas de ladrão (gazúas) e 8 Shekels de prata no bolso.`
  },
  'Sacerdote': {
    name: 'Kit Básico de Sacerdote/Sábio',
    cost: 50,
    leftover: 12,
    markdown: `### Sacerdote / Sábio\n- Cajado ou Cetro cerimonial (1d6 concussão).\n- Veste de linho fino com o Éfode.\n- Óleo de unção e incenso.\n- Instrumento musical (ex: harpa, shofar ou tamborim).\n- 12 Shekels de prata (representando dízimos iniciais).`
  },
  'Sábio': {
    name: 'Kit Básico de Sacerdote/Sábio',
    cost: 50,
    leftover: 12,
    markdown: `### Sacerdote / Sábio\n- Cajado ou Cetro cerimonial (1d6 concussão).\n- Veste de linho fino com o Éfode.\n- Óleo de unção e incenso.\n- Instrumento musical (ex: harpa, shofar ou tamborim).\n- 12 Shekels de prata (representando dízimos iniciais).`
  }
};

export const VOCATION_PROFICIENCIES: Record<string, ItemCategory[]> = {
  'Guerreiro': ['Simples', 'Marcial', 'Leve', 'Média', 'Pesada', 'Escudo', 'Todas'],
  'Caçador': ['Simples', 'Marcial', 'Leve', 'Média', 'Todas'],
  'Batedor': ['Simples', 'Marcial', 'Leve', 'Média', 'Todas'],
  'Sacerdote': ['Simples', 'Leve', 'Todas'],
  'Sábio': ['Simples', 'Leve', 'Todas'],
};
