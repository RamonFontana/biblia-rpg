// O Painel Mapas do Mestre (ADR 0009): soma terrenos da Biblioteca, prepara um mapa só para ele e o
// mostra aos jogadores (o Mapa atual). Termos: CONTEXT.md (Mapa, Mapa atual, Biblioteca de mapas).
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MAP_LIBRARY, findMapLibraryEntry } from '@/content/maps';
import {
  addSessionMap,
  removeSessionMap,
  showSessionMap,
  updateSessionMap,
  type SessionMap,
} from '@/data-access/maps';
import { DEFAULT_GRID, clampGridSide } from '@/domain/map/grid';

interface MapsPanelProps {
  sessionId: string;
  maps: SessionMap[];
  /** O Mapa atual: o que os jogadores veem. */
  shownMapId: string | null;
  /** O mapa que o Mestre abriu só para si; fica na tela dele, não no banco. */
  preparedId: string | null;
  onPrepare: (id: string | null) => void;
}

const ERROR = 'Não foi possível salvar. Tente de novo.';
const fieldClass =
  'flex h-9 w-full rounded-md border border-stone-700 bg-stone-800 px-2 py-1 text-sm text-stone-100';

export function MapsPanel({ sessionId, maps, shownMapId, preparedId, onPrepare }: MapsPanelProps) {
  const [libraryId, setLibraryId] = useState(MAP_LIBRARY[0]?.id ?? '');
  const [name, setName] = useState(MAP_LIBRARY[0]?.name ?? '');
  const [columns, setColumns] = useState(String(DEFAULT_GRID.columns));
  const [rows, setRows] = useState(String(DEFAULT_GRID.rows));
  const [error, setError] = useState<string | null>(null);
  const terrainId = useId();

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (cause) {
      console.error(cause);
      setError(ERROR);
    }
  };

  const pickLibrary = (id: string) => {
    setLibraryId(id);
    setName(findMapLibraryEntry(id)?.name ?? '');
  };

  const addTerrain = () =>
    run(() =>
      addSessionMap({
        sessionId,
        libraryId,
        name: name.trim() || (findMapLibraryEntry(libraryId)?.name ?? 'Mapa'),
        columns: clampGridSide(Number(columns)),
        rows: clampGridSide(Number(rows)),
        position: maps.length,
      }),
    );

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

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
        <Button className="min-h-11" onClick={addTerrain}>
          Somar terreno
        </Button>
      </section>

      <section aria-label="Mapas da sessão" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-serif text-lg text-stone-100">Mapas da sessão</h3>
          {shownMapId && (
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() =>
                run(async () => {
                  await showSessionMap(sessionId, null);
                  onPrepare(null);
                })
              }
            >
              Voltar à cena
            </Button>
          )}
        </div>
        {maps.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhum mapa ainda. Some um terreno acima.</p>
        ) : (
          <ul className="space-y-3">
            {maps.map((map) => (
              <MapRow
                key={map.id}
                map={map}
                shown={map.id === shownMapId}
                prepared={map.id === preparedId}
                onPrepare={() => onPrepare(map.id)}
                onShow={() => run(() => showSessionMap(sessionId, map.id))}
                onGrid={(visible) => run(() => updateSessionMap(map.id, { grid_visible: visible }))}
                onRename={(next) => run(() => updateSessionMap(map.id, { name: next }))}
                onRemove={() =>
                  run(async () => {
                    await removeSessionMap(map.id);
                    if (map.id === preparedId) onPrepare(null);
                  })
                }
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MapRow({
  map,
  shown,
  prepared,
  onPrepare,
  onShow,
  onGrid,
  onRename,
  onRemove,
}: {
  map: SessionMap;
  shown: boolean;
  prepared: boolean;
  onPrepare: () => void;
  onShow: () => void;
  onGrid: (visible: boolean) => void;
  onRename: (name: string) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState(map.name);
  const commitName = () => {
    const next = draft.trim();
    if (next && next !== map.name) onRename(next);
    else setDraft(map.name);
  };

  return (
    <li className="space-y-2 rounded-lg border border-stone-700 bg-stone-900 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label={`Nome de ${map.name}`}
          value={draft}
          maxLength={80}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitName}
          className="min-w-0 flex-1"
        />
        {shown && (
          <span className="rounded-full border border-amber-500/60 px-2 py-0.5 text-xs text-amber-400">
            Mapa atual
          </span>
        )}
        {prepared && !shown && (
          <span className="rounded-full border border-stone-600 px-2 py-0.5 text-xs text-stone-300">
            Em preparo
          </span>
        )}
      </div>
      <p className="text-xs text-stone-400">
        {map.columns}×{map.rows} Quadrados
      </p>
      <label className="flex min-h-11 items-center gap-2 text-sm text-stone-300">
        <input
          type="checkbox"
          aria-label={`Linhas do grid de ${map.name}`}
          checked={map.grid_visible}
          onChange={(e) => onGrid(e.target.checked)}
          className="h-4 w-4"
        />
        Linhas do grid
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="min-h-11"
          aria-label={`Preparar ${map.name}`}
          onClick={onPrepare}
          disabled={prepared}
        >
          Preparar
        </Button>
        <Button
          className="min-h-11"
          aria-label={`Mostrar aos jogadores: ${map.name}`}
          onClick={onShow}
          disabled={shown}
        >
          Mostrar aos jogadores
        </Button>
        <Button
          variant="ghost"
          className="min-h-11 text-red-400"
          aria-label={`Remover ${map.name}`}
          onClick={onRemove}
        >
          Remover
        </Button>
      </div>
    </li>
  );
}
