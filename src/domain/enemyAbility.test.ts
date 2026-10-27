// A Habilidade de inimigo contra personagens (Onda 5, feature 4; ADR 0007).
import { describe, expect, it } from 'vitest';
import type { EnemyAbilityEffect } from '@/content/schemas';
import { createSeededRng } from './rng';
import {
  abilityStateOf,
  enemyEffectOfUse,
  abilityStateKey,
  checkFaithDie,
  describeEnemyEffect,
  enemyAbilityStatus,
  faithLostBy,
  rechargeSucceeds,
  rollEnemyFaithDie,
  rollRecharge,
  stateAfterUse,
  enemyAbilityOf,
  enemyEffectAsAbilityEffect,
  resolveEnemyAbilityResults,
  type EnemySaveResult,
} from './enemyAbility';

const NO_PROTECTION = { resistanceLevels: {}, immuneConditionIds: [] };

describe('enemyAbilityOf: a Habilidade que o app aplica', () => {
  it('uma Habilidade só com nome e descrição é texto: não tem efeito', () => {
    expect(enemyAbilityOf({ name: 'Comando', description: 'Aliados ganham bônus' })).toBeNull();
  });

  it('a referência à biblioteca traz o efeito do bestiário', () => {
    const ability = enemyAbilityOf({
      name: 'Presença Aterradora',
      description: '',
      libraryId: 'enemy-presenca-aterradora',
    });
    expect(ability).toMatchObject({
      id: 'enemy-presenca-aterradora',
      name: 'Presença Aterradora',
      effect: { save: { attribute: 'sab', cd: 13 } },
    });
  });

  it('uma referência desconhecida cai no texto', () => {
    expect(
      enemyAbilityOf({ name: 'X', description: '', libraryId: 'enemy-nao-existe' }),
    ).toBeNull();
  });

  it('o efeito personalizado vale e usa o id enemy-custom', () => {
    const effect: EnemyAbilityEffect = {
      save: { attribute: 'des', cd: 11 },
      apply: [{ conditionId: 'agarrado' }],
      usage: 'per_combat',
    };
    expect(enemyAbilityOf({ name: 'Laço', description: 'd', effect })).toMatchObject({
      id: 'enemy-custom',
      name: 'Laço',
      effect,
    });
  });

  it('a biblioteca vence um efeito personalizado ao lado', () => {
    const ability = enemyAbilityOf({
      name: 'Salto',
      description: '',
      libraryId: 'enemy-salto-e-bote',
      effect: { apply: [{ conditionId: 'cego' }], usage: 'unlimited' },
    });
    expect(ability?.id).toBe('enemy-salto-e-bote');
  });
});

describe('enemyEffectAsAbilityEffect', () => {
  it('vira o efeito de Habilidade sobre aliados, sem a CD (que fica no uso)', () => {
    expect(
      enemyEffectAsAbilityEffect({
        save: { attribute: 'sab', cd: 13 },
        apply: [{ conditionId: 'amedrontado', rounds: 10 }],
        usage: 'unlimited',
      }),
    ).toEqual({
      targets: 'allies',
      save: { attribute: 'sab' },
      apply: [{ conditionId: 'amedrontado', rounds: 10 }],
    });
  });
});

describe('describeEnemyEffect', () => {
  it('diz o TR, a Condição com a duração e a perda de Fé', () => {
    expect(
      describeEnemyEffect({
        save: { attribute: 'sab', cd: 12 },
        apply: [{ conditionId: 'amedrontado', rounds: 10 }],
        faithLoss: { sides: 4 },
        usage: 'recharge',
      }),
    ).toBe('TR de Sabedoria CD 12 · Amedrontado (10 rodadas) · perde 1d4 de Fé · Recarga 5-6');
  });

  it('sem TR nem duração, a Condição fica até ser removida', () => {
    expect(describeEnemyEffect({ apply: [{ conditionId: 'caido' }], usage: 'per_combat' })).toBe(
      'Caído (até ser removida) · 1 por combate',
    );
  });
});

