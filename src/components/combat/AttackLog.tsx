import type { CombatAttack } from '@/data-access/combat';

/** Os últimos ataques do combate com os números que o jogador não vê (d20, total e CA). */
export function AttackLog({ attacks }: { attacks: CombatAttack[] }) {
  if (attacks.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
        Últimos ataques
      </h3>
      <ul className="space-y-1">
        {attacks.map((attack) => (
          <li
            key={attack.id}
            className="rounded border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-300"
          >
            <span className="font-medium text-stone-100">
              {attack.attacker_name} → {attack.target_name}
            </span>
            {': '}d20 {attack.natural_roll} ({attack.total} contra CA {attack.target_ac}) ·{' '}
            <span className={attack.hit ? 'text-green-400' : 'text-red-400'}>
              {attack.critical
                ? 'Acerto Crítico'
                : attack.fumble
                  ? 'Falha Crítica'
                  : attack.hit
                    ? 'Acertou'
                    : 'Errou'}
            </span>
            {attack.hit && (
              <>
                {' · '}
                {attack.damage} de dano (PV {attack.target_hp_before} → {attack.target_hp_after})
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
