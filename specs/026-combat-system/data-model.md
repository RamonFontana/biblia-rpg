# Data Model: combat-system

## Database Tables (Supabase)

### Table: `combats`

Representa uma instância de combate ativa ou finalizada em uma sessão.

- `id` (uuid, PK)
- `session_id` (uuid, FK para `sessions`)
- `status` (enum: `'setup'`, `'active'`, `'paused'`, `'finished'`)
- `current_turn_index` (integer) - O índice no array de participantes ordenado por iniciativa que indica de quem é o turno atual.
- `round_number` (integer) - Contagem de rodadas, começando em 1.
- `created_at` (timestamptz)

### Table: `combat_participants`

Representa os participantes envolvidos em um combate específico.

- `id` (uuid, PK)
- `combat_id` (uuid, FK para `combats`)
- `entity_id` (uuid) - O ID do Personagem Jogador, NPC ou Inimigo na base correspondente.
- `entity_type` (enum: `'player'`, `'npc'`, `'enemy'`)
- `initiative` (integer) - O valor total da iniciativa (dado + modificador + desempate).
- `hp_current` (integer) - Vida atual do participante no momento do combate.
- `conditions` (jsonb) - Array de strings representando status/condições atuais. Ex: `["sangrando", "caído", "envenenado"]`.
- `is_surprised` (boolean) - (Opcional) Indicador se o personagem não age na primeira rodada.

## Application State (Zustand)

O estado local do Jogador (focado apenas no checklist de turno).

```typescript
interface PlayerCombatState {
  hasUsedMovement: boolean;
  hasUsedAction: boolean;
  hasUsedBonusAction: boolean;
  hasUsedReaction: boolean;
  
  // Actions
  toggleMovement: () => void;
  toggleAction: () => void;
  toggleBonusAction: () => void;
  toggleReaction: () => void;
  resetTurnChecklist: () => void;
}
```

O `CombatStore` principal lidará com a comunicação via Supabase Realtime para espelhar as tabelas acima no frontend e invocar mutações.

```typescript
interface CombatStore {
  activeCombat: Combat | null;
  participants: CombatParticipant[];
  
  // Computed
  currentTurnParticipant: CombatParticipant | null;
  
  // Actions
  setCombatState: (combat: Combat, participants: CombatParticipant[]) => void;
  nextTurn: () => Promise<void>;
  applyDamageOrHealing: (participantId: string, amount: number) => Promise<void>;
  updateConditions: (participantId: string, conditions: string[]) => Promise<void>;
}
```
