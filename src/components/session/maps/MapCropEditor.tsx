// O editor de recorte de um mapa enviado (CONTEXT.md: Mapa, Quadrado): a imagem fica por baixo do
// grid; o Mestre a arrasta e amplia até as linhas baterem com o desenho e escolhe colunas × linhas
// inteiras. Só na web. Reaproveita a vista do Palco (`PanZoomViewport`) e a compressão da imagem.
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PanZoomViewport, type ViewApi } from '@/components/map/PanZoomViewport';
import { DEFAULT_GRID, clampGridSide } from '@/domain/map/grid';
import { MAX_MAP_IMAGE_SIDE, cropRect, frameSize, outputSize } from '@/domain/map/crop';
import { cropToDataUrl, loadImageFile } from '@/lib/imageCompression';

export interface CroppedMap {
  name: string;
  columns: number;
  rows: number;
  /** O recorte em data URL webp, de no máximo 2048 px no lado maior. */
  image: string;
}

interface MapCropEditorProps {
  file: File;
  onSave: (map: CroppedMap) => void | Promise<void>;
  onCancel: () => void;
}

const QUALITY = 0.82;
const FRAME_MAX = { width: 560, height: 360 };

interface Loaded {
  image: HTMLImageElement;
  url: string;
}

const baseName = (file: File) => file.name.replace(/\.[^.]+$/, '') || 'Mapa';

export function MapCropEditor({ file, onSave, onCancel }: MapCropEditorProps) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [name, setName] = useState(() => baseName(file));
  const [columns, setColumns] = useState(String(DEFAULT_GRID.columns));
  const [rows, setRows] = useState(String(DEFAULT_GRID.rows));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const viewApi = useRef<ViewApi>(null);

  useEffect(() => {
    let active = true;
    let revoke: (() => void) | undefined;
    loadImageFile(file)
      .then((result) => {
        revoke = result.revoke;
        if (active) setLoaded({ image: result.image, url: result.url });
        else result.revoke();
      })
      .catch(() => active && setLoadFailed(true));
    return () => {
      active = false;
      revoke?.();
    };
  }, [file]);

  if (loadFailed) {
    return (
      <div className="space-y-3">
        <p role="alert" className="text-sm text-red-400">
          Não foi possível abrir a imagem. Tente outro arquivo.
        </p>
        <Button type="button" variant="outline" className="min-h-11" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    );
  }

  const cols = clampGridSide(Number(columns));
  const rowCount = clampGridSide(Number(rows));
  const frame = frameSize(cols, rowCount, FRAME_MAX.width, FRAME_MAX.height);
  const vertical = Array.from({ length: cols - 1 }, (_, i) => i + 1);
  const horizontal = Array.from({ length: rowCount - 1 }, (_, i) => i + 1);

  const save = async () => {
    if (!loaded || !viewApi.current) return;
    setError(null);
    setSaving(true);
    let image: string;
    try {
      const view = viewApi.current.getView();
      const rect = cropRect(view, viewApi.current.getViewport());
      image = cropToDataUrl(loaded.image, rect, outputSize(rect, MAX_MAP_IMAGE_SIDE), QUALITY);
    } catch (cause) {
      console.error(cause);
      setError('Não foi possível recortar a imagem. Tente de novo.');
      setSaving(false);
      return;
    }
    try {
      await onSave({ name: name.trim() || baseName(file), columns: cols, rows: rowCount, image });
    } catch (cause) {
      console.error(cause);
      setError('Não foi possível salvar o mapa. Tente de novo.');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <div className="grid grid-cols-3 gap-3">
        <label className="col-span-3 block space-y-1 text-sm text-stone-300">
          <span>Nome do mapa</span>
          <Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </label>
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
      <p className="text-xs text-stone-500">
        Arraste e amplie a imagem até as linhas baterem com o desenho. Cada Quadrado vale 1,5 m.
      </p>

      <div
        className="mx-auto overflow-hidden rounded-lg border border-stone-700 bg-stone-950"
        style={{ width: frame.width, height: frame.height }}
      >
        {loaded ? (
          <PanZoomViewport
            key={`${cols}x${rowCount}`}
            label="Imagem do mapa"
            fit="cover"
            minHeight={0}
            className="h-full"
            apiRef={viewApi}
            content={{ width: loaded.image.naturalWidth, height: loaded.image.naturalHeight }}
            overlay={
              <svg
                viewBox={`0 0 ${cols} ${rowCount}`}
                preserveAspectRatio="none"
                className="h-full w-full text-amber-300/70"
                role="presentation"
              >
                <g
                  data-testid="grid-do-recorte"
                  data-vertical={vertical.length}
                  data-horizontal={horizontal.length}
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  {vertical.map((x) => (
                    <line
                      key={`v${x}`}
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={rowCount}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  {horizontal.map((y) => (
                    <line
                      key={`h${y}`}
                      x1={0}
                      y1={y}
                      x2={cols}
                      y2={y}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </g>
              </svg>
            }
          >
            <img
              src={loaded.url}
              alt=""
              draggable={false}
              width={loaded.image.naturalWidth}
              height={loaded.image.naturalHeight}
              className="block max-w-none select-none"
            />
          </PanZoomViewport>
        ) : (
          <p className="p-6 text-center text-sm text-stone-400">Abrindo a imagem...</p>
        )}
      </div>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button type="button" variant="outline" className="min-h-11" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" className="min-h-11" disabled={!loaded || saving} onClick={save}>
          Salvar mapa
        </Button>
      </div>
    </div>
  );
}
