// Permissive read-side shape for the untyped `characters.stats` / `session_npcs.stats`
// Json blob. Not the canonical domain shape (see CharacterStats) — this exists so the
// reader can accept legacy key producers (max_hp/current_hp/max_pv) without spreading
// `any` further at call sites. New writes should never produce these legacy keys.
export interface VitalsLike {
  pv?: number | null;
  current_pv?: number | null;
  max_pv?: number | null;
  max_hp?: number | null;
  current_hp?: number | null;
}

export function getCurrentPv(stats: VitalsLike | null | undefined, fallback = 0): number {
  return (
    stats?.current_pv ??
    stats?.current_hp ??
    stats?.pv ??
    stats?.max_pv ??
    stats?.max_hp ??
    fallback
  );
}

export function getMaxPv(stats: VitalsLike | null | undefined, fallback = 10): number {
  return stats?.pv ?? stats?.max_hp ?? fallback;
}

// Floor at 0, ceiling at max.
export function clampHp(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

export function applyHpDelta(current: number, max: number, delta: number): number {
  return clampHp(current + delta, max);
}

export function applyDamageOrHealing(
  current: number,
  max: number,
  amount: number,
  type: 'damage' | 'healing',
): number {
  return applyHpDelta(current, max, type === 'damage' ? -amount : amount);
}

// Textual status only (stats.status) — does NOT touch is_dead. Used by call sites that
// only ever toggled the free-text status, to avoid expanding is_dead's write surface.
export function deriveStatusLabel(hp: number): 'Vivo' | 'Morto' {
  return hp <= 0 ? 'Morto' : 'Vivo';
}

// State at the end of a combat. An enemy at 0 HP dies. A player character or NPC at 0 HP is
// Morrendo and keeps making death saves after the combat (CONTEXT.md); only 3 failed saves or
// the GM kill them. Sticky: once dead, only an explicit revival (reviveWithHp) clears is_dead,
// so a PV adjustment after a narrative kill (killInstant) cannot silently revive a character.
export function deriveCombatEndState(
  hp: number,
  previousIsDead: boolean,
  isEnemy: boolean,
): { isDead: boolean; status: 'Vivo' | 'Morrendo' | 'Morto' } {
  const isDead = previousIsDead || (isEnemy && hp <= 0);
  if (isDead) return { isDead, status: 'Morto' };
  return { isDead, status: hp <= 0 ? 'Morrendo' : 'Vivo' };
}

// Distinct semantics from damage/heal: raises max and current together (retroactive
// level-up HP gain). Reads through the full fallback chain, so a character record that
// only ever had legacy max_hp/current_hp keys gets normalized onto canonical keys here.
export function applyMaxPvIncrease(
  stats: VitalsLike,
  amount: number,
): { pv: number; current_pv: number } {
  return { pv: getMaxPv(stats, 0) + amount, current_pv: getCurrentPv(stats, 0) + amount };
}
