import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k,v] = line.split('=');
  if(k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const ITEMS_DB = [
  // Armaduras
  { id: 'tunica', name: 'Túnica Grossa (Acolchoada)', type: 'Armadura', cost: 5, armorClass: 11, category: 'Leve', description: 'CA: 11 + Des. Desvantagem em Furtividade' },
  { id: 'couro_cru', name: 'Couro Cru', type: 'Armadura', cost: 10, armorClass: 11, category: 'Leve', description: 'CA: 11 + Des. Armadura básica' },
  { id: 'couro_batido', name: 'Couro Batido (com tachas)', type: 'Armadura', cost: 45, armorClass: 12, category: 'Leve', description: 'CA: 12 + Des. Armadura leve reforçada' },
  { id: 'cota_escamas', name: 'Cota de Escamas de Bronze', type: 'Armadura', cost: 50, armorClass: 14, category: 'Média', description: 'CA: 14 + Des (máx 2). Desvantagem em Furtividade' },
  { id: 'peitoral_bronze', name: 'Peitoral de Bronze/Ferro', type: 'Armadura', cost: 400, armorClass: 14, category: 'Média', description: 'CA: 14 + Des (máx 2). Proteção superior no peito' },
  { id: 'cota_malha', name: 'Cota de Malha de Anéis', type: 'Armadura', cost: 30, armorClass: 14, category: 'Pesada', description: 'CA: 14. Desvantagem em Furtividade' },
  { id: 'lorica', name: 'Lorica de Escamas Pesada', type: 'Armadura', cost: 75, armorClass: 16, category: 'Pesada', description: 'CA: 16. Desvantagem em Furtividade, Requer For 13' },
  { id: 'escudo', name: 'Escudo (Madeira/Bronze)', type: 'Escudo', cost: 10, armorClass: 2, category: 'Escudo', description: '+2 CA. Ocupa uma mão' },

  // Armas
  { id: 'adaga', name: 'Faca/Adaga de Bronze', type: 'Arma', cost: 2, damage: '1d4 perfurante', category: 'Simples', description: 'Acuidade, Leve, Arremesso (6/18m)' },
  { id: 'espada_curta', name: 'Espada Curta (Ferro)', type: 'Arma', cost: 10, damage: '1d6 cortante', category: 'Marcial', description: 'Acuidade, Leve' },
  { id: 'espada_longa', name: 'Espada Longa / Khopesh', type: 'Arma', cost: 15, damage: '1d8 cortante', category: 'Marcial', description: 'Versátil (1d10)' },
  { id: 'lanca', name: 'Lança Comum', type: 'Arma', cost: 5, damage: '1d6 perfurante', category: 'Simples', description: 'Arremesso (6/18m), Versátil (1d8)' },
  { id: 'machado', name: 'Machado de Batalha', type: 'Arma', cost: 10, damage: '1d8 cortante', category: 'Marcial', description: 'Versátil (1d10)' },
  { id: 'cajado', name: 'Cajado de Pastor', type: 'Arma', cost: 1, damage: '1d6 concussão', category: 'Simples', description: 'Versátil (1d8)' },
  { id: 'funda', name: 'Funda', type: 'Arma', cost: 1, damage: '1d4 concussão', category: 'Simples', description: 'Distância (9/36m), Munição' },
  { id: 'arco_curto', name: 'Arco Curto', type: 'Arma', cost: 25, damage: '1d6 perfurante', category: 'Marcial', description: 'Distância (24/96m), Duas mãos, Munição' },
  { id: 'arco_longo', name: 'Arco Longo', type: 'Arma', cost: 50, damage: '1d8 perfurante', category: 'Marcial', description: 'Distância (45/180m), Duas mãos, Pesada' },
  { id: 'dardo', name: 'Dardo / Azagaia', type: 'Arma', cost: 3, damage: '1d6 perfurante', category: 'Simples', description: 'Arremesso (9/36m)' },
];

async function run() {
  console.log('Starting item patch...');
  let updatedCount = 0;
  for (const item of ITEMS_DB) {
    const effects = {};
    if (item.damage) {
      const parts = item.damage.split(' ');
      effects.damageDie = parts[0];
      if (parts.length > 1) effects.damageType = parts[1];
    }
    if (item.armorClass) {
      if (item.type === 'Escudo') {
        effects.acBonus = item.armorClass;
      } else {
        effects.armorClass = item.armorClass;
      }
    }
    if (item.category) {
      effects.weaponCategory = item.category;
    }

    if (item.description && item.description.includes('Versátil')) {
       const match = item.description.match(/Versátil \((1d\d+)\)/);
       if (match) effects.versatileDamageDie = match[1];
    }

    // Assign slot automatically for weapons and armor so they can be equipped
    let slot = '';
    const cat = (item.category || '').toUpperCase();
    if (item.type === 'Escudo') slot = 'shield';
    else if (item.type === 'Armadura') slot = 'body';
    else if (item.type === 'Arma') {
      if (item.description && item.description.includes('Duas mãos')) slot = '2h';
      else slot = '1h';
    }
    if (slot) effects.slot = slot;

    // Use a service role key if needed to bypass RLS, but since we are just updating 
    // from a client script, we might need to rely on the fact that if RLS allows it.
    // Wait, let's login first if there is RLS.
    // We can't easily login, but we can check if update succeeds.

    const { error } = await supabase.from('items').update({ effects }).eq('name', item.name);
    if (error) {
      console.error('Error updating', item.name, error.message);
    } else {
      updatedCount++;
    }
  }
  console.log(`Finished patching. Updated ${updatedCount} items.`);
}

run();
