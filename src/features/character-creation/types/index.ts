export interface CharacterAttributes {
  for: number;
  des: number;
  con: number;
  int: number;
  sab: number;
  car: number;
}

export interface CharacterStats {
  pv: number;
  current_pv?: number;
  ca: number;
  faith: number;
  current_faith?: number;
  status?: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  description?: string;
  type: string;
  cost?: number;
  damage?: string;
  armorClass?: number;
}

export interface CharacterNarrative {
  imageUrl?: string;
  physicalDesc?: string;
  history?: string;
  personality?: string;
}

export interface DraftCharacter {
  name?: string;
  tribe?: string;
  vocation?: string;
  attributes?: CharacterAttributes;
  fortress?: string;
  temptation?: string;
  stats?: CharacterStats;
  equipment?: EquipmentItem[];
  coins?: number;
  narrative?: CharacterNarrative;
}
