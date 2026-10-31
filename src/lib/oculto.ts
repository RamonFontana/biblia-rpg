// O Oculto (CONTEXT.md): o Mestre tira um Retrato da vista dos jogadores. Os Retratos e o mapa já o
// filtram (`buildRetratos`); aqui, o histórico e o feed do combate, que citam os participantes.
// Nada disso é segredo no servidor (ADR 0011).
import type { CombatAbilityUse, CombatAttack } from '@/data-access/combat';

interface LogInput {
  attacks: CombatAttack[];
  abilityUses: CombatAbilityUse[];
  /** Os participantes do combate, para ligar o id do participante ao do Retrato. */
  participants: { id: string; entity_id: string }[];
  hiddenEntityIds: ReadonlySet<string>;
}

/** Tira do histórico os ataques e usos de Habilidade de quem está Oculto, ou contra ele. */
export function withoutHiddenLog({
  attacks,
  abilityUses,
  participants,
  hiddenEntityIds,
}: LogInput) {
  if (hiddenEntityIds.size === 0) return { attacks, abilityUses };
  const hiddenParticipants = new Set(
    participants.filter((p) => hiddenEntityIds.has(p.entity_id)).map((p) => p.id),
  );
  const targetsHidden = (targets: unknown) =>
    Array.isArray(targets) &&
    targets.some((t) =>
      hiddenParticipants.has((t as { participantId?: string })?.participantId ?? ''),
    );

  return {
    attacks: attacks.filter(
      (a) =>
        !hiddenParticipants.has(a.attacker_participant_id) &&
        !hiddenParticipants.has(a.target_participant_id),
    ),
    abilityUses: abilityUses.filter(
      (u) => !hiddenParticipants.has(u.user_participant_id) && !targetsHidden(u.targets),
    ),
  };
}
