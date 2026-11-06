// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  describeEnemyAttack,
  enemyConditionImmunities,
  enemySaveBonuses,
  enemyBlockOf,
} from './enemyBlock';

const claw = {
  name: 'Garra',
  mode: 'melee',
  attribute: 'for',
  hitBonus: 5,
  reach: '1,5m',
  damage: { dice: '1d6', bonus: 3 },
  damageType: 'cortante',
};

describe('enemyBlockOf', () => {
  it('lê ataques e detalhes da narrativa da ficha', () => {
    const block = enemyBlockOf({
      narrative: {
        imageUrl: '',
        enemy: { presetId: 'x', attacks: [claw], details: { speed: '15 m', senses: ' ' } },
      },
    });
    expect(block?.attacks).toHaveLength(1);
    expect(block?.details).toEqual({
      speed: '15 m',
      proficiencies: undefined,
      senses: undefined,
      challenge: undefined,
    });
  });

  it('inimigo do zero ou antigo não tem bloco', () => {
    expect(enemyBlockOf({ narrative: { imageUrl: '' } })).toBeNull();
    expect(enemyBlockOf({ narrative: null })).toBeNull();
    expect(enemyBlockOf({})).toBeNull();
    expect(enemyBlockOf({ narrative: { enemy: { presetId: 'x' } } })).toBeNull();
  });

  it('ignora o ataque malformado em vez de quebrar', () => {
    const block = enemyBlockOf({
      narrative: { enemy: { attacks: [{ name: 'Lixo' }, claw] } },
    });
    expect(block?.attacks.map((a) => a.name)).toEqual(['Garra']);
  });
});

describe('describeEnemyAttack', () => {
  it('mostra acerto, alcance e dano', () => {
    expect(describeEnemyAttack({ ...claw, mode: 'melee', attribute: 'for' })).toBe(
      '+5 para acertar · 1,5m · 1d6+3 cortante',
    );
  });

  it('dano fixo e texto extra', () => {
    expect(
      describeEnemyAttack({
        ...claw,
        mode: 'melee',
        attribute: 'des',
        damage: { bonus: 1 },
        damageType: 'perfurante',
        extra: 'Veneno.',
      }),
    ).toBe('+5 para acertar · 1,5m · 1 perfurante · Veneno.');
  });
});

describe('regras do bloco que valem no motor (stats da ficha)', () => {
  it('lê as imunidades a Condição', () => {
    expect(enemyConditionImmunities({ conditionImmunities: ['amedrontado'] })).toEqual([
      'amedrontado',
    ]);
  });

  it('inimigo antigo, sem o campo ou com lixo, não tem imunidade', () => {
    expect(enemyConditionImmunities({ pv: 10 })).toEqual([]);
    expect(enemyConditionImmunities(null)).toEqual([]);
    expect(enemyConditionImmunities({ conditionImmunities: 'amedrontado' })).toEqual([]);
    expect(enemyConditionImmunities({ conditionImmunities: ['caido', 3] })).toEqual(['caido']);
  });

  it('lê os bônus de TR por atributo', () => {
    expect(enemySaveBonuses({ saveBonuses: { for: 7, con: 5 } })).toEqual({ for: 7, con: 5 });
  });

  it('sem bônus, ou com valores inválidos, devolve só o que vale', () => {
    expect(enemySaveBonuses({ pv: 10 })).toEqual({});
    expect(enemySaveBonuses(undefined)).toEqual({});
    expect(enemySaveBonuses({ saveBonuses: { for: '7', xyz: 3, sab: 2 } })).toEqual({ sab: 2 });
  });
});
