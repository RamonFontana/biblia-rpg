// O seletor de terreno da Biblioteca de mapas: terreno, nome e tamanho em Quadrados. É o mesmo no
// Painel Mapas do Mestre e no passo "Mapas" da criação da sessão. Termos: CONTEXT.md (Biblioteca de
// mapas, Quadrado).
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MAP_LIBRARY, findMapLibraryEntry } from '@/content/maps';
import { DEFAULT_GRID, clampGridSide } from '@/domain/map/grid';

export interface TerrainChoice {
  libraryId: string;
  name: string;
  columns: number;
  rows: number;
}

interface TerrainPickerProps {
  onAdd: (terrain: TerrainChoice) => void;
}

const fieldClass =
  'flex h-9 w-full rounded-md border border-stone-700 bg-stone-800 px-2 py-1 text-sm text-stone-100';

export function TerrainPicker({ onAdd }: TerrainPickerProps) {
  const [libraryId, setLibraryId] = useState(MAP_LIBRARY[0]?.id ?? '');
  const [name, setName] = useState(MAP_LIBRARY[0]?.name ?? '');
  const [columns, setColumns] = useState(String(DEFAULT_GRID.columns));
  const [rows, setRows] = useState(String(DEFAULT_GRID.rows));
  const terrainId = useId();

  const pickLibrary = (id: string) => {
    setLibraryId(id);
    setName(findMapLibraryEntry(id)?.name ?? '');
  };

  const add = () =>
    onAdd({
      libraryId,
      name: name.trim() || (findMapLibraryEntry(libraryId)?.name ?? 'Mapa'),
      columns: clampGridSide(Number(columns)),
      rows: clampGridSide(Number(rows)),
    });

  return (
    <section aria-label="Somar terreno" className="space-y-3">
      <h3 className="font-serif text-lg text-stone-100">Somar terreno</h3>
      <div className="space-y-1 text-sm text-stone-300">
        <label htmlFor={terrainId}>Terreno</label>
        <select
          id={terrainId}
          value={libraryId}
          onChange={(e) => pickLibrary(e.target.value)}
          className={fieldClass}
        >
          {MAP_LIBRARY.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
      </div>
      <label className="block space-y-1 text-sm text-stone-300">
        <span>Nome do mapa</span>
        <Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1 text-sm text-stone-300">
          <span>Colunas</span>
          <Input
            type="number"
            inputMode="numeric"
            min={5}
            max={60}
            value={columns}
            onChange={(e) => setColumns(e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-sm text-stone-300">
          <span>Linhas</span>
          <Input
            type="number"
            inputMode="numeric"
            min={5}
            max={60}
            value={rows}
            onChange={(e) => setRows(e.target.value)}
          />
        </label>
      </div>
      <p className="text-xs text-stone-500">De 5 a 60 Quadrados por lado; cada um vale 1,5 m.</p>
      <Button type="button" className="min-h-11" onClick={add}>
        Somar terreno
      </Button>
    </section>
  );
}
