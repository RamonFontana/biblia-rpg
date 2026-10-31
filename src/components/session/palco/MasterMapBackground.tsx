// O fundo do mapa enviado pelo Mestre (dentro do SVG do Palco, em Quadrados): a imagem recortada,
// lida à parte e guardada em cache. Enquanto não chega, um fundo escuro; se falhar, o aviso.
import { useMasterMapImage } from '@/hooks/useMasterMapImage';

interface MasterMapBackgroundProps {
  mapId: string;
  columns: number;
  rows: number;
}

export function MasterMapBackground({ mapId, columns, rows }: MasterMapBackgroundProps) {
  const { data, isError } = useMasterMapImage(mapId);
  const status = data ? 'ready' : isError ? 'error' : 'loading';

  return (
    <g data-testid="fundo-do-mapa" data-status={status}>
      <rect width={columns} height={rows} className="text-stone-900" fill="currentColor" />
      {data && (
        <image
          href={data}
          width={columns}
          height={rows}
          preserveAspectRatio="none"
          aria-hidden="true"
        />
      )}
      {isError && (
        <text
          x={columns / 2}
          y={rows / 2}
          textAnchor="middle"
          fontSize={0.6}
          className="text-stone-400"
          fill="currentColor"
        >
          Não foi possível carregar a imagem do mapa.
        </text>
      )}
    </g>
  );
}
