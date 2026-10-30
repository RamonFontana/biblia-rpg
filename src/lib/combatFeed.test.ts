// Os eventos do feed do Palco: os 3 mais novos, entre ataques e Habilidades.
import { describe, expect, it } from 'vitest';

import type { CombatAbilityUse, CombatAttack } from '@/data-access/combat';
import { feedEvents } from './combatFeed';

const attack = (id: string, at: string, over: Partial<CombatAttack> = {}): CombatAttack =>
  ({
    id,
    created_at: at,
    attacker_name: 'Guarda',
    target_name: 'Eliabe',
    hit: true,
    critical: false,
    fumble: false,
    damage: 5,
    ...over,
  }) as CombatAttack;

const use = (id: string, at: string, over: Partial<CombatAbilityUse> = {}): CombatAbilityUse =>
  ({
    id,
    created_at: at,
    user_name: 'Eliabe',
    ability_name: 'Golpe Sísmico',
    ...over,
  }) as CombatAbilityUse;

describe('feedEvents', () => {
  it('traz os 3 mais novos, do mais novo para o mais antigo, entre ataques e Habilidades', () => {
    const events = feedEvents(
      [attack('a1', '2026-01-01T10:00:01Z'), attack('a2', '2026-01-01T10:00:03Z')],
      [use('u1', '2026-01-01T10:00:02Z'), use('u2', '2026-01-01T10:00:00Z')],
    );
    expect(events.map((e) => e.id)).toEqual(['a2', 'u1', 'a1']);
  });

  it('descreve ataque que acertou, que errou e uso de Habilidade', () => {
    const [hit, miss, ability] = feedEvents(
      [
        attack('a1', '2026-01-01T10:00:03Z'),
        attack('a2', '2026-01-01T10:00:02Z', { hit: false, damage: 0 }),
      ],
      [use('u1', '2026-01-01T10:00:01Z')],
    );
    expect(hit.text).toBe('Guarda acertou Eliabe: 5 de dano');
    expect(miss.text).toBe('Guarda errou Eliabe');
    expect(ability.text).toBe('Eliabe usou Golpe Sísmico');
  });
});
