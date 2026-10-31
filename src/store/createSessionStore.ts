import { create } from 'zustand';

export type SessionEnemyDraft = {
  id: string; // temp id
  name: string;
  hpMax: number;
  hpCurrent: number;
  ca: number;
  vocation?: string;
  attributes?: {
    for: number;
    des: number;
    con: number;
    int: number;
    sab: number;
    car: number;
  };
  skills?: { name: string; description: string }[];
  imageBase64?: string;
};

/** Um terreno da Biblioteca de mapas que o Mestre escolheu para a sessão. */
export type SessionMapDraft = {
  id: string; // temp id
  libraryId: string;
  name: string;
  columns: number;
  rows: number;
};

/** A ficha de um NPC jogável da preparação: as chaves do formulário, lidas com valor padrão. */
export type SessionNPCCharacterData = {
  tribo?: string;
  classe?: string;
  level?: number;
  ca?: number;
  for?: number;
  des?: number;
  con?: number;
  int?: number;
  sab?: number;
  car?: number;
};

export type SessionNPCDraft = {
  id: string; // temp id
  name: string;
  description: string;
  stats?: Record<string, unknown>;
  isPlayable: boolean;
  characterData?: SessionNPCCharacterData;
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

  // Step 5: Maps (optional)
  maps: SessionMapDraft[];
  addMap: (map: SessionMapDraft) => void;
  removeMap: (id: string) => void;

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
  updateEnemy: (id, updates) =>
    set((state) => ({
      enemies: state.enemies.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),
  removeEnemy: (id) =>
    set((state) => ({
      enemies: state.enemies.filter((e) => e.id !== id),
    })),

  npcs: [],
  setNPCs: (npcs) => set({ npcs }),
  addNPC: (npc) => set((state) => ({ npcs: [...state.npcs, npc] })),
  updateNPC: (id, updates) =>
    set((state) => ({
      npcs: state.npcs.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),
  removeNPC: (id) =>
    set((state) => ({
      npcs: state.npcs.filter((n) => n.id !== id),
    })),

  participantCharacterIds: [],
  setParticipantCharacterIds: (ids) => set({ participantCharacterIds: ids }),

  maps: [],
  addMap: (map) => set((state) => ({ maps: [...state.maps, map] })),
  removeMap: (id) => set((state) => ({ maps: state.maps.filter((m) => m.id !== id) })),

  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 6) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

  resetStore: () =>
    set({
      name: '',
      description: '',
      enemies: [],
      npcs: [],
      participantCharacterIds: [],
      maps: [],
      currentStep: 1,
    }),
}));
