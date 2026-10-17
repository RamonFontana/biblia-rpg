import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { ConditionEntry } from '@/types/combat';
import {
  type VitalsLike,
  getCurrentPv,
  getMaxPv,
  clampHp,
  applyHpDelta,
  applyDamageOrHealing as computeDamageOrHealing,
  deriveStatusLabel,
  deriveDeathState,
  applyMaxPvIncrease,
} from '@/lib/vitalsUtils';

type CombatParticipantRow = Database['public']['Tables']['combat_participants']['Row'];

// combat_participants.entity_id has no FK — it can point at a real `characters` row
// (players, enemies, and one "flavor" of NPC) or a lightweight `session_npcs` row
// (the other NPC flavor). Try characters first, fall back to session_npcs, and fall
// back to the default max PV if neither resolves rather than failing the operation.
async function resolveMaxPvForEntity(entityId: string, entityType: string): Promise<number> {
  if (entityType !== 'npc') {
    const { data } = await supabase
      .from('characters')
      .select('stats')
      .eq('id', entityId)
      .maybeSingle();
    return getMaxPv(data?.stats as VitalsLike | null | undefined);
  }

  const { data: charData } = await supabase
    .from('characters')
    .select('stats')
    .eq('id', entityId)
    .maybeSingle();
  if (charData) return getMaxPv(charData.stats as VitalsLike);

  const { data: npcData } = await supabase
    .from('session_npcs')
    .select('stats')
    .eq('id', entityId)
    .maybeSingle();
  return getMaxPv(npcData?.stats as VitalsLike | null | undefined);
}

