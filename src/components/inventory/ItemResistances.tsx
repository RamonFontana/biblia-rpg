import { CONDITIONS } from '@/content/conditions';
import { getItemConditionResistances } from '@/domain/armorResistance';
import { getEquipSlot } from '@/domain/equipment';

interface ItemResistancesProps {
  slug?: string | null;
}

/**
 * Resistências a Condição que o item dá. O elmo não dá CA: o que ele oferece é isto, então a
 * nota "Não dá CA" aparece ao lado.
 */
export function ItemResistances({ slug }: ItemResistancesProps) {
  const ids = getItemConditionResistances(slug);
  if (ids.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {getEquipSlot(slug) === 'head' && (
        <span className="text-[10px] text-stone-500">Não dá CA</span>
      )}
      {ids.map((id) => (
        <span
          key={id}
          className="text-[10px] px-1.5 py-0.5 bg-amber-900/30 text-amber-300 rounded border border-amber-900/50"
        >
          Resiste: {CONDITIONS[id]?.name ?? id}
        </span>
      ))}
    </div>
  );
}
