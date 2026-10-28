import { CONDITIONS } from '@/content/conditions';
import { abilityUseTargets, type AbilityUseTarget } from '@/domain/abilityEffect';
import { saveAttributeLabel, type SaveAttribute } from '@/domain/abilitySave';
import { describeWeaponEffect } from '@/domain/attack';
import { describeReminder, enemyEffectOfUse } from '@/domain/enemyAbility';
import type { CombatAbilityUse, CombatAttack } from '@/data-access/combat';
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
  const applied = (attack.weapon_effect_conditions as unknown as ConditionEntry[]) ?? [];
  return describeWeaponEffect(
    attack.weapon_effect_triggered,
    applied.map((c) => c.conditionId),
  );
}

/** O que chegou a cada alvo de um uso de Habilidade: as Condições, o TR ou "resistiu". */
function abilityTargetsText(use: CombatAbilityUse): string {
  const targets = abilityUseTargets(use.targets);
  const attribute = use.save_attribute as SaveAttribute | null;
  if (use.status === 'pending' && use.cd !== null && attribute) {
    return `aguardando o TR de ${saveAttributeLabel(attribute)} (CD ${use.cd}) · ${targets.map((t) => t.name).join(', ')}`;
  }
  if (use.status === 'expired') return 'expirou sem efeito (o combate acabou antes do TR)';
  return targets
    .map((t) => {
      if (t.removedIds !== undefined) {
        return t.removedIds.length > 0
          ? `${t.name}: tirou ${t.removedIds.map((id) => CONDITIONS[id]?.name ?? id).join(' e ')}`
          : `${t.name}: não tinha o que tirar`;
      }
      const outcome =
        t.conditionIds.length > 0
          ? t.conditionIds.map((id) => CONDITIONS[id]?.name ?? id).join(' e ')
          : t.failed === false
            ? 'passou'
            : t.faithLost !== undefined
              ? 'falhou'
              : 'resistiu';
      const faith = t.failed && t.faithLost !== undefined ? ` · perdeu ${t.faithLost} de Fé` : '';
      const roll =
        t.failed !== undefined && use.cd !== null
          ? `d20 ${t.natural} (${t.total} contra CD ${use.cd}) · `
          : '';
      return `${t.name}: ${roll}${outcome}${faith}`;
    })
    .concat(reminderOf(use, targets) ?? [])
    .join(' · ');
}

/** O lembrete da Habilidade de inimigo (o que o app não aplica) para quem falhou no TR. */
function reminderOf(use: CombatAbilityUse, targets: AbilityUseTarget[]): string | null {
  if (use.status !== 'resolved') return null;
  return describeReminder(
    enemyEffectOfUse(use),
    targets.filter((t) => t.failed).map((t) => t.name),
  );
}

type LogEntry =
  | { kind: 'attack'; at: string; attack: CombatAttack }
  | { kind: 'ability'; at: string; use: CombatAbilityUse };

/**
 * Os últimos ataques e usos de Habilidade do combate, do mais novo para o mais antigo, com os
 * números que o jogador não vê (d20, total e CA).
 */
export function AttackLog({
  attacks,
  abilityUses = [],
}: {
  attacks: CombatAttack[];
  abilityUses?: CombatAbilityUse[];
}) {
  const entries: LogEntry[] = [
    ...attacks.map((attack) => ({ kind: 'attack' as const, at: attack.created_at, attack })),
    ...abilityUses.map((use) => ({ kind: 'ability' as const, at: use.created_at, use })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  if (entries.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
        {abilityUses.length > 0 ? 'Últimos ataques e Habilidades' : 'Últimos ataques'}
      </h3>
      <ul className="space-y-1">
        {entries.map((entry) =>
          entry.kind === 'ability' ? (
            <li
              key={entry.use.id}
              className="rounded border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-300"
            >
              <span className="font-medium text-stone-100">
                {entry.use.user_name} usou {entry.use.ability_name}
              </span>
              {' · '}
              {abilityTargetsText(entry.use)}
            </li>
          ) : (
            <AttackRow key={entry.attack.id} attack={entry.attack} />
          ),
        )}
      </ul>
    </section>
  );
}

function AttackRow({ attack }: { attack: CombatAttack }) {
  return (
    <li className="rounded border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-300">
      <span className="font-medium text-stone-100">
        {attack.attacker_name} → {attack.target_name}
      </span>
      {': '}d20 {attack.rolls ? attack.rolls.join(' e ') : attack.natural_roll} ({attack.total}{' '}
      contra CA {attack.target_ac}) ·{' '}
      <span className={attack.hit ? 'text-green-400' : 'text-red-400'}>{outcomeOf(attack)}</span>
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
  );
}
