# Data Model: 040-ability-usage-system

## 1. Character Skills JSONB Structure

The existing `skills` JSONB column in the `characters` table will be utilized to store two primary categories of data:
1. `path_choices`: Tracks the path choices a character makes as they level up in their tribe or vocation.
2. `ability_uses`: Tracks the real-time usage and limits of rechargeable abilities.

### JSON Schema

```json
{
  "path_choices": {
    "tribe": {
      "4": "A",
      "8": "B",
      "12": "A"
    },
    "vocation": {
      "2": "defense",
      "10": "beast_companion"
    }
  },
  "ability_uses": {
    "ability_id_or_name": {
      "current_uses": 0,
      "max_uses": 1,
      "last_used_at": "2026-06-26T12:00:00Z"
    }
  }
}
```

## 2. Ability Definition Interface (Frontend Static Data)

The static catalog of abilities will be defined in TypeScript, replacing or refactoring `src/data/tribeSkills.ts`.

### TypeScript Interface

```typescript
export type ActionType = 'Ação' | 'Ação Bônus' | 'Reação' | 'Passiva';
export type RechargeUnit = 'short_rest' | 'long_rest' | 'combat' | 'day' | 'week' | 'unlimited';

export interface AbilityDefinition {
  id: string; // e.g., "juda_nivel_4_a"
  name: string;
  source: 'Tribe' | 'Vocation';
  sourceId: string; // e.g., "juda" or "guerreiro"
  minLevel: number;
  pathRequirement?: string; // e.g., "A", "B", "defense"
  actionType: ActionType;
  rollDice?: string; // e.g., "2d8 + SAB"
  maxUses: number | null; // null for passive/unlimited
  rechargeUnit: RechargeUnit;
  description: string;
  effect: string;
}
```

## 3. Recharge Event Triggers

When certain events happen in the session, the `combatStore` or `sessionStore` will dispatch updates to the database to reset `current_uses` based on the `rechargeUnit`:

- **Short Rest**: Resets abilities with `rechargeUnit: 'short_rest'`.
- **Long Rest**: Resets abilities with `rechargeUnit: 'short_rest'`, `'long_rest'`, and `'day'`.
- **Combat Start**: Resets abilities with `rechargeUnit: 'combat'`.
