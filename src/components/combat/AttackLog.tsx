import { CONDITIONS } from '@/content/conditions';
import type { CombatAttack } from '@/data-access/combat';
import type { ConditionEntry } from '@/types/combat';

const MODE_LABEL: Record<string, string> = {
  vantagem: 'com Vantagem',
  desvantagem: 'com Desvantagem',
};

function outcomeOf(attack: CombatAttack): string {
  if (attack.critical) return 'Acerto Crítico';
  if (attack.fumble) return 'Falha Crítica';
  return attack.hit ? 'Acertou' : 'Errou';
}

/** O efeito de arma de um ataque: as Condições que chegaram ao alvo, ou "resistido". */
function weaponEffectText(attack: CombatAttack): string | null {
  if (!attack.weapon_effect_triggered) return null;
  const applied = (attack.weapon_effect_conditions as unknown as ConditionEntry[]) ?? [];
  if (applied.length === 0) return 'Efeito de arma resistido';
  const names = applied.map((c) => CONDITIONS[c.conditionId]?.name ?? c.conditionId);
  return `Efeito de arma: ${names.join(', ')}`;
}

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
            {': '}d20 {attack.rolls ? attack.rolls.join(' e ') : attack.natural_roll} (
            {attack.total} contra CA {attack.target_ac}) ·{' '}
            <span className={attack.hit ? 'text-green-400' : 'text-red-400'}>
              {outcomeOf(attack)}
            </span>
            {MODE_LABEL[attack.applied_mode] && ` · ${MODE_LABEL[attack.applied_mode]}`}
            {attack.inspiration_used && ' · Inspiração'}
            {weaponEffectText(attack) && ` · ${weaponEffectText(attack)}`}
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
