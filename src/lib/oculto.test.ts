// O que o jogador e o espectador não veem do que é Oculto: o histórico e o feed do combate.
// Termos: CONTEXT.md (Oculto).
import { describe, expect, it } from 'vitest';
import { withoutHiddenLog } from './oculto';

const participants = [
  { id: 'p-c1', entity_id: 'c1' },
  { id: 'p-e1', entity_id: 'e1' },
  { id: 'p-e2', entity_id: 'e2' },
];
const attack = (id: string, attacker: string, target: string) =>
  ({ id, attacker_participant_id: attacker, target_participant_id: target }) as never;
const ability = (id: string, user: string, targets: string[]) =>
  ({
    id,
    user_participant_id: user,
    targets: targets.map((participantId) => ({ participantId })),
  }) as never;

const run = (hidden: string[], attacks: never[], abilityUses: never[]) =>
  withoutHiddenLog({ attacks, abilityUses, participants, hiddenEntityIds: new Set(hidden) });

describe('withoutHiddenLog', () => {
  it('sem ninguém Oculto, devolve tudo como está', () => {
    const attacks = [attack('a1', 'p-c1', 'p-e1')];
    const abilityUses = [ability('u1', 'p-c1', ['p-e1'])];
    expect(run([], attacks, abilityUses)).toEqual({ attacks, abilityUses });
  });

  it('tira o ataque feito por quem está Oculto', () => {
    const out = run(['e1'], [attack('a1', 'p-e1', 'p-c1'), attack('a2', 'p-c1', 'p-e2')], []);
    expect(out.attacks.map((a) => a.id)).toEqual(['a2']);
  });

  it('tira o ataque contra quem está Oculto', () => {
    const out = run(['e1'], [attack('a1', 'p-c1', 'p-e1'), attack('a2', 'p-c1', 'p-e2')], []);
    expect(out.attacks.map((a) => a.id)).toEqual(['a2']);
  });

  it('tira o uso de Habilidade de quem está Oculto ou sobre quem está Oculto', () => {
    const out = run(
      ['e1'],
      [],
      [
        ability('u1', 'p-e1', ['p-c1']),
        ability('u2', 'p-c1', ['p-e1', 'p-e2']),
        ability('u3', 'p-c1', ['p-e2']),
      ],
    );
    expect(out.abilityUses.map((u) => u.id)).toEqual(['u3']);
  });

  it('aceita alvos em formato inesperado sem quebrar', () => {
    const odd = { id: 'u9', user_participant_id: 'p-c1', targets: null } as never;
    expect(run(['e1'], [], [odd]).abilityUses).toHaveLength(1);
  });
});
