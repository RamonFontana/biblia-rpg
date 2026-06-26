import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import { resetCombatAbilities } from '../utils/abilityUtils';

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
  
  // Subscriptions
  initSubscriptions: (sessionId: string) => void;
  cleanupSubscriptions: () => void;

  // Actions
  setCombatState: (combat: Combat | null, participants: CombatParticipant[]) => void;
  startCombat: (sessionId: string, setupParticipants: { entityId: string, entityType: 'player' | 'npc' | 'enemy', initiative: number, hpCurrent: number }[]) => Promise<void>; // for US1
  nextTurn: () => Promise<void>;
  endCombat: () => Promise<void>;
  applyDamageOrHealing: (participantId: string, amount: number, type: 'damage' | 'healing') => Promise<void>;
  updateConditions: (participantId: string, conditions: string[]) => Promise<void>;
}

export const useCombatStore = create<CombatStore>((set, get) => ({
  // State
  activeCombat: null,
  participants: [],
  currentTurnParticipant: null,

  // Player local state
  hasUsedMovement: false,
  hasUsedAction: false,
  hasUsedBonusAction: false,
  hasUsedReaction: false,

  toggleMovement: () => set((state) => ({ hasUsedMovement: !state.hasUsedMovement })),
  toggleAction: () => set((state) => ({ hasUsedAction: !state.hasUsedAction })),
  toggleBonusAction: () => set((state) => ({ hasUsedBonusAction: !state.hasUsedBonusAction })),
  toggleReaction: () => set((state) => ({ hasUsedReaction: !state.hasUsedReaction })),
  resetTurnChecklist: () => set({
    hasUsedMovement: false,
    hasUsedAction: false,
    hasUsedBonusAction: false,
    hasUsedReaction: false
  }),

  // Core action
  setCombatState: (combat, participants) => {
    // Sort by initiative descending
    const sortedParticipants = [...participants].sort((a, b) => b.initiative - a.initiative);
    const currentTurnParticipant = combat && sortedParticipants.length > 0
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

    // Insert participants
    const participantsData = setupParticipants.map(p => ({
      combat_id: combat.id,
      entity_id: p.entityId,
      entity_type: p.entityType,
      initiative: p.initiative,
      hp_current: p.hpCurrent,
    }));

    const { error: participantsError } = await supabase
      .from('combat_participants')
      .insert(participantsData);

    if (participantsError) {
      console.error('Failed to insert participants', participantsError);
      throw participantsError;
    }

    // Reset combat abilities for all non-enemy participants
    const entityIds = setupParticipants.filter(p => p.entityType !== 'enemy').map(p => p.entityId);
    if (entityIds.length > 0) {
      const { data: chars } = await supabase.from('characters').select('id, skills').in('id', entityIds);
      if (chars) {
        const updates = chars.map(char => {
          const currentSkills = (char.skills as any) || {};
          const abilityUses = currentSkills.ability_uses || {};
          const newAbilityUses = resetCombatAbilities(abilityUses);
          
          return supabase
            .from('characters')
            .update({
              skills: {
                ...currentSkills,
                ability_uses: newAbilityUses
              }
            })
            .eq('id', char.id);
        });
        
        await Promise.all(updates).catch(e => console.error('Error resetting combat abilities:', e));
      }
    }
  },

  initSubscriptions: (sessionId: string) => {
    // Initial fetch
    supabase.from('combats').select('*').eq('session_id', sessionId).eq('status', 'active').maybeSingle().then(async ({ data: combat }) => {
      if (combat) {
        const { data: participants } = await supabase.from('combat_participants').select('*').eq('combat_id', combat.id);
        get().setCombatState(combat, participants || []);
      } else {
         // Maybe there's a setup combat
         const { data: setupCombat } = await supabase.from('combats').select('*').eq('session_id', sessionId).eq('status', 'setup').maybeSingle();
         if (setupCombat) {
            const { data: participants } = await supabase.from('combat_participants').select('*').eq('combat_id', setupCombat.id);
            get().setCombatState(setupCombat, participants || []);
         }
      }
    });

    // Setup channel
    const channelId = Math.random().toString(36).substring(7);
    const channel = supabase.channel(`combat:session-${sessionId}-${channelId}`);

    // Listen to combats
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'combats',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
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
      }
    );

    // Listen to combat_participants
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'combat_participants',
      },
      (payload) => {
        const { activeCombat, participants } = get();
        if (!activeCombat) return;

        let newParticipants = [...participants];
        if (payload.eventType === 'INSERT') {
          if (payload.new.combat_id === activeCombat.id) {
            newParticipants.push(payload.new as CombatParticipant);
          }
        } else if (payload.eventType === 'UPDATE') {
          newParticipants = newParticipants.map(p => 
            p.id === payload.new.id ? payload.new as CombatParticipant : p
          );
        } else if (payload.eventType === 'DELETE') {
          newParticipants = newParticipants.filter(p => p.id !== payload.old.id);
        }

        get().setCombatState(activeCombat, newParticipants);
      }
    );

    channel.subscribe();
  },

  cleanupSubscriptions: () => {
    supabase.removeAllChannels();
    set({ activeCombat: null, participants: [], currentTurnParticipant: null });
  },

  nextTurn: async () => {
    const { activeCombat, participants } = get();
    if (!activeCombat) return;

    let newIndex = activeCombat.current_turn_index + 1;
    let newRound = activeCombat.round_number;
    
    if (newIndex >= participants.length) {
      newIndex = 0;
      newRound += 1;
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

    // 1. Mark combat as finished
    const { error: combatError } = await supabase
      .from('combats')
      .update({ status: 'finished' })
      .eq('id', activeCombat.id);

    if (combatError) {
      console.error('Failed to end combat', combatError);
      throw combatError;
    }

    // 2. Sync final HP to characters and perform soft delete for dead characters
    if (participants.length > 0) {
      const charIds = participants.map(p => p.entity_id);
      
      const { data: chars } = await supabase
        .from('characters')
        .select('id, stats, is_dead')
        .in('id', charIds);
        
      if (chars) {
        const deadCharIds: string[] = [];

        for (const char of chars) {
          const participant = participants.find(p => p.entity_id === char.id);
          if (participant) {
            const currentStats = (char.stats as any) || {};
            const newStats = { ...currentStats, current_pv: participant.hp_current };
            
            // Sync HP
            await supabase.from('characters').update({ stats: newStats }).eq('id', char.id);

            // Check if dead
            if (char.is_dead || participant.hp_current <= 0 && currentStats.status === 'Morto') {
               deadCharIds.push(char.id);
            }
          }
        }
        
        // Soft delete dead characters
        if (deadCharIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('characters')
            .update({ is_deleted: true })
            .in('id', deadCharIds);
            
          if (deleteError) {
            console.error('Failed to soft delete dead characters', deleteError);
          }
        }
      }
    }
    
    get().cleanupSubscriptions();
  },

  applyDamageOrHealing: async (participantId: string, amount: number, type: 'damage' | 'healing') => {
    const { participants } = get();
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    let newHp = participant.hp_current;
    if (type === 'damage') {
      newHp = Math.max(0, newHp - amount);
    } else {
      newHp += amount; 
    }

    const { error } = await supabase
      .from('combat_participants')
      .update({ hp_current: newHp })
      .eq('id', participantId);

    if (error) {
      console.error('Failed to apply damage/healing', error);
      throw error;
    }
  },

  updateConditions: async (participantId: string, conditions: string[]) => {
    const { error } = await supabase
      .from('combat_participants')
      .update({ conditions })
      .eq('id', participantId);

    if (error) {
      console.error('Failed to update conditions', error);
      throw error;
    }
  }
}));
