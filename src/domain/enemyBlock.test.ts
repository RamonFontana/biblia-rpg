// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { describeEnemyAttack, enemyBlockOf } from './enemyBlock';

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
