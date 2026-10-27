// Ataque: o atributo, a Proficiência, o acerto contra a CA, o Acerto Crítico, a Falha Crítica e o
// dano. O d20 e o dano são os dados físicos digitados (ADR 0001). Termos: CONTEXT.md (Ataque,
// Acerto Crítico, Falha Crítica, CA). Regras: docs/regras-base.md, 6.2; docs/itens/armas.md.
import { describe, expect, it } from 'vitest';
import { createSeededRng } from '@/domain/rng';
import {
  ammunitionSlug,
  attackAbility,
  canThrow,
  canUseTwoHands,
  effectiveWeapon,
  computeDamage,
  damageReminder,
  describeAttack,
  isWeaponProficient,
  resolveAttack,
  resolveAttackMode,
  resolveWeaponEffect,
  rollDamage,
  weaponEffectTriggers,
  weaponIsRanged,
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

const axe: AttackWeapon = {
  id: 'machado',
  damage: '1d8 cortante',
  category: 'Marcial',
  properties: ['versatile'],
  description: 'Versátil (1d10)',
};
const spearV: AttackWeapon = { ...spear, description: 'Arremesso (9/36m), Versátil (1d8)' };
const bow: AttackWeapon = {
  id: 'arco_curto',
  damage: '1d6 perfurante',
  category: 'Marcial',
  properties: ['ammunition'],
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

describe('resolveAttackMode: Vantagem e Desvantagem do ataque', () => {
  const mode = (over: Partial<Parameters<typeof resolveAttackMode>[0]>) =>
    resolveAttackMode({
      attackerConditions: [],
      targetConditions: [],
      ranged: false,
      inspirationUsed: false,
      ...over,
    });

  it('sem Condições, o ataque é normal', () => {
    expect(mode({})).toEqual({ mode: 'normal', advantages: [], disadvantages: [] });
  });

  it('atacante Envenenado, Cego ou Impedido ataca com Desvantagem', () => {
    for (const condition of ['envenenado', 'cego', 'impedido']) {
      expect(mode({ attackerConditions: [condition] }).mode).toBe('desvantagem');
    }
  });

  it('alvo Atordoado, Paralisado ou Cego recebe o ataque com Vantagem', () => {
    for (const condition of ['atordoado', 'paralisado', 'cego']) {
      expect(mode({ targetConditions: [condition] }).mode).toBe('vantagem');
    }
  });

  it('alvo Caído: Vantagem no corpo a corpo e Desvantagem à distância', () => {
    expect(mode({ targetConditions: ['caido'] }).mode).toBe('vantagem');
    expect(mode({ targetConditions: ['caido'], ranged: true }).mode).toBe('desvantagem');
  });

  it('as Condições sem efeito no ataque não mudam nada', () => {
    expect(
      mode({
        attackerConditions: ['sangrando', 'caido', 'amedrontado', 'exausto'],
        targetConditions: ['sangrando', 'envenenado', 'agarrado', 'impedido'],
      }).mode,
    ).toBe('normal');
  });

  it('a Inspiração dá Vantagem', () => {
    expect(mode({ inspirationUsed: true })).toMatchObject({
      mode: 'vantagem',
      advantages: ['Inspiração'],
    });
  });

  it('Vantagem e Desvantagem se anulam, e a Inspiração anula uma Desvantagem', () => {
    expect(mode({ attackerConditions: ['cego'], targetConditions: ['atordoado'] }).mode).toBe(
      'normal',
    );
    expect(mode({ attackerConditions: ['envenenado'], inspirationUsed: true }).mode).toBe('normal');
  });

  it('explica de onde vem cada lado', () => {
    const result = mode({ attackerConditions: ['envenenado'], targetConditions: ['paralisado'] });
    expect(result.disadvantages).toEqual(['Você está Envenenado']);
    expect(result.advantages).toEqual(['Alvo Paralisado']);
  });

  it('o Cego atacando um alvo Cego: Vantagem e Desvantagem juntas, normal', () => {
    expect(mode({ attackerConditions: ['cego'], targetConditions: ['cego'] }).mode).toBe('normal');
  });
});

describe('weaponIsRanged', () => {
  it('arma de munição é à distância; as demais, não', () => {
    expect(weaponIsRanged(sling)).toBe(true);
    expect(weaponIsRanged(sword)).toBe(false);
    expect(weaponIsRanged(null)).toBe(false);
  });

  it('a arma de arremesso é à distância só quando arremessada', () => {
    expect(weaponIsRanged(spear, true)).toBe(true);
    expect(weaponIsRanged(spear, false)).toBe(false);
    expect(weaponIsRanged(spear)).toBe(false);
  });

  it('arremessar uma arma que não é de arremesso não a torna à distância', () => {
    expect(weaponIsRanged(sword, true)).toBe(false);
  });
});

describe('canThrow', () => {
  it('só as armas de arremesso (Lança, Adaga, Dardo)', () => {
    expect(canThrow(spear)).toBe(true);
    expect(canThrow(dagger)).toBe(true);
    expect(canThrow(sword)).toBe(false);
    expect(canThrow(sling)).toBe(false);
    expect(canThrow(null)).toBe(false);
  });
});

describe('Versátil', () => {
  it('canUseTwoHands: arma Versátil com a outra mão livre', () => {
    expect(canUseTwoHands(axe, true)).toBe(true);
    expect(canUseTwoHands(axe, false)).toBe(false);
    expect(canUseTwoHands(dagger, true)).toBe(false);
    expect(canUseTwoHands(null, true)).toBe(false);
  });

  it('effectiveWeapon: com duas mãos troca o dado pelo Versátil e mantém o tipo de dano', () => {
    expect(effectiveWeapon(axe, true).damage).toBe('1d10 cortante');
    expect(effectiveWeapon(spearV, true).damage).toBe('1d8 perfurante');
  });

  it('effectiveWeapon: a uma mão, ou sem dado Versátil, fica como está', () => {
    expect(effectiveWeapon(axe, false)).toBe(axe);
    expect(effectiveWeapon(dagger, true)).toBe(dagger);
    const withoutDie = { ...axe, description: 'Versátil' };
    expect(effectiveWeapon(withoutDie, true)).toBe(withoutDie);
  });

  it('o lembrete e a Rolagem Virtual do dano seguem o dado Versátil', () => {
    const twoHanded = effectiveWeapon(axe, true);
    expect(damageReminder(twoHanded, false)).toBe('Role 1d10.');
    expect(damageReminder(twoHanded, true)).toBe('Role 2d10.');
    for (let seed = 1; seed <= 40; seed++) {
      expect(rollDamage(twoHanded, false, createSeededRng(seed))).toBeLessThanOrEqual(10);
    }
    const max = Math.max(
      ...Array.from({ length: 60 }, (_, i) => rollDamage(twoHanded, false, createSeededRng(i + 1))),
    );
    expect(max).toBeGreaterThan(8);
  });
});

describe('ammunitionSlug', () => {
  it('a funda gasta Pedra para Funda e os arcos gastam Flecha', () => {
    expect(ammunitionSlug(sling)).toBe('pedras_funda');
    expect(ammunitionSlug(bow)).toBe('flechas');
    expect(ammunitionSlug({ ...bow, id: 'arco_longo' })).toBe('flechas');
  });

  it('armas sem munição não gastam nada', () => {
    expect(ammunitionSlug(sword)).toBeNull();
    expect(ammunitionSlug(spear)).toBeNull();
    expect(ammunitionSlug(null)).toBeNull();
  });
});

describe('rollDamage: a Rolagem Virtual do dano', () => {
  it('rola o dado da arma, dobrado no crítico, pela Rng injetada', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const normal = rollDamage(sword, false, createSeededRng(seed));
      expect(normal).toBeGreaterThanOrEqual(1);
      expect(normal).toBeLessThanOrEqual(8);
      const critical = rollDamage(sword, true, createSeededRng(seed));
      expect(critical).toBeGreaterThanOrEqual(2);
      expect(critical).toBeLessThanOrEqual(16);
    }
  });

  it('é repetível com a mesma semente', () => {
    expect(rollDamage(sword, true, createSeededRng(9))).toBe(
      rollDamage(sword, true, createSeededRng(9)),
    );
  });

  it('desarmado não rola', () => {
    expect(rollDamage(null, false, createSeededRng(1))).toBe(0);
  });
});

