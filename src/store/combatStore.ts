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
  getCombat,
  insertCombatParticipants,
  listCombatAttacks,
  listCombatParticipants,
  setParticipantConditions,
  softDeleteCharacters,
  updateCombatTurn,
  type Combat,
  type CombatAttack,
  type CombatParticipant,
} from '@/data-access/combat';
import { characterVitalsService } from '@/data-access/vitals';
import { subscribeToTables } from '@/data-access/realtime';
import { uniqueChannelName } from '@/lib/channelName';
import { describeAttack } from '@/domain/attack';
import type { ConditionEntry } from '../types/combat';

export type { Combat, CombatAttack, CombatParticipant };

/** Quantos ataques o armazém guarda para o painel do Mestre. */
const RECENT_ATTACKS = 10;

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
  /** Os últimos ataques do combate, do mais novo para o mais antigo. */
  attacks: CombatAttack[];

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
  attacks: [],
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
    // Iniciativa decrescente; o empate se desfaz por criação e id, a mesma ordem da função de
    // ataque no banco (que confere de quem é o turno).
    const sortedParticipants = [...participants].sort(
      (a, b) =>
        b.initiative - a.initiative ||
        a.created_at.localeCompare(b.created_at) ||
        a.id.localeCompare(b.id),
    );
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

    // Lê o combate da sessão. Roda ao abrir a mesa e de novo quando o servidor confirma o canal
    // (e a cada reconexão): o que acontece entre uma coisa e outra não chega por evento nenhum.
    const loadCombat = () =>
      (async () => {
        // Maybe there's a setup combat
        const combat =
          (await findSessionCombat(sessionId, 'active')) ??
          (await findSessionCombat(sessionId, 'setup'));
        if (combat) {
          get().setCombatState(combat, await listCombatParticipants(combat.id));
          // Os ataques são só o histórico do painel: ler mal não impede de abrir o combate.
          const attacks = await listCombatAttacks(combat.id, RECENT_ATTACKS).catch((error) => {
            console.error('Failed to load the combat attacks', error);
            return [];
          });
          set({ attacks });
        }
      })().catch((error) => console.error('Failed to load the combat', error));
    loadCombat();

    const unsubscribe = subscribeToTables(
      uniqueChannelName(`combat:session-${sessionId}`),
      [
        {
          table: 'combats',
          filter: `session_id=eq.${sessionId}`,
          onChange: (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const newCombat = payload.new as Combat;
              const { activeCombat, participants } = get();

              if (
                activeCombat &&
                activeCombat.current_turn_index !== newCombat.current_turn_index
              ) {
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
          table: 'combat_attacks',
          event: 'INSERT',
          onChange: (payload) => {
            const { activeCombat, attacks } = get();
            const attack = payload.new as CombatAttack;
            if (!activeCombat || attack.combat_id !== activeCombat.id) return;
            set({ attacks: [attack, ...attacks].slice(0, RECENT_ATTACKS) });
            window.dispatchEvent(
              new CustomEvent('combat-toast', {
                detail: {
                  message: describeAttack({
                    attackerName: attack.attacker_name,
                    targetName: attack.target_name,
                    hit: attack.hit,
                    critical: attack.critical,
                    fumble: attack.fumble,
                    damage: attack.damage,
                  }),
                },
              }),
            );
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
      ],
      { onSubscribed: loadCombat },
    );

    set({ combatUnsubscribe: unsubscribe });
  },

  cleanupSubscriptions: () => {
    get().combatUnsubscribe?.();
    set({
      activeCombat: null,
      participants: [],
      attacks: [],
      currentTurnParticipant: null,
      combatUnsubscribe: null,
    });
  },

  nextTurn: async () => {
    const { activeCombat } = get();
    if (!activeCombat) return;

    // O avanço parte do que o banco guarda. O estado local vem do tempo real e pode estar um
    // passo atrás: dois avanços seguidos partiam do mesmo turno e andavam um só.
    const [current, participants] = await Promise.all([
      getCombat(activeCombat.id),
      listCombatParticipants(activeCombat.id),
    ]);

    let newIndex = current.current_turn_index + 1;
    let newRound = current.round_number;

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

    await updateCombatTurn(current.id, newIndex, newRound);
  },

  endCombat: async () => {
    const { activeCombat } = get();
    if (!activeCombat) return;

    // O estado local vem do tempo real e pode estar atrasado (um dano de um instante atrás ainda
    // não chegou): o PV que vai para a ficha é o que o banco guarda agora. Se a leitura falhar, o
    // combate não encerra, para não gravar um PV velho.
    const participants = await listCombatParticipants(activeCombat.id);

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
        const deadIds: string[] = [];

        for (const char of chars) {
          const participant = participants.find((p) => p.entity_id === char.id);
          if (participant) {
            const currentStats = (char.stats as VitalsLike | null) || {};

            // Clean temporary conditions and keep permanent ones
            const currentConditions =
              (participant.conditions as unknown as ConditionEntry[] | null) || [];
            const permanentConditions = cleanTemporaryConditions(currentConditions);

            const { isDead } = await characterVitalsService.syncFromCombatEnd(
              char.id,
              currentStats,
              participant.hp_current,
              char.is_dead,
              char.is_enemy,
              permanentConditions,
            );

            // Morte Permanente: o inimigo sai da lista se morreu NESTE combate (hp <= 0 agora); um
            // já morto antes, acima de 0 PV, não entra na varredura. O personagem (jogador ou NPC)
            // sai do jogo se morreu nos Testes de Morte (`is_dead`, que é definitivo).
            if (char.is_enemy ? participant.hp_current <= 0 : isDead) {
              deadIds.push(char.id);
            }
          }
        }

        // Soft delete: o inimigo morto continua na lista do Mestre como "Morto"; o personagem morto vira memorial.
        if (deadIds.length > 0) {
          try {
            await softDeleteCharacters(deadIds);
          } catch (deleteError) {
            console.error('Failed to soft delete the dead', deleteError);
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