export const characterVitalsService = {
  // Combat: GM-only damage/heal on a participant. Self-fetches the linked entity's max
  // PV since combat_participants only stores the current value — this is the read that
  // was always missing, which is why healing had no ceiling before.
  async applyDamageOrHealing(
    participant: Pick<CombatParticipantRow, 'id' | 'entity_id' | 'entity_type' | 'hp_current'>,
    amount: number,
    type: 'damage' | 'healing',
  ): Promise<number> {
    const maxPv = await resolveMaxPvForEntity(participant.entity_id, participant.entity_type);
    const newHp = computeDamageOrHealing(participant.hp_current, maxPv, amount, type);

    const { error } = await supabase
      .from('combat_participants')
      .update({ hp_current: newHp })
      .eq('id', participant.id);

    if (error) {
      console.error('Failed to apply damage/healing', error);
      throw error;
    }
    return newHp;
  },

  // Combat end: push a participant's final HP onto its character row and derive
  // is_dead/status together from that HP (sticky — see deriveDeathState). Conditions
  // are a pass-through so this stays the single existing round trip.
  async syncFromCombatEnd(
    characterId: string,
    currentStats: VitalsLike,
    finalHp: number,
    previousIsDead: boolean,
    permanentConditions: ConditionEntry[],
  ): Promise<{ isDead: boolean }> {
    const { isDead, status } = deriveDeathState(finalHp, previousIsDead);
    const newStats = { ...currentStats, current_pv: finalHp, status };

    const { error } = await supabase
      .from('characters')
      .update({ stats: newStats as any, conditions: permanentConditions as any, is_dead: isDead })
      .eq('id', characterId);

    if (error) {
      console.error('Failed to sync character from combat end', error);
      throw error;
    }
    return { isDead };
  },

  // Session +/- PV button for players. Only touches current_pv — does not set
  // is_dead/status, preserving this call site's exact prior behavior.
  async adjustCurrentPv(
    characterId: string,
    currentStats: VitalsLike,
    delta: number,
  ): Promise<Record<string, unknown>> {
    const max = getMaxPv(currentStats);
    const current = getCurrentPv(currentStats, max);
    const newPv = applyHpDelta(current, max, delta);
    const newStats = { ...currentStats, current_pv: newPv };

    const { error } = await supabase
      .from('characters')
      .update({ stats: newStats as any })
      .eq('id', characterId);
    if (error) {
      console.error('Failed to adjust current PV', error);
      throw error;
    }
    return newStats;
  },

  // Session +/- PV button for enemies/NPCs. Also updates the free-text stats.status
  // label, matching what these two call sites already did — still does not touch
  // is_dead (they didn't before either).
  async adjustCurrentPvWithStatus(
    characterId: string,
    currentStats: VitalsLike,
    delta: number,
  ): Promise<Record<string, unknown>> {
    const max = getMaxPv(currentStats);
    const current = getCurrentPv(currentStats, max);
    const newPv = applyHpDelta(current, max, delta);
    const newStats = { ...currentStats, current_pv: newPv, status: deriveStatusLabel(newPv) };

    const { error } = await supabase
      .from('characters')
      .update({ stats: newStats as any })
      .eq('id', characterId);
    if (error) {
      console.error('Failed to adjust current PV', error);
      throw error;
    }
    return newStats;
  },

  // Passive heal (rest, consumable items): positive amount clamped at max, death-state
  // deliberately untouched — resting/potions don't revive a dead character here, and
  // neither call site did that before. `table` exists because lightweight NPCs live in
  // session_npcs, not characters. `extra` merges unrelated bundled fields (e.g.
  // recharged ability uses) into the same write these call sites already made.
  async healCurrentPv(
    table: 'characters' | 'session_npcs',
    characterId: string,
    currentStats: VitalsLike,
    amount: number,
    extra?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const max = getMaxPv(currentStats);
    const current = getCurrentPv(currentStats, max);
    const newPv = applyHpDelta(current, max, amount);
    const newStats = { ...currentStats, current_pv: newPv };

    const { error } = await (supabase as any)
      .from(table)
      .update({ stats: newStats, ...extra })
      .eq('id', characterId);

    if (error) {
      console.error('Failed to heal current PV', error);
      throw error;
    }
    return newStats;
  },

  // Level-up retroactive max-PV bump. No current caller (LevelUpWizard reuses the
  // pure applyMaxPvIncrease directly, through its own existing write path) — kept here
  // for future GM/admin "grant HP" tooling.
  async increaseMaxPv(
    characterId: string,
    currentStats: VitalsLike,
    amount: number,
    extra?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const { pv, current_pv } = applyMaxPvIncrease(currentStats, amount);
    const newStats = { ...currentStats, pv, current_pv };

    const { error } = await supabase
      .from('characters')
      .update({ stats: newStats as any, ...extra })
      .eq('id', characterId);

    if (error) {
      console.error('Failed to increase max PV', error);
      throw error;
    }
    return newStats;
  },

  // Death-save nat-20 revival: sets an absolute HP (clamped to max) and unconditionally
  // forces alive/Vivo — an explicit revival bypasses the sticky hp-based derivation on
  // purpose. Self-fetches stats fresh since the caller's character prop can be stale by
  // the time a nat-20 is rolled. `extra` carries the death-save counter reset fields
  // (owned by useDeathSaves, out of scope here). Optionally syncs combat HP too.
  async reviveWithHp(
    characterId: string,
    newHp: number,
    extra?: Record<string, unknown>,
    participantId?: string,
  ): Promise<Record<string, unknown>> {
    const { data: char, error: fetchError } = await supabase
      .from('characters')
      .select('stats')
      .eq('id', characterId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch character for revival', fetchError);
      throw fetchError;
    }

    const currentStats = (char?.stats as VitalsLike) || {};
    const clampedHp = clampHp(newHp, getMaxPv(currentStats));
    const newStats = { ...currentStats, current_pv: clampedHp, status: 'Vivo' as const };

    const { error } = await supabase
      .from('characters')
      .update({ stats: newStats as any, is_dead: false, ...extra })
      .eq('id', characterId);

    if (error) {
      console.error('Failed to revive character', error);
      throw error;
    }

    if (participantId) {
      const { error: participantError } = await supabase
        .from('combat_participants')
        .update({ hp_current: clampedHp })
        .eq('id', participantId);

      if (participantError) {
        console.error('Failed to sync revived HP to combat participant', participantError);
        throw participantError;
      }
    }

    return newStats;
  },
};