describe('weaponEffectTriggers: o gatilho do efeito de arma', () => {
  const effects = [{ conditionId: 'sangrando', trigger: 'natural_18_plus' as const }];

  it('dispara no acerto com 18 natural ou mais', () => {
    expect(weaponEffectTriggers(18, true, effects)).toBe(true);
    expect(weaponEffectTriggers(19, true, effects)).toBe(true);
    expect(weaponEffectTriggers(20, true, effects)).toBe(true);
  });

  it('abaixo de 18 não dispara', () => {
    expect(weaponEffectTriggers(17, true, effects)).toBe(false);
  });

  it('só no acerto', () => {
    expect(weaponEffectTriggers(18, false, effects)).toBe(false);
  });

  it('sem efeito configurado na arma, nunca dispara', () => {
    expect(weaponEffectTriggers(20, true, [])).toBe(false);
    expect(weaponEffectTriggers(20, true, undefined)).toBe(false);
  });
});

describe('resolveWeaponEffect: a Condição que chega ao alvo', () => {
  const effects = [
    { conditionId: 'sangrando', trigger: 'natural_18_plus' as const },
    { conditionId: 'atordoado', trigger: 'natural_18_plus' as const },
  ];

  it('sem resistência, aplica todas as Condições da arma por 3 rodadas', () => {
    expect(resolveWeaponEffect(effects, {})).toEqual({
      conditions: [
        { conditionId: 'sangrando', duration: 3 },
        { conditionId: 'atordoado', duration: 3 },
      ],
      messages: [],
    });
  });

  it('a Resistência Nv4 anula a Condição e avisa', () => {
    const result = resolveWeaponEffect(effects, { sangrando: 4 });
    expect(result.conditions).toEqual([{ conditionId: 'atordoado', duration: 3 }]);
    expect(result.messages).toEqual(['Resistência Nv4: imune a Sangrando']);
  });

  it('a Resistência Nv2 reduz a duração pela metade, para cima', () => {
    expect(resolveWeaponEffect(effects, { atordoado: 2 }).conditions).toEqual([
      { conditionId: 'sangrando', duration: 3 },
      { conditionId: 'atordoado', duration: 2 },
    ]);
  });

  it('o nível de uma Condição não afeta as outras', () => {
    expect(resolveWeaponEffect(effects, { outra: 4 }).conditions).toHaveLength(2);
  });
});
