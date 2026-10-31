// A escuridão do mapa (CONTEXT.md: Ambiente, Escuridão, Penumbra, Fonte de luz), dentro do SVG do
// Palco e em Quadrados. Uma camada escura cobre o mapa; cada Fonte de luz abre um círculo na máscara:
// inteiro na Luz plena e esmaecendo ao longo da faixa de Penumbra. O Mestre vê o escuro mais leve.
import { SQUARE_METERS } from '@/domain/map/grid';
import type { Ambient, LightSource } from '@/domain/map/light';

interface DarknessLayerProps {
  mapId: string;
  ambient: Ambient;
  sources: LightSource[];
  columns: number;
  rows: number;
  /** O Mestre vê tudo: a escuridão dele vale a metade. */
  lighter: boolean;
}

const AMBIENT_OPACITY: Record<Ambient, number> = { claro: 0, penumbra: 0.45, escuridao: 0.82 };

export function DarknessLayer({
  mapId,
  ambient,
  sources,
  columns,
  rows,
  lighter,
}: DarknessLayerProps) {
  const base = AMBIENT_OPACITY[ambient];
  if (base === 0) return null;
  const opacity = lighter ? base / 2 : base;
  const maskId = `escuridao-${mapId}`;

  return (
    <g
      data-testid="escuridao-do-mapa"
      data-ambient={ambient}
      data-opacity={opacity}
      data-sources={sources.length}
      pointerEvents="none"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={columns} height={rows}>
          <rect width={columns} height={rows} fill="white" />
          {sources.map((source, index) => {
            const total = source.brightM + source.dimM;
            // Uma fonte de raio zero ainda ilumina o próprio Quadrado.
            const radius = Math.max(total / SQUARE_METERS, 0.5);
            const inner = total > 0 ? source.brightM / total : 1;
            const gradient = `${maskId}-g${index}`;
            return (
              <g key={index}>
                <radialGradient id={gradient}>
                  <stop offset={inner} stopColor="black" stopOpacity={1} />
                  <stop offset={1} stopColor="black" stopOpacity={source.dimM > 0 ? 0 : 1} />
                </radialGradient>
                <circle
                  cx={source.cell.col + 0.5}
                  cy={source.cell.row + 0.5}
                  r={radius}
                  fill={`url(#${gradient})`}
                />
              </g>
            );
          })}
        </mask>
      </defs>
      <rect
        width={columns}
        height={rows}
        className="text-stone-950"
        fill="currentColor"
        opacity={opacity}
        mask={`url(#${maskId})`}
      />
    </g>
  );
}
