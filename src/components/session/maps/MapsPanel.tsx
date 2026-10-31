// O Painel Mapas do Mestre (ADR 0009): soma terrenos da Biblioteca, prepara um mapa só para ele e o
// mostra aos jogadores (o Mapa atual). Termos: CONTEXT.md (Mapa, Mapa atual, Biblioteca de mapas).
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  addSessionMap,
  removeSessionMap,
  showSessionMap,
  updateSessionMap,
  type SessionMap,
} from '@/data-access/maps';
import { MasterMapLibrary } from './MasterMapLibrary';
import { TerrainPicker } from './TerrainPicker';

interface MapsPanelProps {
  sessionId: string;
  /** O Mestre da sessão: dono dos "Meus mapas". */
  ownerId: string;
  maps: SessionMap[];
  /** O Mapa atual: o que os jogadores veem. */
  shownMapId: string | null;
  /** O mapa que o Mestre abriu só para si; fica na tela dele, não no banco. */
  preparedId: string | null;
  onPrepare: (id: string | null) => void;
}

const ERROR = 'Não foi possível salvar. Tente de novo.';

export function MapsPanel({
  sessionId,
  ownerId,
  maps,
  shownMapId,
  preparedId,
  onPrepare,
}: MapsPanelProps) {
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (cause) {
      console.error(cause);
      setError(ERROR);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <TerrainPicker
        onAdd={(terrain) =>
          run(() => addSessionMap({ sessionId, ...terrain, position: maps.length }))
        }
      />

      <MasterMapLibrary
        ownerId={ownerId}
        onPick={(map) =>
          run(() =>
            addSessionMap({
              sessionId,
              masterMapId: map.id,
              name: map.name,
              columns: map.columns,
              rows: map.rows,
              position: maps.length,
            }),
          )
        }
      />

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
