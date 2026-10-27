// O efeito de combate de uma Habilidade (Onda 5, feature 4; ADR 0007): quem pode ser alvo, quando
// o uso é permitido e as Condições que chegam ao alvo depois da Resistência a Condição e das
// imunidades de Habilidade passiva. Termos: CONTEXT.md (Habilidade, Resistência a Condição).
import { describe, expect, it } from 'vitest';
import {
  abilityImmunities,
  getAbilityEffectBlock,
  isSingleTarget,
  resolveAbilityEffect,
  effectTargetPool,
  type AbilityUseContext,
} from './abilityEffect';

const effect = (targets: Parameters<typeof isSingleTarget>[0]['targets']) => ({
  targets,
  apply: [{ conditionId: 'paralisado', rounds: 1 }],
});

describe('alvos possíveis', () => {
  const participants = [
    { participantId: 'p1', entityType: 'player' },
    { participantId: 'n1', entityType: 'npc' },
    { participantId: 'e1', entityType: 'enemy' },
    { participantId: 'e2', entityType: 'enemy' },
  ];

  it('"inimigo" e "inimigos" são os inimigos do combate', () => {
    expect(effectTargetPool(effect('enemy'), participants).map((p) => p.participantId)).toEqual([
      'e1',
      'e2',
    ]);
    expect(effectTargetPool(effect('enemies'), participants)).toHaveLength(2);
  });

  it('"aliado" e "aliados" são jogadores e NPCs, nunca inimigos', () => {
    expect(effectTargetPool(effect('allies'), participants).map((p) => p.participantId)).toEqual([
      'p1',
      'n1',
    ]);
    expect(effectTargetPool(effect('ally'), participants)).toHaveLength(2);
  });

  it('o agressor pode ser qualquer participante', () => {
    expect(effectTargetPool(effect('aggressor'), participants)).toHaveLength(4);
  });

  it('um alvo só para inimigo, aliado e agressor; vários para inimigos e aliados', () => {
    expect(isSingleTarget(effect('enemy'))).toBe(true);
    expect(isSingleTarget(effect('ally'))).toBe(true);
    expect(isSingleTarget(effect('aggressor'))).toBe(true);
    expect(isSingleTarget(effect('enemies'))).toBe(false);
    expect(isSingleTarget(effect('allies'))).toBe(false);
  });
});

describe('uso permitido', () => {
  const ok: AbilityUseContext = {
    actionType: 'action',
    hasActiveCombat: true,
    dying: false,
    isMyTurn: true,
    actionUsed: false,
    bonusActionUsed: false,
    reactionUsed: false,
  };
  const block = (patch: Partial<AbilityUseContext>) => getAbilityEffectBlock({ ...ok, ...patch });

  it('libera com combate ativo, no turno e com o espaço livre', () => {
    expect(block({})).toBeNull();
  });

  it('exige combate ativo', () => {
    expect(block({ hasActiveCombat: false })).toBe('Só em combate');
  });

  it('quem está a 0 PV não usa Habilidade', () => {
    expect(block({ dying: true })).toBe('Quem está a 0 PV não usa Habilidades');
  });

  it('Ação só no próprio turno e uma vez', () => {
    expect(block({ isMyTurn: false })).toBe('Não é o seu turno');
    expect(block({ actionUsed: true })).toBe('Ação já usada neste turno');
  });

  it('Ação Bônus só no próprio turno e uma vez; a Ação usada não atrapalha', () => {
    expect(block({ actionType: 'bonus_action', isMyTurn: false })).toBe('Não é o seu turno');
    expect(block({ actionType: 'bonus_action', bonusActionUsed: true })).toBe(
      'Ação Bônus já usada neste turno',
    );
    expect(block({ actionType: 'bonus_action', actionUsed: true })).toBeNull();
  });

  it('Reação vale a qualquer momento, uma vez por turno', () => {
    expect(block({ actionType: 'reaction', isMyTurn: false })).toBeNull();
    expect(block({ actionType: 'reaction', reactionUsed: true })).toBe(
      'Reação já usada neste turno',
    );
  });

  it('Ação Livre não ocupa espaço', () => {
    expect(
      block({ actionType: 'free_action', isMyTurn: false, actionUsed: true, reactionUsed: true }),
    ).toBeNull();
  });

  it('Habilidade passiva não se usa', () => {
    expect(block({ actionType: 'passive' })).toBe('Habilidade passiva');
  });
});