describe('resolveEnemyAbilityResults: quem falhou no TR', () => {
  const effect: EnemyAbilityEffect = {
    save: { attribute: 'sab', cd: 13 },
    apply: [{ conditionId: 'amedrontado', rounds: 10 }],
    usage: 'unlimited',
  };
  const submitted = (over: Partial<EnemySaveResult>): EnemySaveResult => ({
    participantId: 'p1',
    name: 'Eliabe',
    status: 'submitted',
    isApproved: false,
    rollValue: 7,
    resultValue: 9,
    appliedMode: 'normal',
    protection: NO_PROTECTION,
    ...over,
  });

  it('quem falhou no TR recebe a Condição com a duração', () => {
    const [out] = resolveEnemyAbilityResults(effect, [submitted({})]);
    expect(out).toMatchObject({
      participantId: 'p1',
      failed: true,
      natural: 7,
      total: 9,
      mode: 'normal',
      conditions: [{ conditionId: 'amedrontado', duration: 10 }],
    });
  });

  it('quem passou no TR não recebe nada', () => {
    const [out] = resolveEnemyAbilityResults(effect, [
      submitted({ isApproved: true, resultValue: 14 }),
    ]);
    expect(out).toMatchObject({ failed: false, conditions: [], total: 14 });
  });

  it('quem não respondeu fica sem efeito, e a ausência é marcada', () => {
    const [out] = resolveEnemyAbilityResults(effect, [
      submitted({ status: 'pending', isApproved: null, rollValue: null, resultValue: null }),
    ]);
    expect(out).toMatchObject({ failed: false, conditions: [], answered: false, natural: null });
  });

  it('só a resposta enviada conta: dados e reprovação de um resultado pendente são ignorados', () => {
    const [out] = resolveEnemyAbilityResults(effect, [
      submitted({ status: 'pending', isApproved: false, rollValue: 7, resultValue: 9 }),
    ]);
    expect(out).toMatchObject({ answered: false, failed: false, natural: null, total: null });
    expect(out.conditions).toEqual([]);
  });

  it('um resultado enviado sem aprovação gravada não é falha', () => {
    const [out] = resolveEnemyAbilityResults(effect, [submitted({ isApproved: null })]);
    expect(out).toMatchObject({ failed: false, conditions: [] });
  });

  it('a imunidade e a Resistência a Condição valem para quem falhou', () => {
    const [immune, resisted] = resolveEnemyAbilityResults(effect, [
      submitted({ protection: { resistanceLevels: {}, immuneConditionIds: ['amedrontado'] } }),
      submitted({
        participantId: 'p2',
        protection: { resistanceLevels: { amedrontado: 5 }, immuneConditionIds: [] },
      }),
    ]);
    expect(immune.failed).toBe(true);
    expect(immune.conditions).toEqual([]);
    expect(immune.messages[0]).toMatch(/Imunidade/);
    expect(resisted.failed).toBe(true);
    expect(resisted.conditions.length + resisted.messages.length).toBeGreaterThan(0);
  });

  it('sem TR na Habilidade, a Condição entra em todos', () => {
    const noSave: EnemyAbilityEffect = { apply: [{ conditionId: 'caido' }], usage: 'unlimited' };
    const [out] = resolveEnemyAbilityResults(noSave, [
      submitted({ status: 'pending', isApproved: null }),
    ]);
    expect(out.conditions).toEqual([{ conditionId: 'caido', duration: null }]);
  });

  it('um efeito só de perda de Fé não aplica Condição', () => {
    const faithOnly: EnemyAbilityEffect = {
      save: { attribute: 'sab', cd: 12 },
      faithLoss: { sides: 4 },
      usage: 'recharge',
    };
    const [out] = resolveEnemyAbilityResults(faithOnly, [submitted({})]);
    expect(out).toMatchObject({ failed: true, conditions: [] });
  });
});

const LIBRARY = enemyAbilityOf({
  name: 'Grito Atormentador',
  description: '',
  libraryId: 'enemy-grito-atormentador',
})!;

describe('abilityStateKey: a chave do estado de uso no participante', () => {
  it('a Habilidade da biblioteca usa o id dela', () => {
    expect(abilityStateKey(LIBRARY)).toBe('enemy-grito-atormentador');
  });

  it('a personalizada usa o nome, para duas não colidirem', () => {
    const effect: EnemyAbilityEffect = { apply: [{ conditionId: 'caido' }], usage: 'per_combat' };
    const a = enemyAbilityOf({ name: 'Rugido', effect })!;
    const b = enemyAbilityOf({ name: 'Pisão', effect })!;
    expect(abilityStateKey(a)).toBe('enemy-custom:Rugido');
    expect(abilityStateKey(a)).not.toBe(abilityStateKey(b));
  });
});

describe('stateAfterUse: o que o uso deixa no participante', () => {
  it('sem limite não deixa nada', () => {
    expect(stateAfterUse('unlimited')).toBeNull();
  });

  it('1 por combate fica usada', () => {
    expect(stateAfterUse('per_combat')).toBe('used');
  });

  it('Recarga fica em recarga', () => {
    expect(stateAfterUse('recharge')).toBe('recharging');
  });
});

describe('enemyAbilityStatus: se a Habilidade pode ser usada agora', () => {
  const key = 'enemy-grito-atormentador';

  it('sem estado gravado está pronta', () => {
    expect(enemyAbilityStatus(key, {})).toEqual({ ready: true, reason: '' });
    expect(enemyAbilityStatus(key, null)).toEqual({ ready: true, reason: '' });
  });

  it('usada neste combate está bloqueada', () => {
    expect(enemyAbilityStatus(key, { [key]: 'used' })).toEqual({
      ready: false,
      reason: 'Já usada neste combate',
    });
  });

  it('em recarga está bloqueada até o d6 voltar', () => {
    expect(enemyAbilityStatus(key, { [key]: 'recharging' })).toEqual({
      ready: false,
      reason: 'Em Recarga (5-6)',
    });
  });

  it('o estado de outra Habilidade não conta', () => {
    expect(enemyAbilityStatus(key, { outra: 'used' }).ready).toBe(true);
  });
});

