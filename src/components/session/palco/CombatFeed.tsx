// O feed do Palco: os 3 últimos eventos do combate (ataques e usos de Habilidade). Tocar nele abre
// o Painel Histórico, que tem os números por inteiro. Termos: CONTEXT.md (Palco).
import type { CombatAbilityUse, CombatAttack } from '@/data-access/combat';
import { feedEvents } from '@/lib/combatFeed';

interface CombatFeedProps {
  attacks: CombatAttack[];
  abilityUses: CombatAbilityUse[];
  onOpen: () => void;
}

export function CombatFeed({ attacks, abilityUses, onOpen }: CombatFeedProps) {
  const events = feedEvents(attacks, abilityUses);
  if (events.length === 0) return null;
  return (
    <button
      type="button"
      aria-label="Abrir o Histórico do combate"
      onClick={onOpen}
      className="min-h-11 w-full rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-left text-sm text-stone-300 transition-colors hover:border-amber-500/60"
    >
      <ul className="space-y-0.5">
        {events.map((event, index) => (
          <li key={event.id} className={index === 0 ? 'text-stone-100' : 'text-stone-400'}>
            {event.text}
          </li>
        ))}
      </ul>
    </button>
  );
}
