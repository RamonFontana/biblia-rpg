// Fixa a biblioteca de Habilidades de inimigo do bestiário (Onda 5, feature 4; ADR 0003 e 0007).
import { describe, expect, it } from 'vitest';
import { CONDITIONS } from './conditions';
import { ENEMY_ABILITIES, findEnemyAbility } from './enemyAbilities';
import { enemyAbilityEffectSchema, enemyAbilitySchema } from './schemas';

describe('esquema do efeito de Habilidade de inimigo', () => {
  const base = { save: { attribute: 'sab', cd: 13 }, usage: 'unlimited' };

  it('aceita o TR com atributo e CD, a Condição com duração e a perda de Fé', () => {
    expect(
      enemyAbilityEffectSchema.safeParse({
        ...base,
        apply: [{ conditionId: 'amedrontado', rounds: 10 }],
        faithLoss: { sides: 4 },
      }).success,
    ).toBe(true);
  });

  it('o TR é opcional: sem ele a Condição entra em todos os alvos', () => {
    expect(
      enemyAbilityEffectSchema.safeParse({
        usage: 'per_combat',
        apply: [{ conditionId: 'caido' }],
      }).success,
    ).toBe(true);
  });

  it('recusa efeito vazio, CD fora de 1 a 40, atributo e uso desconhecidos, dado de Fé inválido', () => {
    const parse = (v: unknown) => enemyAbilityEffectSchema.safeParse(v).success;
    expect(parse({ ...base })).toBe(false);
    expect(
      parse({ ...base, save: { attribute: 'sab', cd: 0 }, apply: [{ conditionId: 'x' }] }),
    ).toBe(false);
    expect(
      parse({ ...base, save: { attribute: 'sab', cd: 41 }, apply: [{ conditionId: 'x' }] }),
    ).toBe(false);
    expect(
      parse({ ...base, save: { attribute: 'sorte', cd: 10 }, apply: [{ conditionId: 'x' }] }),
    ).toBe(false);
    expect(parse({ ...base, usage: 'sempre', apply: [{ conditionId: 'x' }] })).toBe(false);
    expect(parse({ ...base, faithLoss: { sides: 8 } })).toBe(false);
  });

  it('a perda de Fé exige um TR: sem ele ninguém falha e a Fé nunca seria tirada', () => {
    const parse = (v: unknown) => enemyAbilityEffectSchema.safeParse(v).success;
    const semTr = { usage: 'unlimited', faithLoss: { sides: 4 } };
    expect(parse(semTr)).toBe(false);
    expect(parse({ ...semTr, apply: [{ conditionId: 'caido' }] })).toBe(false);
    expect(parse({ ...semTr, save: { attribute: 'sab', cd: 12 } })).toBe(true);
  });

  it('a Habilidade da biblioteca exige id enemy-, nome e descrição', () => {
    const effect = { ...base, apply: [{ conditionId: 'caido' }] };
    expect(
      enemyAbilitySchema.safeParse({ id: 'enemy-x', name: 'X', description: 'd', effect }).success,
    ).toBe(true);
    expect(
      enemyAbilitySchema.safeParse({ id: 'x', name: 'X', description: 'd', effect }).success,
    ).toBe(false);
    expect(
      enemyAbilitySchema.safeParse({ id: 'enemy-x', name: '', description: 'd', effect }).success,
    ).toBe(false);
  });
});

describe('biblioteca de Habilidades de inimigo', () => {
  it('tem as quatro do bestiário, com os ids estáveis', () => {
    expect(ENEMY_ABILITIES.map((a) => a.id)).toEqual([
      'enemy-presenca-aterradora',
      'enemy-grito-atormentador',
      'enemy-maldicao-de-baal',
      'enemy-salto-e-bote',
    ]);
  });

  it('todas passam no esquema e só citam Condições do catálogo', () => {
    for (const ability of ENEMY_ABILITIES) {
      expect(enemyAbilitySchema.safeParse(ability).success).toBe(true);
      for (const { conditionId } of ability.effect.apply ?? []) {
        expect(CONDITIONS[conditionId]).toBeDefined();
      }
    }
  });

  it('Presença Aterradora: TR SAB CD 13, Amedrontado por 10 rodadas', () => {
    expect(findEnemyAbility('enemy-presenca-aterradora')?.effect).toEqual({
      save: { attribute: 'sab', cd: 13 },
      apply: [{ conditionId: 'amedrontado', rounds: 10 }],
      usage: 'unlimited',
    });
  });

  it('Grito Atormentador: TR SAB CD 12, 1d4 de Fé, Recarga, lembra a Desvantagem', () => {
    const effect = findEnemyAbility('enemy-grito-atormentador')?.effect;
    expect(effect).toMatchObject({
      save: { attribute: 'sab', cd: 12 },
      faithLoss: { sides: 4 },
      usage: 'recharge',
    });
    expect(effect?.reminder).toMatch(/Desvantagem/);
  });

  it('Maldição de Baal: TR SAB CD 13, 1d6 de Fé, Recarga', () => {
    expect(findEnemyAbility('enemy-maldicao-de-baal')?.effect).toMatchObject({
      save: { attribute: 'sab', cd: 13 },
      faithLoss: { sides: 6 },
      usage: 'recharge',
    });
  });

  it('Salto e Bote: TR FOR CD 13, Caído', () => {
    expect(findEnemyAbility('enemy-salto-e-bote')?.effect).toEqual({
      save: { attribute: 'for', cd: 13 },
      apply: [{ conditionId: 'caido' }],
      usage: 'unlimited',
    });
  });

  it('um id desconhecido não acha nada', () => {
    expect(findEnemyAbility('enemy-nao-existe')).toBeUndefined();
    expect(findEnemyAbility(undefined)).toBeUndefined();
  });
});
