import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import { resetCombatAbilities } from '../utils/abilityUtils';
import { conditionsService } from '../services/conditionsService';
import { characterVitalsService } from '../services/characterVitalsService';
import { subscribeToTables } from '@/data-access/realtime';
import type { ConditionEntry } from '../types/combat';

export type Combat = Database['public']['Tables']['combats']['Row'];
export type CombatParticipant = Database['public']['Tables']['combat_participants']['Row'];

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

interface CombatStore extends PlayerCombatState {
  activeCombat: Combat | null;
  participants: CombatParticipant[];

  // Computed
  currentTurnParticipant: CombatParticipant | null;

  // Channels
  combatUnsubscribe: (() => void) | null;

  // Subscriptions
  initSubscriptions: (sessionId: string) => void;
  cleanupSubscriptions: () => void;

  // Actions
  setCombatState: (combat: Combat | null, participants: CombatParticipant[]) => void;
  startCombat: (
    sessionId: string,
    setupParticipants: {
      entityId: string;
      entityType: 'player' | 'npc' | 'enemy';
      initiative: number;
      hpCurrent: number;
    }[],
  ) => Promise<void>; // for US1
  nextTurn: () => Promise<void>;
  endCombat: () => Promise<void>;
  applyDamageOrHealing: (
    participantId: string,
    amount: number,
    type: 'damage' | 'healing',
  ) => Promise<void>;
  updateConditions: (participantId: string, conditions: ConditionEntry[]) => Promise<void>;
}

