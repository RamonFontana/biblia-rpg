import { create } from 'zustand';
import { resetCombatAbilities } from '../utils/abilityUtils';
import { cleanTemporaryConditions, tickConditions } from '@/domain/conditions';
import type { VitalsLike } from '@/domain/vitals';
import { updateCharacterSkills } from '@/data-access/characters';
import {
  createCombat,
  finishCombat,
  findSessionCombat,
  getCharacterConditions,
  getCharacterSkills,
  getCharactersForCombatEnd,
  insertCombatParticipants,
  listCombatParticipants,
  setParticipantConditions,
  softDeleteCharacters,
  updateCombatTurn,
  type Combat,
  type CombatParticipant,
} from '@/data-access/combat';
import { characterVitalsService } from '@/data-access/vitals';
import { subscribeToTables } from '@/data-access/realtime';
import type { ConditionEntry } from '../types/combat';

export type { Combat, CombatParticipant };

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
    const combat = await createCombat(sessionId);

    // Fetch existing conditions for characters
    const entityIds = setupParticipants
      .filter((p) => p.entityType !== 'enemy')
      .map((p) => p.entityId);
    let charactersConditions: Record<string, ConditionEntry[]> = {};
    if (entityIds.length > 0) {
      try {
        charactersConditions = await getCharacterConditions(entityIds);
      } catch (error) {
        console.error('Error fetching character conditions:', error);
      }
    }

    // Insert participants
    await insertCombatParticipants(
      setupParticipants.map((p) => ({
        combat_id: combat.id,
        entity_id: p.entityId,
        entity_type: p.entityType,
        initiative: p.initiative,
        hp_current: p.hpCurrent,
        conditions: charactersConditions[p.entityId] || [],
      })),
    );

    // Reset combat abilities for all non-enemy participants
    if (entityIds.length > 0) {
      try {
        const chars = await getCharacterSkills(entityIds);
        await Promise.all(
          chars.map((char) => {
            const currentSkills = char.skills;
            const abilityUses = currentSkills.ability_uses || {};
            const newAbilityUses = resetCombatAbilities(abilityUses);

            return updateCharacterSkills(char.id, {
              ...currentSkills,
              ability_uses: newAbilityUses,
            });
          }),
        );
      } catch (error) {
        console.error('Error resetting combat abilities:', error);
      }
    }
  },

  initSubscriptions: (sessionId: string) => {
    // Clean up existing subscription if any
    get().combatUnsubscribe?.();

    // Initial fetch
    (async () => {
      // Maybe there's a setup combat
      const combat =
        (await findSessionCombat(sessionId, 'active')) ??
        (await findSessionCombat(sessionId, 'setup'));
      if (combat) {
        get().setCombatState(combat, await listCombatParticipants(combat.id));
      }
    })().catch((error) => console.error('Failed to load the combat', error));

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
        const currentConds = (p.conditions as unknown as ConditionEntry[] | null) || [];
        if (currentConds.length > 0) {
          try {
            await setParticipantConditions(p.id, tickConditions(currentConds));
          } catch {
            // Já registrado; a rodada avança mesmo se uma gravação falhar, como antes.
          }
        }
      });
      await Promise.all(conditionUpdates);
    }

    await updateCombatTurn(activeCombat.id, newIndex, newRound);
  },

  endCombat: async () => {
    const { activeCombat, participants } = get();
    if (!activeCombat) return;

    // 1. Sync final HP to characters and perform soft delete for dead characters BEFORE ending combat
    // This ensures that realtime listeners for 'combats' UPDATE will fetch the correctly updated characters.
    if (participants.length > 0) {
      const charIds = participants.map((p) => p.entity_id);

      let chars: Awaited<ReturnType<typeof getCharactersForCombatEnd>> | null = null;
      try {
        chars = await getCharactersForCombatEnd(charIds);
      } catch (error) {
        console.error('Failed to load the characters for the end of combat', error);
      }

      if (chars) {
        const deadEnemyIds: string[] = [];

        for (const char of chars) {
          const participant = participants.find((p) => p.entity_id === char.id);
          if (participant) {
            const currentStats = (char.stats as VitalsLike | null) || {};

            // Clean temporary conditions and keep permanent ones
            const currentConditions =
              (participant.conditions as unknown as ConditionEntry[] | null) || [];
            const permanentConditions = cleanTemporaryConditions(currentConditions);

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
            if (participant.hp_current <= 0 && char.is_enemy) {
              deadEnemyIds.push(char.id);
            }
          }
        }

        // Soft delete dead enemies
        if (deadEnemyIds.length > 0) {
          try {
            await softDeleteCharacters(deadEnemyIds);
          } catch (deleteError) {
            console.error('Failed to soft delete dead enemies', deleteError);
          }
        }
      }
    }

    // 2. Mark combat as finished
    await finishCombat(activeCombat.id);

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
    await setParticipantConditions(participantId, conditions);
  },
}));
