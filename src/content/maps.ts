// Biblioteca de mapas do app (CONTEXT.md): hoje só terrenos lisos, gerados pelo app, sem arquivo de
// imagem. Os mapas desenhados entram quando o autor trouxer imagens próprias, com o grid ajustado e a
// licença anotada. O `id` é o `library_id` gravado em `session_maps`: nunca o renomeie.
import type { MapLibraryEntry } from './schemas';

const OWN = { source: 'Gerado pelo app', license: 'Próprio' } as const;

export const MAP_LIBRARY: MapLibraryEntry[] = [
  {
    id: 'terreno-areia',
    name: 'Areia',
    kind: 'terreno',
    fill: '#cdb27a',
    speck: '#b8995f',
    license: OWN,
  },
  {
    id: 'terreno-pedra',
    name: 'Pedra',
    kind: 'terreno',
    fill: '#8a857c',
    speck: '#6f6a62',
    license: OWN,
  },
  {
    id: 'terreno-campo',
    name: 'Campo',
    kind: 'terreno',
    fill: '#8b9a5b',
    speck: '#6f7d44',
    license: OWN,
  },
  {
    id: 'terreno-piso-de-casa',
    name: 'Piso de casa',
    kind: 'terreno',
    fill: '#a98a62',
    speck: '#8c6f4b',
    license: OWN,
  },
];

export function findMapLibraryEntry(id: string): MapLibraryEntry | undefined {
  return MAP_LIBRARY.find((entry) => entry.id === id);
}
