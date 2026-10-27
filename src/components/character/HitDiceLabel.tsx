import { Dices } from 'lucide-react';
import { getHitDice } from '@/domain/hitDice';

interface HitDiceLabelProps {
  level: number | null | undefined;
  /** Os Dados de Vida já gastos (`characters.hit_dice_spent`). */
  spent: number | null | undefined;
  vocation: string | null | undefined;
  className?: string;
}

/** "Dados de Vida 3/5 (d10)": a reserva que sobra, o total (o nível) e o dado da Vocação. */
export function HitDiceLabel({ level, spent, vocation, className = '' }: HitDiceLabelProps) {
  const { remaining, total, die } = getHitDice({ level, spent, vocation });
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Dices className="h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden="true" />
      <span className="font-mono tabular-nums">{`Dados de Vida ${remaining}/${total} (d${die})`}</span>
    </span>
  );
}
