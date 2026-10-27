// Ataque: o atributo, a Proficiência, o acerto contra a CA, o Acerto Crítico, a Falha Crítica e o
// dano. O d20 e o dano são os dados físicos digitados (ADR 0001). Termos: CONTEXT.md (Ataque,
// Acerto Crítico, Falha Crítica, CA). Regras: docs/regras-base.md, 6.2; docs/itens/armas.md.
import { describe, expect, it } from 'vitest';
import {
  attackAbility,
  computeDamage,
  damageReminder,
  describeAttack,
  isWeaponProficient,
  resolveAttack,
  type AttackInput,
  type AttackWeapon,
} from '@/domain/attack';

const sword: AttackWeapon = {
  id: 'espada_longa',
  damage: '1d8 cortante',
  category: 'Marcial',
  properties: ['versatile'],
};
const dagger: AttackWeapon = {
  id: 'adaga',
  damage: '1d4 perfurante',
  category: 'Simples',
  properties: ['finesse', 'thrown'],
};
const sling: AttackWeapon = {
  id: 'funda',
  damage: '1d4 concussão',
  category: 'Simples',
  properties: ['ammunition'],
};
const spear: AttackWeapon = {
  id: 'lanca',
  damage: '1d6 perfurante',
  category: 'Simples',
  properties: ['thrown', 'versatile'],
};

const base: AttackInput = {
  attributes: { for: 16, des: 12 }, // FOR +3, DES +1
  level: 1, // Proficiência +2
  vocation: 'Guerreiro',
  weapon: sword,
  naturalRoll: 10,
  targetAc: 15,
};
const attack = (over: Partial<AttackInput>) => resolveAttack({ ...base, ...over });

describe('attackAbility: qual atributo entra', () => {
  it('corpo a corpo usa FOR', () => {
    expect(attackAbility(sword, { for: 10, des: 18 })).toBe('for');
  });

  it('arma de munição usa DES', () => {
    expect(attackAbility(sling, { for: 18, des: 10 })).toBe('des');
  });

  it('Acuidade usa o maior entre FOR e DES, e FOR no empate', () => {
    expect(attackAbility(dagger, { for: 10, des: 16 })).toBe('des');
    expect(attackAbility(dagger, { for: 16, des: 10 })).toBe('for');
    expect(attackAbility(dagger, { for: 12, des: 12 })).toBe('for');
  });

  it('arremesso sem Acuidade usa FOR', () => {
    expect(attackAbility(spear, { for: 10, des: 18 })).toBe('for');
  });

  it('desarmado usa FOR', () => {
    expect(attackAbility(null, { for: 10, des: 18 })).toBe('for');
  });
});

describe('isWeaponProficient', () => {
  it('Guerreiro e Caçador usam armas simples e marciais', () => {
    for (const vocation of ['Guerreiro', 'Caçador/Nômade']) {
      expect(isWeaponProficient(vocation, 'Simples')).toBe(true);
      expect(isWeaponProficient(vocation, 'Marcial')).toBe(true);
    }
  });

  it('Sacerdote (e Sábio, que é o mesmo ofício) só usa armas simples', () => {
    for (const vocation of ['Sacerdote', 'Sábio', 'Sabio']) {
      expect(isWeaponProficient(vocation, 'Simples')).toBe(true);
      expect(isWeaponProficient(vocation, 'Marcial')).toBe(false);
    }
  });

  it('a ficha antiga que diz Levita também não usa arma marcial', () => {
    expect(isWeaponProficient('Levita', 'Marcial')).toBe(false);
  });

  it('a arma sem categoria conta como simples', () => {
    expect(isWeaponProficient('Sacerdote', undefined)).toBe(true);
  });
});

describe('resolveAttack: o total', () => {
  it('soma o d20, o modificador do atributo e a Proficiência', () => {
    expect(attack({})).toMatchObject({
      ability: 'for',
      modifier: 3,
      proficiencyBonus: 2,
      proficient: true,
      total: 15,
    });
  });

  it('sem proficiência com a arma, a Proficiência não entra', () => {
    expect(attack({ vocation: 'Sacerdote' })).toMatchObject({
      proficient: false,
      proficiencyBonus: 0,
      total: 13,
    });
  });

  it('a Proficiência cresce com o nível', () => {
    expect(attack({ level: 5 })).toMatchObject({ proficiencyBonus: 3, total: 16 });
  });

  it('desarmado soma FOR e Proficiência', () => {
    expect(attack({ weapon: null })).toMatchObject({ ability: 'for', total: 15, proficient: true });
  });

  it('usa o atributo da arma (DES com munição)', () => {
    expect(attack({ weapon: sling })).toMatchObject({ ability: 'des', modifier: 1, total: 13 });
  });
});