describe('Recarga: o d6 no início do turno do inimigo', () => {
  it('4 não recarrega; 5 e 6 recarregam', () => {
    expect(rechargeSucceeds(4)).toBe(false);
    expect(rechargeSucceeds(5)).toBe(true);
    expect(rechargeSucceeds(6)).toBe(true);
  });

  it('rollRecharge é um d6 da Rng injetada', () => {
    const rolls = Array.from({ length: 200 }, (_, i) => rollRecharge(createSeededRng(i)));
    expect(Math.min(...rolls)).toBe(1);
    expect(Math.max(...rolls)).toBe(6);
  });

  it('com a mesma semente a rolagem se repete', () => {
    expect(rollRecharge(createSeededRng(7))).toBe(rollRecharge(createSeededRng(7)));
  });
});

describe('Fé perdida pela Habilidade de inimigo', () => {
  it('rollEnemyFaithDie respeita as faces do efeito', () => {
    const d4 = Array.from({ length: 200 }, (_, i) => rollEnemyFaithDie(4, createSeededRng(i)));
    const d6 = Array.from({ length: 200 }, (_, i) => rollEnemyFaithDie(6, createSeededRng(i)));
    expect(Math.max(...d4)).toBe(4);
    expect(Math.min(...d4)).toBe(1);
    expect(Math.max(...d6)).toBe(6);
  });

  it('o dado digitado vale de 1 até as faces; fora disso é erro', () => {
    expect(checkFaithDie(0, 4)).toBe('range');
    expect(checkFaithDie(1, 4)).toBeNull();
    expect(checkFaithDie(4, 4)).toBeNull();
    expect(checkFaithDie(5, 4)).toBe('range');
    expect(checkFaithDie(6, 6)).toBeNull();
    expect(checkFaithDie(7, 6)).toBe('range');
    expect(checkFaithDie(2.5, 4)).toBe('range');
    expect(checkFaithDie('', 4)).toBe('empty');
  });

  it('a Fé perdida não passa do que o personagem tem', () => {
    expect(faithLostBy({ current_faith: 10 }, 3)).toBe(3);
    expect(faithLostBy({ current_faith: 2 }, 5)).toBe(2);
    expect(faithLostBy({ current_faith: 0 }, 4)).toBe(0);
  });

  it('sem current_faith, perde da Fé Inicial', () => {
    expect(faithLostBy({ faith: 50 }, 4)).toBe(4);
  });
});

describe('resolveEnemyAbilityResults: a Fé de quem falhou', () => {
  const effect: EnemyAbilityEffect = {
    save: { attribute: 'sab', cd: 12 },
    faithLoss: { sides: 4 },
    usage: 'recharge',
  };
  const result = (over: Partial<EnemySaveResult>): EnemySaveResult => ({
    participantId: 'p1',
    name: 'Eliabe',
    status: 'submitted',
    isApproved: false,
    rollValue: 5,
    resultValue: 6,
    appliedMode: 'normal',
    protection: NO_PROTECTION,
    ...over,
  });

  it('só quem respondeu e falhou perde Fé: a Habilidade sem Condição devolve só o falhou', () => {
    const [failed, passed, silent] = resolveEnemyAbilityResults(effect, [
      result({}),
      result({ participantId: 'p2', isApproved: true }),
      result({ participantId: 'p3', status: 'pending', isApproved: null }),
    ]);
    expect(failed.failed).toBe(true);
    expect(passed.failed).toBe(false);
    expect(silent.failed).toBe(false);
    expect(silent.answered).toBe(false);
  });
});

describe('abilityStateOf: o estado de uso lido do participante', () => {
  it('lê só os estados conhecidos', () => {
    expect(abilityStateOf({ a: 'used', b: 'recharging', c: 'outro', d: 3, e: null })).toEqual({
      a: 'used',
      b: 'recharging',
    });
  });

  it('o que não é objeto não tem estado', () => {
    expect(abilityStateOf(null)).toEqual({});
    expect(abilityStateOf([1])).toEqual({});
    expect(abilityStateOf('used')).toEqual({});
  });
});

describe('enemyEffectOfUse: o efeito de um uso gravado', () => {
  it('prefere o efeito gravado no uso (Habilidade personalizada)', () => {
    const stored: EnemyAbilityEffect = { apply: [{ conditionId: 'cego' }], usage: 'per_combat' };
    expect(enemyEffectOfUse({ ability_id: 'enemy-custom', enemy_effect: stored })).toEqual(stored);
  });

  it('sem efeito gravado, usa o da biblioteca', () => {
    expect(
      enemyEffectOfUse({ ability_id: 'enemy-salto-e-bote', enemy_effect: null })?.save,
    ).toEqual({ attribute: 'for', cd: 13 });
  });

  it('um efeito gravado inválido cai na biblioteca; sem nenhum dos dois, é nulo', () => {
    expect(
      enemyEffectOfUse({ ability_id: 'enemy-salto-e-bote', enemy_effect: { lixo: 1 } })?.usage,
    ).toBe('unlimited');
    expect(enemyEffectOfUse({ ability_id: 'enemy-custom', enemy_effect: null })).toBeNull();
  });
});
