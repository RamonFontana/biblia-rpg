import { getCombatStats } from './src/lib/equipmentUtils';

const character = {
  stats: { ca: 11 },
  equipment: {
    head: null,
    body: "item_uuid",
    mainHand: null,
    offHand: null
  },
  character_items: [
    {
      id: "item_uuid",
      item_id: "base_uuid",
      level: 1,
      items: {
        effects: { ca: 1 }
      }
    }
  ]
};

console.log(getCombatStats(character));
