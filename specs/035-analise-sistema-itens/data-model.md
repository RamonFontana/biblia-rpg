# Phase 1: Data Model & Interfaces

## Modificações no Banco (Implicit via `effects`)
Nenhuma migração SQL é estritamente necessária, pois a lógica pode utilizar o campo `effects` (JSON) nativo da tabela `items`.

### Schema dos Efeitos de Itens Atualizado (Tipagem TypeScript)
```typescript
interface ItemEffects {
  slot?: '1h' | '2h' | 'body' | 'shield' | 'ring' | 'amulet';
  damageDie?: string;
  damageType?: string;
  versatileDamageDie?: string;
  armorClass?: number;
  acBonus?: number;
  weaponCategory?: ItemCategory;
  // NOVOS CAMPOS:
  properties?: ('finesse' | 'versatile' | 'thrown' | 'ammunition' | 'stealth_disadvantage' | 'heavy')[];
  statPenalty?: { stat: string; value: number; type: 'passive' };
}
```

## Entidades e Itens Novos (`itemsDb.ts`)
- **Flechas (20)**: Consumível (Cost: 1 SP)
- **Símbolo Proibido**: Utilidade (Cost: 0 SP), effects: `{ statPenalty: { stat: 'faith', value: -10, type: 'passive' } }`

## Atualização do Parser (`syncInventory.ts`)
A função `getEffectsFromItemName` passará a reconhecer as chaves de propriedades nas descrições de `itemsDb.ts` e construir o array `properties`.
