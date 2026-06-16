import { create } from 'zustand';

export type SessionEnemyDraft = {
  id: string; // temp id
  base_enemy_id: string;
  name: string;
  max_hp: number;
  current_hp: number;
};

export type SessionNPCDraft = {
  id: string; // temp id
  name: string;
  description: string;
  stats?: Record<string, any>;
};

interface SessionDraftState {
  // Step 1: Preparation
  name: string;
  description: string;
  setPreparation: (name: string, description: string) => void;

  // Step 2: Enemies
  enemies: SessionEnemyDraft[];
  setEnemies: (enemies: SessionEnemyDraft[]) => void;
  addEnemy: (enemy: SessionEnemyDraft) => void;
  updateEnemy: (id: string, updates: Partial<SessionEnemyDraft>) => void;
  removeEnemy: (id: string) => void;

  // Step 3: NPCs
  npcs: SessionNPCDraft[];
  setNPCs: (npcs: SessionNPCDraft[]) => void;
  addNPC: (npc: SessionNPCDraft) => void;
  updateNPC: (id: string, updates: Partial<SessionNPCDraft>) => void;
  removeNPC: (id: string) => void;

  // Step 4: Players (Characters)
  participantCharacterIds: string[];
  setParticipantCharacterIds: (ids: string[]) => void;

  // Form Navigation State
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Reset
  resetStore: () => void;
}

export const useSessionDraftStore = create<SessionDraftState>((set) => ({
  name: '',
  description: '',
  setPreparation: (name, description) => set({ name, description }),

  enemies: [],
  setEnemies: (enemies) => set({ enemies }),
  addEnemy: (enemy) => set((state) => ({ enemies: [...state.enemies, enemy] })),
  updateEnemy: (id, updates) => set((state) => ({
    enemies: state.enemies.map(e => e.id === id ? { ...e, ...updates } : e)
  })),
  removeEnemy: (id) => set((state) => ({
    enemies: state.enemies.filter(e => e.id !== id)
  })),

  npcs: [],
  setNPCs: (npcs) => set({ npcs }),
  addNPC: (npc) => set((state) => ({ npcs: [...state.npcs, npc] })),
  updateNPC: (id, updates) => set((state) => ({
    npcs: state.npcs.map(n => n.id === id ? { ...n, ...updates } : n)
  })),
  removeNPC: (id) => set((state) => ({
    npcs: state.npcs.filter(n => n.id !== id)
  })),

  participantCharacterIds: [],
  setParticipantCharacterIds: (ids) => set({ participantCharacterIds: ids }),

  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

  resetStore: () => set({
    name: '',
    description: '',
    enemies: [],
    npcs: [],
    participantCharacterIds: [],
    currentStep: 1,
  }),
}));
