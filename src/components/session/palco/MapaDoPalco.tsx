// O Mapa atual no Palco (CONTEXT.md, Palco e Mapa): o terreno da Biblioteca com o grid de
// Quadrados. As coordenadas do desenho estão em Quadrados (1 unidade = 1,5 m).
import type { SessionMap } from '@/data-access/maps';
import { findMapLibraryEntry } from '@/content/maps';

interface MapaDoPalcoProps {
  map: SessionMap;
}

export function MapaDoPalco({ map }: MapaDoPalcoProps) {
  const entry = findMapLibraryEntry(map.library_id);
  const label = `Mapa: ${map.name}`;

  if (!entry) {
    return (
      <section
        aria-label={label}
        className="rounded-lg border border-stone-800 bg-stone-950/40 p-6 text-center text-sm text-stone-500"
      >
        Mapa indisponível.
      </section>
    );
  }

  const patternId = `textura-${map.id}`;
  const vertical = Array.from({ length: map.columns - 1 }, (_, i) => i + 1);
  const horizontal = Array.from({ length: map.rows - 1 }, (_, i) => i + 1);

  return (
    <section
      aria-label={label}
      className="relative overflow-hidden rounded-lg border border-stone-800 bg-stone-950/40"
    >
      <svg
        viewBox={`0 0 ${map.columns} ${map.rows}`}
        preserveAspectRatio="xMidYMid meet"
        className="block max-h-[70vh] w-full"
        role="presentation"
      >
        <defs>
          <pattern id={patternId} width="2" height="2" patternUnits="userSpaceOnUse">
            <circle cx="0.4" cy="0.5" r="0.06" fill={entry.speck} />
            <circle cx="1.45" cy="1.2" r="0.05" fill={entry.speck} />
            <circle cx="0.9" cy="1.7" r="0.04" fill={entry.speck} />
          </pattern>
        </defs>
        <rect width={map.columns} height={map.rows} fill={entry.fill} />
        <rect width={map.columns} height={map.rows} fill={`url(#${patternId})`} />
        {map.grid_visible && (
          <g
            data-testid="grid-do-mapa"
            data-vertical={vertical.length}
            data-horizontal={horizontal.length}
            className="text-stone-950/40"
            stroke="currentColor"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          >
            {vertical.map((x) => (
              <line
                key={`v${x}`}
                x1={x}
                y1={0}
                x2={x}
                y2={map.rows}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {horizontal.map((y) => (
              <line
                key={`h${y}`}
                x1={0}
                y1={y}
                x2={map.columns}
                y2={y}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        )}
      </svg>
    </section>
  );
}
