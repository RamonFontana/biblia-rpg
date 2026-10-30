// Os eventos do feed do Palco: os 3 mais novos do combate, entre ataques e usos de Habilidade.
import type { CombatAbilityUse, CombatAttack } from '@/data-access/combat';

const FEED_SIZE = 3;

export interface FeedEvent {
  id: string;
  text: string;
}

function attackText(attack: CombatAttack): string {
  if (!attack.hit) return `${attack.attacker_name} errou ${attack.target_name}`;
  return `${attack.attacker_name} acertou ${attack.target_name}: ${attack.damage} de dano`;
}

/** Os eventos mais novos primeiro, no máximo 3. */
export function feedEvents(attacks: CombatAttack[], abilityUses: CombatAbilityUse[]): FeedEvent[] {
  return [
    ...attacks.map((a) => ({ id: a.id, at: a.created_at, text: attackText(a) })),
    ...abilityUses.map((u) => ({
      id: u.id,
      at: u.created_at,
      text: `${u.user_name} usou ${u.ability_name}`,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, FEED_SIZE)
    .map(({ id, text }) => ({ id, text }));
}
