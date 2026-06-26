# Data Model: Nível de Item e Bônus de CA

## 1. Schema Extensions (Supabase)

A alteração afetará o esquema `public` existente, especificamente nas instâncias de itens armazenadas no inventário do personagem e em negociações abertas.

### Tabela: `character_items`
Representa um item no inventário de um personagem.
- `id` (uuid, PK)
- `character_id` (uuid, FK)
- `item_id` (uuid, FK para `items`)
- `quantity` (integer)
- **[NOVO]** `level` (integer): Nível do item (padrão `1`, `NOT NULL`, `CHECK (level >= 1 AND level <= 5)`).

### Tabela: `trade_items`
Representa um item que está sendo ofertado/solicitado em uma troca ou compra/venda.
- `id` (uuid, PK)
- `trade_id` (uuid, FK)
- `side` (text)
- `item_id` (uuid, FK para `items`)
- `quantity` (integer)
- **[NOVO]** `level` (integer): Nível do item ofertado, copiado do `character_items` original para não perder seu progresso (padrão `1`, `NOT NULL`).

---

## 2. Types & Interfaces (TypeScript)

O arquivo de tipagens de banco de dados (`src/types/database.types.ts`) deverá refletir as mudanças do banco. Adicionalmente, as interfaces de aplicação que manipulam o inventário precisam ser atualizadas.

```typescript
// Extensão em src/types/database.types.ts (ou similar, dependendo da geração do supabase)
export interface CharacterItem {
  id: string;
  character_id: string;
  item_id: string;
  quantity: number;
  created_at: string;
  level: number; // NOVO: Nível 1 a 5
}

export interface TradeItem {
  id: string;
  trade_id: string;
  side: string; // 'creator' | 'recipient'
  item_id: string;
  quantity: number;
  created_at: string;
  level: number; // NOVO
}
```

## 3. Lógica de Negócio e Fórmulas

- **Fórmula do Bônus de Nível:** O bônus concedido é igual a `level - 1`. Portanto:
  - Nível 1 = +0 CA
  - Nível 2 = +1 CA
  - Nível 3 = +2 CA
  - Nível 4 = +3 CA
  - Nível 5 = +4 CA

- **Acúmulo (FR-003):** 
  `Total CA = 10 + DexMod + Armadura(effects.ca + level_bonus) + Escudo(effects.ca + level_bonus)`

## 4. Estado Efêmero vs Persistente
O bônus resultante não é persistido em uma coluna `current_ac` do banco de forma independente; a CA é recalculada dinamicamente pelo frontend (via `getCombatStats`) baseado no estado dos itens equipados, mas este estado final é muitas vezes trafegado em memória ou renderizado em tempo real pelos listeners do Supabase. A propriedade `level` é o que garante a persistência do valor no banco.
