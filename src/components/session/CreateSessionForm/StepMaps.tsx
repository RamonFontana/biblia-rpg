import { useSessionDraftStore } from '@/store/createSessionStore';
import { Button } from '@/components/ui/button';
import { TerrainPicker } from '@/components/session/maps/TerrainPicker';

export function StepMaps() {
  const { maps, addMap, removeMap, nextStep, prevStep } = useSessionDraftStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Mapas da Sessão</h2>
        <p className="text-muted-foreground">
          Passo opcional: escolha os terrenos que pretende usar. Dá para somar mapas durante o jogo.
        </p>
      </div>

      <div className="border rounded-lg p-4 bg-stone-950/40">
        <TerrainPicker onAdd={(terrain) => addMap({ id: crypto.randomUUID(), ...terrain })} />
      </div>

      <div className="border rounded-lg p-4 bg-muted/20">
        <h3 className="font-medium text-lg mb-3">Mapas escolhidos ({maps.length})</h3>
        {maps.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nenhum mapa escolhido.</p>
        ) : (
          <ul className="space-y-2">
            {maps.map((map) => (
              <li
                key={map.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3 bg-card"
              >
                <div>
                  <p className="font-medium">{map.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {map.columns}×{map.rows} Quadrados
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 text-red-400"
                  aria-label={`Remover ${map.name}`}
                  onClick={() => removeMap(map.id)}
                >
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={prevStep} className="w-full sm:w-auto">
          Voltar
        </Button>
        <Button type="button" onClick={nextStep} className="w-full sm:w-auto">
          Próximo: Resumo
        </Button>
      </div>
    </div>
  );
}
