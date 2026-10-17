import type { ItemCategory } from './schemas';

// Categorias de equipamento que cada Vocação sabe usar (proficiência de armas e armaduras).
export const VOCATION_PROFICIENCIES: Record<string, ItemCategory[]> = {
  Guerreiro: ['Simples', 'Marcial', 'Leve', 'Média', 'Pesada', 'Escudo', 'Todas'],
  Caçador: ['Simples', 'Marcial', 'Leve', 'Média', 'Todas'],
  Batedor: ['Simples', 'Marcial', 'Leve', 'Média', 'Todas'],
  Sacerdote: ['Simples', 'Leve', 'Sagrada', 'Todas'],
  Sábio: ['Simples', 'Leve', 'Sagrada', 'Todas'],
};