export const useCombatStore = create<CombatStore>((set, get) => ({
  // State
  activeCombat: null,
  participants: [],
  currentTurnParticipant: null,
  combatUnsubscribe: null,

  // Player local state
  hasUsedMovement: false,
  hasUsedAction: false,
  hasUsedBonusAction: false,
  hasUsedReaction: false,

  toggleMovement: () => set((state) => ({ hasUsedMovement: !state.hasUsedMovement })),
  toggleAction: () => set((state) => ({ hasUsedAction: !state.hasUsedAction })),
  toggleBonusAction: () => set((state) => ({ hasUsedBonusAction: !state.hasUsedBonusAction })),
  toggleReaction: () => set((state) => ({ hasUsedReaction: !state.hasUsedReaction })),
  resetTurnChecklist: () =>
    set({
      hasUsedMovement: false,
      hasUsedAction: false,
      hasUsedBonusAction: false,
      hasUsedReaction: false,
    }),

  // Core action
  setCombatState: (combat, participants) => {
    // Sort by initiative descending
    const sortedParticipants = [...participants].sort((a, b) => b.initiative - a.initiative);
    const currentTurnParticipant =
      combat && sortedParticipants.length > 0
        ? sortedParticipants[combat.current_turn_index % sortedParticipants.length]
        : null;

    set({ activeCombat: combat, participants: sortedParticipants, currentTurnParticipant });
  },

  startCombat: async (sessionId, setupParticipants) => {
    // Insert combat
    const { data: combat, error: combatError } = await supabase
      .from('combats')
      .insert({ session_id: sessionId, status: 'active', current_turn_index: 0, round_number: 1 })
      .select('*')
      .single();

    if (combatError) {
      console.error('Failed to create combat', combatError);
      throw combatError;
    }

    // Fetch existing conditions for characters
    const entityIds = setupParticipants
      .filter((p) => p.entityType !== 'enemy')
      .map((p) => p.entityId);
    const charactersConditions: Record<string, any[]> = {};
    if (entityIds.length > 0) {
      const { data: chars } = await supabase
        .from('characters')
        .select('id, conditions')
        .in('id', entityIds);
      if (chars) {
        chars.forEach((c) => {
          charactersConditions[c.id] = (c.conditions as any[]) || [];
        });
      }
    }

    // Insert participants
    const participantsData = setupParticipants.map((p) => ({
      combat_id: combat.id,
      entity_id: p.entityId,
      entity_type: p.entityType,
      initiative: p.initiative,
      hp_current: p.hpCurrent,
      conditions: charactersConditions[p.entityId] || [],
    }));

    const { error: participantsError } = await supabase
      .from('combat_participants')
      .insert(participantsData);

    if (participantsError) {
      console.error('Failed to insert participants', participantsError);
      throw participantsError;
    }

    // Reset combat abilities for all non-enemy participants
    if (entityIds.length > 0) {
      const { data: chars } = await supabase
        .from('characters')
        .select('id, skills')
        .in('id', entityIds);
      if (chars) {
        const updates = chars.map((char) => {
          const currentSkills = (char.skills as any) || {};
          const abilityUses = currentSkills.ability_uses || {};
          const newAbilityUses = resetCombatAbilities(abilityUses);

          return supabase
            .from('characters')
            .update({
              skills: {
                ...currentSkills,
                ability_uses: newAbilityUses,
              },
            })
            .eq('id', char.id);
        });

        await Promise.all(updates).catch((e) =>
          console.error('Error resetting combat abilities:', e),
        );
      }
    }
  },

  initSubscriptions: (sessionId: string) => {
    // Clean up existing subscription if any
    get().combatUnsubscribe?.();

    // Initial fetch
    supabase
      .from('combats')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'active')
      .maybeSingle()
      .then(async ({ data: combat }) => {
        if (combat) {
          const { data: participants } = await supabase
            .from('combat_participants')
            .select('*')
            .eq('combat_id', combat.id);
          get().setCombatState(combat, participants || []);
        } else {
          // Maybe there's a setup combat
          const { data: setupCombat } = await supabase
            .from('combats')
            .select('*')
            .eq('session_id', sessionId)
            .eq('status', 'setup')
            .maybeSingle();
          if (setupCombat) {
            const { data: participants } = await supabase
              .from('combat_participants')
              .select('*')
              .eq('combat_id', setupCombat.id);
            get().setCombatState(setupCombat, participants || []);
          }
        }
      });

    const channelId = Math.random().toString(36).substring(7);
    const unsubscribe = subscribeToTables(`combat:session-${sessionId}-${channelId}`, [
      {
        table: 'combats',
        filter: `session_id=eq.${sessionId}`,
        onChange: (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newCombat = payload.new as Combat;
            const { activeCombat, participants } = get();

            if (activeCombat && activeCombat.current_turn_index !== newCombat.current_turn_index) {
              get().resetTurnChecklist();
            }

            if (newCombat.status === 'finished') {
              get().setCombatState(null, []);
            } else {
              get().setCombatState(newCombat, participants);
            }
          } else if (payload.eventType === 'DELETE') {
            get().setCombatState(null, []);
          }
        },
      },
      {
        table: 'combat_participants',
        onChange: (payload) => {
          const { activeCombat, participants } = get();
          if (!activeCombat) return;

          let newParticipants = [...participants];
          if (payload.eventType === 'INSERT') {
            if (payload.new.combat_id === activeCombat.id) {
              newParticipants.push(payload.new as CombatParticipant);
            }
          } else if (payload.eventType === 'UPDATE') {
            newParticipants = newParticipants.map((p) =>
              p.id === payload.new.id ? (payload.new as CombatParticipant) : p,
            );
          } else if (payload.eventType === 'DELETE') {
            newParticipants = newParticipants.filter((p) => p.id !== payload.old.id);
          }

          get().setCombatState(activeCombat, newParticipants);
        },
      },
    ]);

    set({ combatUnsubscribe: unsubscribe });
  },

  cleanupSubscriptions: () => {
    get().combatUnsubscribe?.();
    set({
      activeCombat: null,
      participants: [],
      currentTurnParticipant: null,
      combatUnsubscribe: null,
    });
  },

  nextTurn: async () => {
    const { activeCombat, participants } = get();
    if (!activeCombat) return;

    let newIndex = activeCombat.current_turn_index + 1;
    let newRound = activeCombat.round_number;

    if (newIndex >= participants.length) {
      newIndex = 0;
      newRound += 1;

      // Tick conditions on round change
      const conditionUpdates = participants.map(async (p) => {
        const currentConds = ((p as any).conditions as unknown as ConditionEntry[]) || [];
        if (currentConds.length > 0) {
          const ticked = conditionsService.tickConditions(currentConds);
          await supabase
            .from('combat_participants')
            .update({ conditions: ticked as any })
            .eq('id', p.id);
        }
      });
      await Promise.all(conditionUpdates);
    }

    const { error } = await supabase
      .from('combats')
      .update({ current_turn_index: newIndex, round_number: newRound })
      .eq('id', activeCombat.id);

    if (error) {
      console.error('Failed to update turn', error);
      throw error;
    }
  },

  endCombat: async () => {
    const { activeCombat, participants } = get();
    if (!activeCombat) return;

    // 1. Sync final HP to characters and perform soft delete for dead characters BEFORE ending combat
    // This ensures that realtime listeners for 'combats' UPDATE will fetch the correctly updated characters.
    if (participants.length > 0) {
      const charIds = participants.map((p) => p.entity_id);

      const { data: chars } = await supabase
        .from('characters')
        .select('id, stats, is_dead, is_enemy')
        .in('id', charIds);

      if (chars) {
        const deadCharIds: string[] = [];
        const deadEnemyIds: string[] = [];

        for (const char of chars) {
          const participant = participants.find((p) => p.entity_id === char.id);
          if (participant) {
            const currentStats = (char.stats as any) || {};

            // Clean temporary conditions and keep permanent ones
            const currentConditions =
              ((participant as any).conditions as unknown as ConditionEntry[]) || [];
            const permanentConditions =
              conditionsService.cleanTemporaryConditions(currentConditions);

            await characterVitalsService.syncFromCombatEnd(
              char.id,
              currentStats,
              participant.hp_current,
              char.is_dead,
              char.is_enemy,
              permanentConditions,
            );

            // Soft-delete list is driven by "died in this combat" (hp <= 0 now),
            // not by the sticky is_dead result — a character already dead before
            // this combat but currently above 0 HP should not be swept up here.
            if (participant.hp_current <= 0) {
              if (char.is_enemy) {
                deadEnemyIds.push(char.id);
              } else {
                deadCharIds.push(char.id);
              }
            }
          }
        }

        // Soft delete dead enemies
        if (deadEnemyIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('characters')
            .update({ is_deleted: true })
            .in('id', deadEnemyIds);

          if (deleteError) {
            console.error('Failed to soft delete dead enemies', deleteError);
          }
        }
      }
    }

    // 2. Mark combat as finished
    const { error: combatError } = await supabase
      .from('combats')
      .update({ status: 'finished' })
      .eq('id', activeCombat.id);

    if (combatError) {
      console.error('Failed to end combat', combatError);
      throw combatError;
    }

    get().cleanupSubscriptions();
  },

  applyDamageOrHealing: async (
    participantId: string,
    amount: number,
    type: 'damage' | 'healing',
  ) => {
    const { participants } = get();
    const participant = participants.find((p) => p.id === participantId);
    if (!participant) return;

    await characterVitalsService.applyDamageOrHealing(participant, amount, type);
  },

  updateConditions: async (participantId: string, conditions: ConditionEntry[]) => {
    const { error } = await supabase
      .from('combat_participants')
      .update({ conditions: conditions as any })
      .eq('id', participantId);

    if (error) {
      console.error('Failed to update conditions', error);
      throw error;
    }
  },
}));
