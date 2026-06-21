# Data Model: Mostrar Dano de Armas no Inventário

Não há alterações estruturais no banco de dados para esta feature. 
As entidades principais envolvidas já existem:

## Entidade: `Item (Arma)`

Esta feature foca na exibição de dados e consome o dicionário local `ITEMS_DB` do arquivo `src/data/itemsDb.ts` como fonte primária para as propriedades visuais em caso de ausência no JSONB do banco de dados.

```typescript
// Interface utilizada internamente e estendida por ShopItem em itemsDb.ts
export interface EquipmentItem {
  id: string;
  name: string;
  description?: string;
  type: string;        // Ex: 'Arma', 'Armadura', 'Escudo', etc
  cost?: number;
  damage?: string;     // Ex: '1d6 cortante', '1d8 perfurante'
  armorClass?: number;
}
```

O componente `InventoryList` intercepta a propriedade `damage` quando a propriedade `type` é `"Arma"` e apresenta na interface gráfica.
