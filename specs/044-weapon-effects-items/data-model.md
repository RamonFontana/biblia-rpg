# Data Model: 044-weapon-effects-items

## Entidades Modificadas

### 1. `character_items` (tabela Supabase — ALTERAR)

Nova coluna para armazenar efeitos ofensivos atribuídos pelo Mestre a uma instância específica de arma.

```sql
ALTER TABLE character_items
ADD COLUMN weapon_effects jsonb DEFAULT NULL;
```

**Estrutura do JSON `weapon_effects`**:
```json
[
  {
    "conditionId": "sangrando",
    "trigger": "natural_18_plus"
  }
]
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `conditionId` | `string` | ID da condição do catálogo (`conditions.ts`). Ex: `sangrando`, `envenenado`, `atordoado` |
| `trigger` | `string` | Gatilho de ativação. MVP: apenas `natural_18_plus` (rolagem natural ≥ 18 no d20) |

**Validações**:
- `conditionId` DEVE existir no catálogo `CONDITIONS` de `conditions.ts`.
- `weapon_effects` só pode ser preenchido em items do tipo `Arma`. Se o item for `Armadura` / `Escudo`, este campo DEVE ser `null`.
- O campo é um array — permite múltiplos efeitos na mesma arma.

### 2. `items` (tabela Supabase — INSERIR novos registros)

Três novos registros para as armas de duas mãos:

```sql
INSERT INTO items (id, name, category, damage, price, description, effects, is_consumable, requires_target)
VALUES
  ('espada_grande', 'Espada Grande de Ferro', 'Marcial', '2d6 cortante', 50, 'Duas mãos, Pesada. Requer For 13.', 
   '{"slot": "2h", "damageDie": "2d6", "damageType": "cortante", "weaponCategory": "Marcial", "properties": ["two-handed", "heavy"]}',
   false, false),
  ('martelo_guerra', 'Martelo de Guerra', 'Marcial', '2d6 concussão', 50, 'Duas mãos, Pesada. Requer For 13.',
   '{"slot": "2h", "damageDie": "2d6", "damageType": "concussão", "weaponCategory": "Marcial", "properties": ["two-handed", "heavy"]}',
   false, false),
  ('clava_grande', 'Clava Grande', 'Simples', '1d10 concussão', 5, 'Duas mãos, Pesada.',
   '{"slot": "2h", "damageDie": "1d10", "damageType": "concussão", "weaponCategory": "Simples", "properties": ["two-handed", "heavy"]}',
   false, false);
```

### 3. `ITEMS_DB` (código local — `src/data/itemsDb.ts`)

Adicionar 3 entradas no array `ITEMS_DB`:

```typescript
{ id: 'espada_grande', name: 'Espada Grande de Ferro', type: 'Arma', cost: 50, damage: '2d6 cortante', category: 'Marcial', description: 'Duas mãos, Pesada. Requer For 13.', properties: ['two-handed', 'heavy'] },
{ id: 'martelo_guerra', name: 'Martelo de Guerra', type: 'Arma', cost: 50, damage: '2d6 concussão', category: 'Marcial', description: 'Duas mãos, Pesada. Requer For 13.', properties: ['two-handed', 'heavy'] },
{ id: 'clava_grande', name: 'Clava Grande', type: 'Arma', cost: 5, damage: '1d10 concussão', category: 'Simples', description: 'Duas mãos, Pesada.', properties: ['two-handed', 'heavy'] },
```

### 4. `ShopItem` (tipo TypeScript — `src/data/itemsDb.ts`)

O tipo `ShopItem` **NÃO precisa de alteração** para as novas armas — já suporta `properties: string[]`.

### 5. `WeaponEffect` (novo tipo TypeScript — `src/types/combat.ts`)

```typescript
export interface WeaponEffect {
  conditionId: string;
  trigger: 'natural_18_plus'; // MVP: único gatilho suportado
}
```

### 6. `database.types.ts` (regenerar)

Após a migration, regenerar os tipos com `npx supabase gen types` para incluir a nova coluna `weapon_effects` em `character_items`.

## Relações

```
items (1) ──────── (N) character_items
  │                      │
  │ effects (JSON)       │ weapon_effects (JSON) ← NOVO
  │ - slot               │ - conditionId
  │ - damageDie          │ - trigger
  │ - damageType         │
  │ - weaponCategory     │ custom_condition_resistances (string[])
  │ - properties         │ ← existente, para ARMADURAS apenas
  │                      │
  │ condition_resistances│
  │ ← SOMENTE ARMADURAS │
  │                      │
conditions (catálogo)    │
  │                      │
  └──── conditionId ─────┘
```

## Diferenciação clara: Resistência vs Efeito

| Campo | Tabela | Tipo de Item | Propósito |
|-------|--------|-------------|-----------|
| `condition_resistances` | `items` | Armaduras/Escudos/Elmos | Resistências base do item |
| `custom_condition_resistances` | `character_items` | Armaduras/Escudos/Elmos | Resistências extras atribuídas pelo Mestre |
| `weapon_effects` | `character_items` | Armas | Efeitos ofensivos atribuídos pelo Mestre |