describe('resolveAttack: acerto, crítico e falha', () => {
  it('acerta quando o total iguala a CA', () => {
    expect(attack({ naturalRoll: 10, targetAc: 15 }).hit).toBe(true);
  });

  it('erra quando o total fica um abaixo da CA', () => {
    expect(attack({ naturalRoll: 10, targetAc: 16 }).hit).toBe(false);
  });

  it('acerta quando o total supera a CA', () => {
    expect(attack({ naturalRoll: 15, targetAc: 15 }).hit).toBe(true);
  });

  it('20 natural acerta sempre, como Acerto Crítico, mesmo contra CA impossível', () => {
    expect(attack({ naturalRoll: 20, targetAc: 40 })).toMatchObject({
      hit: true,
      critical: true,
      fumble: false,
    });
  });

  it('19 natural não é crítico: contra CA impossível erra', () => {
    expect(attack({ naturalRoll: 19, targetAc: 40 })).toMatchObject({
      hit: false,
      critical: false,
    });
  });

  it('2 natural não é Falha Crítica', () => {
    expect(attack({ naturalRoll: 2, targetAc: 5 })).toMatchObject({ hit: true, fumble: false });
  });

  it('1 natural erra sempre, como Falha Crítica, mesmo contra CA 0', () => {
    expect(attack({ naturalRoll: 1, targetAc: 0 })).toMatchObject({
      hit: false,
      critical: false,
      fumble: true,
    });
  });

  it('um acerto comum não é crítico nem falha', () => {
    expect(attack({ naturalRoll: 12, targetAc: 5 })).toMatchObject({
      hit: true,
      critical: false,
      fumble: false,
    });
  });
});

describe('damageReminder: o dado a rolar', () => {
  it('lembra o dado da arma, dobrado no crítico', () => {
    expect(damageReminder(sword, false)).toBe('Role 1d8.');
    expect(damageReminder(sword, true)).toBe('Role 2d8.');
    expect(damageReminder({ ...sword, damage: '2d6 cortante' }, true)).toBe('Role 4d6.');
  });

  it('desarmado não rola dado', () => {
    expect(damageReminder(null, false)).toBeNull();
    expect(damageReminder(null, true)).toBeNull();
  });
});

describe('computeDamage', () => {
  it('soma o modificador uma vez ao dado digitado', () => {
    expect(computeDamage({ weapon: sword, modifier: 3, rolled: 6 })).toBe(9);
  });

  it('o crítico soma o modificador só uma vez (os dados é que dobram)', () => {
    expect(computeDamage({ weapon: sword, modifier: 3, rolled: 11 })).toBe(14);
  });

  it('desarmado causa 1 mais o modificador, sem dado', () => {
    expect(computeDamage({ weapon: null, modifier: 3, rolled: 0 })).toBe(4);
  });

  it('nunca é negativo', () => {
    expect(computeDamage({ weapon: sword, modifier: -4, rolled: 1 })).toBe(0);
    expect(computeDamage({ weapon: null, modifier: -3, rolled: 0 })).toBe(0);
  });
});

describe('describeAttack: o aviso do ataque', () => {
  const who = { attackerName: 'Eliabe', targetName: 'Filisteu' };

  it('acerto comum com o dano', () => {
    expect(describeAttack({ ...who, hit: true, critical: false, fumble: false, damage: 7 })).toBe(
      'Eliabe acertou Filisteu: 7 de dano.',
    );
  });

  it('Acerto Crítico', () => {
    expect(describeAttack({ ...who, hit: true, critical: true, fumble: false, damage: 14 })).toBe(
      'Eliabe acertou Filisteu (crítico): 14 de dano.',
    );
  });

  it('erro comum', () => {
    expect(describeAttack({ ...who, hit: false, critical: false, fumble: false, damage: 0 })).toBe(
      'Eliabe errou Filisteu.',
    );
  });

  it('Falha Crítica', () => {
    expect(describeAttack({ ...who, hit: false, critical: false, fumble: true, damage: 0 })).toBe(
      'Eliabe errou Filisteu (falha crítica).',
    );
  });
});
