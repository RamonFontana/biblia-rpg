// O bloco de consulta de um inimigo criado a partir de um Preset (ADR 0012): ataques e detalhes
// que o Mestre vê no cartão. Vem do jsonb da ficha (`narrative.enemy`); inimigo do zero ou antigo
// não tem e devolve `null`. Termos: CONTEXT.md (Inimigo, Preset).
import { enemyAttackSchema } from '@/content/schemas';
import type { EnemyAttack } from '@/content/schemas';

export interface EnemyBlockDetails {
  speed?: string;
  proficiencies?: string;
  senses?: string;
  challenge?: string;
}

export interface EnemyBlock {
  attacks: EnemyAttack[];
  details: EnemyBlockDetails;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;

export function enemyBlockOf(character: { narrative?: unknown }): EnemyBlock | null {
  const raw = isRecord(character.narrative) ? character.narrative.enemy : undefined;
  if (!isRecord(raw)) return null;

  const attacks = Array.isArray(raw.attacks)
    ? raw.attacks.flatMap((attack) => {
        const parsed = enemyAttackSchema.safeParse(attack);
        return parsed.success ? [parsed.data] : [];
      })
    : [];
  const rawDetails = isRecord(raw.details) ? raw.details : {};
  const details: EnemyBlockDetails = {
    speed: text(rawDetails.speed),
    proficiencies: text(rawDetails.proficiencies),
    senses: text(rawDetails.senses),
    challenge: text(rawDetails.challenge),
  };

  const hasDetails = Object.values(details).some((value) => value !== undefined);
  return attacks.length > 0 || hasDetails ? { attacks, details } : null;
}

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

/** O ataque em uma linha: "+5 · 1,5m · 1d8+3 perfurante". */
export function describeEnemyAttack(attack: EnemyAttack): string {
  const { dice, bonus } = attack.damage;
  const amount = dice ? `${dice}${bonus === 0 ? '' : signed(bonus)}` : String(bonus);
  const parts = [
    `${signed(attack.hitBonus)} para acertar`,
    attack.reach,
    `${amount} ${attack.damageType}`,
  ];
  if (attack.extra) parts.push(attack.extra);
  return parts.join(' · ');
}
