// A Habilidade de inimigo contra personagens (Onda 5, feature 4; ADR 0007).
import { describe, expect, it } from 'vitest';
import {
  describeEnemyEffect,
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
    const effect = {
      save: { attribute: 'des', cd: 11 },
      apply: [{ conditionId: 'agarrado' }],
      usage: 'per_combat',
    } as const;
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
  const effect = {
    save: { attribute: 'sab', cd: 13 },
    apply: [{ conditionId: 'amedrontado', rounds: 10 }],
    usage: 'unlimited',
  } as const;
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
    const noSave = { apply: [{ conditionId: 'caido' }], usage: 'unlimited' } as const;
    const [out] = resolveEnemyAbilityResults(noSave, [
      submitted({ status: 'pending', isApproved: null }),
    ]);
    expect(out.conditions).toEqual([{ conditionId: 'caido', duration: null }]);
  });

  it('um efeito só de perda de Fé não aplica Condição', () => {
    const faithOnly = {
      save: { attribute: 'sab', cd: 12 },
      faithLoss: { sides: 4 },
      usage: 'recharge',
    } as const;
    const [out] = resolveEnemyAbilityResults(faithOnly, [submitted({})]);
    expect(out).toMatchObject({ failed: true, conditions: [] });
  });
});