describe('imunidades de Habilidade passiva', () => {
  it('cada uma das quatro bloqueia a sua Condição', () => {
    expect(abilityImmunities(['tribe-aser-4-calcado-de-ferr'])).toEqual(['caido']);
    expect(abilityImmunities(['tribe-naftali-20-rapidez-divina'])).toEqual(['paralisado']);
    expect(abilityImmunities(['tribe-simeao-12-sangue-amargo'])).toEqual(['envenenado']);
    expect(abilityImmunities(['vocation-sacerdote-18-servo-consagrad'])).toEqual(['amedrontado']);
  });

  it('ignora Habilidades sem imunidade', () => {
    expect(abilityImmunities(['tribe-levi-16-palavra-de-auto', 'x'])).toEqual([]);
  });

  it('junta as de várias Habilidades', () => {
    expect(
      abilityImmunities(['tribe-aser-4-calcado-de-ferr', 'tribe-simeao-12-sangue-amargo']),
    ).toEqual(['caido', 'envenenado']);
  });
});

describe('Condições que chegam ao alvo', () => {
  const none = { resistanceLevels: {}, immuneConditionIds: [] };

  it('sem proteção, a Condição entra com a duração em rodadas', () => {
    expect(resolveAbilityEffect(effect('enemy'), none)).toEqual({
      conditions: [{ conditionId: 'paralisado', duration: 1 }],
      messages: [],
    });
  });

  it('sem duração no conteúdo, a Condição fica até ser removida', () => {
    const open = { targets: 'enemies' as const, apply: [{ conditionId: 'caido' }] };
    expect(resolveAbilityEffect(open, none).conditions).toEqual([
      { conditionId: 'caido', duration: null },
    ]);
  });

  it('a Resistência Nv2 reduz a duração pela metade, para cima', () => {
    const long = { targets: 'enemy' as const, apply: [{ conditionId: 'amedrontado', rounds: 5 }] };
    const out = resolveAbilityEffect(long, {
      resistanceLevels: { amedrontado: 2 },
      immuneConditionIds: [],
    });
    expect(out.conditions).toEqual([{ conditionId: 'amedrontado', duration: 3 }]);
    expect(out.messages).toHaveLength(1);
  });

  it('a Resistência Nv4 anula a Condição e avisa', () => {
    const out = resolveAbilityEffect(effect('enemy'), {
      resistanceLevels: { paralisado: 4 },
      immuneConditionIds: [],
    });
    expect(out.conditions).toEqual([]);
    expect(out.messages).toEqual(['Resistência Nv4: imune a Paralisado']);
  });

  it('a imunidade de Habilidade passiva anula a Condição e avisa', () => {
    const out = resolveAbilityEffect(effect('enemy'), {
      resistanceLevels: {},
      immuneConditionIds: ['paralisado'],
    });
    expect(out.conditions).toEqual([]);
    expect(out.messages).toEqual(['Imunidade: imune a Paralisado']);
  });

  it('a imunidade vale só para a sua Condição', () => {
    const two = {
      targets: 'enemy' as const,
      apply: [{ conditionId: 'paralisado', rounds: 1 }, { conditionId: 'cego' }],
    };
    const out = resolveAbilityEffect(two, {
      resistanceLevels: {},
      immuneConditionIds: ['paralisado'],
    });
    expect(out.conditions).toEqual([{ conditionId: 'cego', duration: null }]);
  });
});
