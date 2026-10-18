import { getEquipWarnings } from '@/domain/equipWarnings';

interface EquipWarningsProps {
  slug?: string | null;
  vocation?: string | null;
  strength?: number | null;
}

/** Avisos de armadura e escudo: sem proficiência ou sem a FOR exigida. Não impedem de equipar. */
export function EquipWarnings({ slug, vocation, strength }: EquipWarningsProps) {
  const warnings = getEquipWarnings({ slug, vocation, strength });
  if (warnings.length === 0) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {warnings.map((warning) => (
        <p key={warning.kind} className="text-[10px] font-semibold text-amber-400">
          <span aria-hidden="true">⚠ </span>
          <span>{warning.message}</span>
        </p>
      ))}
    </div>
  );
}
