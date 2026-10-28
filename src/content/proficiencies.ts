import type { ItemCategory } from './schemas';

const SACERDOTE: ItemCategory[] = ['Simples', 'Leve', 'Média', 'Escudo', 'Sagrada', 'Todas'];

// Categorias de equipamento que cada Vocação sabe usar (proficiência de armas, armaduras e
// escudos). As armaduras e escudos seguem a linha "Proficiências" de docs/vocacoes (conferido por
// proficiencies.test.ts); a Sagrada é a Túnica Sagrada, exclusiva de Sacerdote e Sábio.
export const VOCATION_PROFICIENCIES: Record<string, ItemCategory[]> = {
  Guerreiro: ['Simples', 'Marcial', 'Leve', 'Média', 'Pesada', 'Escudo', 'Todas'],
  Caçador: ['Simples', 'Marcial', 'Leve', 'Média', 'Escudo', 'Todas'],
  Batedor: ['Simples', 'Leve', 'Todas'],
  Sacerdote: SACERDOTE,
  Sábio: SACERDOTE,
};

// Armas marciais que a Vocação usa sem saber usar a categoria inteira. O Batedor usa armas simples,
// espadas curtas, arcos curtos e facas de bronze (docs/vocacoes/batedor.md); a faca já é simples.
export const VOCATION_MARTIAL_WEAPONS: Record<string, string[]> = {
  Batedor: ['espada_curta', 'arco_curto'],
};
