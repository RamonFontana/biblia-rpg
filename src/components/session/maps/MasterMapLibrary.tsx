// "Meus mapas" (CONTEXT.md: Mapa): os mapas que o Mestre enviou, que servem a qualquer sessão dele.
// Aqui ele envia uma imagem (só na web), renomeia, apaga e escolhe um para a sessão. O mesmo
// componente serve ao Painel Mapas e ao passo "Mapas" da criação da sessão.
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  createMasterMap,
  listMasterMaps,
  removeMasterMap,
  renameMasterMap,
  type MasterMap,
} from '@/data-access/masterMaps';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { validateMapFile } from '@/lib/imageCompression';
import { MapCropEditor, type CroppedMap } from './MapCropEditor';

interface MasterMapLibraryProps {
  /** O Mestre dono dos mapas. */
  ownerId: string;
  /** O Mestre escolheu este mapa para a sessão. */
  onPick: (map: MasterMap) => void | Promise<void>;
}

const IN_USE =
  'Esse mapa está em uso por uma sessão ativa. Termine a sessão ou tire o mapa dela antes.';

export function MasterMapLibrary({ ownerId, onPick }: MasterMapLibraryProps) {
  const client = useQueryClient();
  // Enviar e recortar pede tela e mouse: no celular só se escolhe e se usa.
  const web = useMediaQuery('(min-width: 768px)');
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const key = ['master-maps', ownerId];
  const maps = useQuery({ queryKey: key, queryFn: () => listMasterMaps(ownerId) });
  const refresh = () => client.invalidateQueries({ queryKey: key });

  const create = useMutation({
    mutationFn: (map: CroppedMap) => createMasterMap(map),
    onSuccess: async () => {
      await refresh();
      setFile(null);
    },
  });

  const choose = (selected: File | undefined) => {
    if (fileInput.current) fileInput.current.value = '';
    if (!selected) return;
    const reason = validateMapFile(selected);
    setError(reason);
    if (!reason) setFile(selected);
  };

  return (
    <section aria-label="Meus mapas" className="space-y-3">
      <h3 className="font-serif text-lg text-stone-100">Meus mapas</h3>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {web ? (
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            aria-label="Enviar imagem de mapa"
            className="sr-only"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => fileInput.current?.click()}
          >
            Enviar imagem
          </Button>
          <p className="mt-1 text-xs text-stone-500">
            Até 20 MB. Você recorta em Quadrados antes de salvar.
          </p>
        </div>
      ) : (
        <p className="text-xs text-stone-500">Enviar e recortar mapas é só na web.</p>
      )}

      {maps.isError && (
        <p role="alert" className="text-sm text-red-400">
          Não foi possível carregar os seus mapas.
        </p>
      )}
      {maps.data && maps.data.length === 0 && (
        <p className="text-sm text-stone-500">Nenhum mapa seu ainda.</p>
      )}
      <ul className="space-y-3">
        {maps.data?.map((map) => (
          <MyMapRow
            key={map.id}
            map={map}
            onPick={() => onPick(map)}
            onChanged={refresh}
            onError={setError}
          />
        ))}
      </ul>

      <Dialog open={!!file} onOpenChange={(open) => !open && setFile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recortar mapa</DialogTitle>
          </DialogHeader>
          {file && (
            <MapCropEditor
              file={file}
              onSave={async (cropped) => {
                await create.mutateAsync(cropped);
              }}
              onCancel={() => setFile(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function MyMapRow({
  map,
  onPick,
  onChanged,
  onError,
}: {
  map: MasterMap;
  onPick: () => void | Promise<void>;
  onChanged: () => void;
  onError: (message: string | null) => void;
}) {
  const [draft, setDraft] = useState(map.name);
  const [confirming, setConfirming] = useState(false);

  const rename = async () => {
    const next = draft.trim();
    if (!next || next === map.name) {
      setDraft(map.name);
      return;
    }
    onError(null);
    try {
      await renameMasterMap(map.id, next);
      onChanged();
    } catch (cause) {
      console.error(cause);
      setDraft(map.name);
      onError('Não foi possível renomear o mapa.');
    }
  };

  const remove = async () => {
    onError(null);
    try {
      await removeMasterMap(map.id);
      onChanged();
    } catch (cause) {
      console.error(cause);
      setConfirming(false);
      onError(
        (cause as { code?: string } | null)?.code === '23503'
          ? IN_USE
          : 'Não foi possível apagar o mapa.',
      );
    }
  };

  return (
    <li className="space-y-2 rounded-lg border border-stone-700 bg-stone-900 p-3">
      <Input
        aria-label={`Renomear meu mapa ${map.name}`}
        value={draft}
        maxLength={80}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={rename}
      />
      <p className="text-xs text-stone-400">
        {map.columns}×{map.rows} Quadrados
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="min-h-11"
          aria-label={`Somar à sessão: ${map.name}`}
          onClick={() => void onPick()}
        >
          Somar à sessão
        </Button>
        {confirming ? (
          <>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11"
              aria-label={`Confirmar: apagar ${map.name}`}
              onClick={remove}
            >
              Apagar mesmo
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              aria-label={`Manter ${map.name}`}
              onClick={() => setConfirming(false)}
            >
              Manter
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 text-red-400"
            aria-label={`Apagar meu mapa ${map.name}`}
            onClick={() => setConfirming(true)}
          >
            Apagar
          </Button>
        )}
      </div>
    </li>
  );
}
