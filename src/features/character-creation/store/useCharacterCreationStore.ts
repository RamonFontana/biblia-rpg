import { create } from 'zustand';
import type { DraftCharacter, CharacterAttributes, EquipmentItem, CharacterStats, CharacterNarrative } from '../types';

interface CharacterCreationState {
  currentStep: number;
  draft: DraftCharacter;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  setName: (name: string) => void;
  setTribe: (tribe: string) => void;
  setVocation: (vocation: string) => void;
  setAttributes: (attributes: CharacterAttributes) => void;
  setFaithAspects: (fortress: string, temptation: string) => void;
  setStats: (stats: CharacterStats) => void;
  setEquipment: (equipment: EquipmentItem[], remainingCoins: number) => void;
  setNarrative: (narrative: CharacterNarrative) => void;
}

const initialState: DraftCharacter = {
  name: '',
  tribe: '',
  vocation: '',
  coins: 0,
  equipment: [],
};

export const useCharacterCreationStore = create<CharacterCreationState>((set) => ({
  currentStep: 1,
  draft: initialState,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 9) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

  setName: (name) => set((state) => ({ draft: { ...state.draft, name } })),
  setTribe: (tribe) => set((state) => ({ draft: { ...state.draft, tribe } })),
  setVocation: (vocation) => set((state) => ({ draft: { ...state.draft, vocation } })),
  setAttributes: (attributes) => set((state) => ({ draft: { ...state.draft, attributes } })),
  setFaithAspects: (fortress, temptation) => set((state) => ({ draft: { ...state.draft, fortress, temptation } })),
  setStats: (stats) => set((state) => ({ draft: { ...state.draft, stats } })),
  setEquipment: (equipment, remainingCoins) => set((state) => ({ draft: { ...state.draft, equipment, coins: remainingCoins } })),
  setNarrative: (narrative) => set((state) => ({ draft: { ...state.draft, narrative } })),
}));
