// Fixa o efeito estruturado das Habilidades que aplicam Condição (Onda 5, feature 4; ADR 0007).
import { describe, expect, it } from 'vitest';
import { ABILITIES } from './abilities';
import { ENDEMONIADO_ABILITIES } from './enemyTemplate';
import { abilitySchema } from './schemas';

const byId = (id: string) => ABILITIES.find((a) => a.id === id);

describe('efeito de Habilidade: esquema', () => {
  const base = ABILITIES[0];

  it('aceita alvo e Condições com duração em rodadas', () => {
    const effect = { targets: 'enemy', apply: [{ conditionId: 'paralisado', rounds: 1 }] };
    expect(abilitySchema.safeParse({ ...base, combatEffect: effect }).success).toBe(true);
  });

  it('a Condição pode ficar sem duração (até ser removida)', () => {
    const effect = { targets: 'aggressor', apply: [{ conditionId: 'amedrontado' }] };
    expect(abilitySchema.safeParse({ ...base, combatEffect: effect }).success).toBe(true);
  });

  it('recusa alvo desconhecido, efeito sem Condição e duração inválida', () => {
    const parse = (combatEffect: unknown) => abilitySchema.safeParse({ ...base, combatEffect });
    expect(parse({ targets: 'todos', apply: [{ conditionId: 'cego' }] }).success).toBe(false);
    expect(parse({ targets: 'enemy', apply: [] }).success).toBe(false);
    expect(parse({ targets: 'enemy', apply: [{ conditionId: 'cego', rounds: 0 }] }).success).toBe(
      false,
    );
  });
});

describe('efeito de Habilidade: as três primeiras', () => {
  it('Palavra de Autoridade paralisa um inimigo por 1 rodada', () => {
    expect(byId('tribe-levi-16-palavra-de-auto')?.combatEffect).toEqual({
      targets: 'enemy',
      apply: [{ conditionId: 'paralisado', rounds: 1 }],
    });
  });

  it('Golpe Sísmico derruba os inimigos, sem TR', () => {
    expect(byId('tribe-gade-16-golpe-sismico')?.combatEffect).toEqual({
      targets: 'enemies',
      apply: [{ conditionId: 'caido' }],
    });
  });

  it('Retribuição Divina amedronta o agressor até ser removido, e é Reação', () => {
    const ability = byId('vocation-sacerdote-14-retribuicao-div');
    expect(ability?.actionType).toBe('reaction');
    expect(ability?.combatEffect).toEqual({
      targets: 'aggressor',
      apply: [{ conditionId: 'amedrontado' }],
    });
  });

  it('o texto da Habilidade continua', () => {
    expect(byId('tribe-levi-16-palavra-de-auto')?.effect).toMatch(/Paralisa/);
  });
});

describe('efeito de Habilidade: TR', () => {
  const base = ABILITIES[0];

  it('o esquema aceita o TR com o atributo e recusa atributo desconhecido', () => {
    const parse = (save: unknown) =>
      abilitySchema.safeParse({
        ...base,
        combatEffect: { targets: 'enemies', save, apply: [{ conditionId: 'cego' }] },
      });
    expect(parse({ attribute: 'sab' }).success).toBe(true);
    expect(parse({ attribute: 'sorte' }).success).toBe(false);
    expect(parse({}).success).toBe(false);
  });

  it('Tática do Cântaro Quebrado: TR SAB dos inimigos, Amedrontado por 10 rodadas', () => {
    expect(byId('tribe-manasses-12-tatica-do-canta')?.combatEffect).toEqual({
      targets: 'enemies',
      save: { attribute: 'sab' },
      apply: [{ conditionId: 'amedrontado', rounds: 10 }],
    });
  });

  it('Grito de Guerra: TR SAB dos inimigos, Amedrontado por 10 rodadas; a cura fica no texto', () => {
    const ability = byId('vocation-guerreiro-18-grito-de-guerra');
    expect(ability?.combatEffect).toEqual({
      targets: 'enemies',
      save: { attribute: 'sab' },
      apply: [{ conditionId: 'amedrontado', rounds: 10 }],
    });
    expect(ability?.effect).toMatch(/2d6 PV/);
  });

  it('Golpe Incapacitante: TR CON de um inimigo, Atordoado por 1 rodada, e aparece no combate', () => {
    const ability = byId('vocation-batedor-14-golpe-incapacit');
    expect(ability?.combatEffect).toEqual({
      targets: 'enemy',
      save: { attribute: 'con' },
      apply: [{ conditionId: 'atordoado', rounds: 1 }],
    });
    // Passiva não se usa; é um adendo ao Ataque Furtivo, sem espaço de turno (Ação Livre).
    expect(ability?.actionType).toBe('free_action');
  });
});

describe('efeito de Habilidade que remove Condição: esquema', () => {
  const base = ABILITIES[0];
  const parse = (combatEffect: unknown) => abilitySchema.safeParse({ ...base, combatEffect });

  it('aceita remoção fixa, escolhida de uma lista e uma por alvo, sem aplicar nada', () => {
    expect(
      parse({ targets: 'ally', remove: { mode: 'fixed', conditionIds: ['envenenado'] } }).success,
    ).toBe(true);
    expect(
      parse({
        targets: 'ally',
        remove: { mode: 'choice', conditionIds: ['amedrontado', 'atordoado'] },
      }).success,
    ).toBe(true);
    expect(parse({ targets: 'allies', remove: { mode: 'per_target' } }).success).toBe(true);
  });

  it('exige a lista de Condições na remoção fixa e na escolhida', () => {
    expect(parse({ targets: 'ally', remove: { mode: 'fixed' } }).success).toBe(false);
    expect(parse({ targets: 'ally', remove: { mode: 'choice', conditionIds: [] } }).success).toBe(
      false,
    );
  });

  it('recusa modo desconhecido e efeito sem Condição aplicada nem removida', () => {
    expect(parse({ targets: 'ally', remove: { mode: 'todas' } }).success).toBe(false);
    expect(parse({ targets: 'ally' }).success).toBe(false);
  });

  it('a remoção fixa tem uma Condição só; a escolhida precisa de ao menos duas', () => {
    expect(
      parse({
        targets: 'ally',
        remove: { mode: 'fixed', conditionIds: ['envenenado', 'cego'] },
      }).success,
    ).toBe(false);
    expect(
      parse({ targets: 'ally', remove: { mode: 'choice', conditionIds: ['cego'] } }).success,
    ).toBe(false);
  });
});

describe('Habilidades que removem Condição', () => {
  it('Purificação: um aliado escolhe Amedrontado, Atordoado ou Envenenado', () => {
    const ability = byId('vocation-sacerdote-6-purificacao');
    expect(ability?.combatEffect).toEqual({
      targets: 'ally',
      remove: { mode: 'choice', conditionIds: ['amedrontado', 'atordoado', 'envenenado'] },
    });
    expect(ability?.effect).toMatch(/Possessão/);
  });

  it('O Unificador: cada aliado perde uma Condição, a que o jogador escolher', () => {
    expect(byId('tribe-manasses-20-o-unificador')?.combatEffect).toEqual({
      targets: 'allies',
      remove: { mode: 'per_target' },
    });
  });

  it('Ungido tira Envenenado e Cataplasma de Gileade tira Sangrando; a cura fica no texto', () => {
    const ungido = byId('tribe-aser-12-ungido');
    expect(ungido?.combatEffect).toEqual({
      targets: 'ally',
      remove: { mode: 'fixed', conditionIds: ['envenenado'] },
    });
    expect(ungido?.effect).toMatch(/3d8/);
    const cataplasma = byId('tribe-simeao-4-cataplasma-de-g');
    expect(cataplasma?.combatEffect).toEqual({
      targets: 'ally',
      remove: { mode: 'fixed', conditionIds: ['sangrando'] },
    });
    expect(cataplasma?.effect).toMatch(/Cura/);
  });
});

describe('efeito de Habilidade: lembrete de quem falha (Repreensão Divina)', () => {
  const base = ABILITIES[0];
  const parse = (combatEffect: unknown) => abilitySchema.safeParse({ ...base, combatEffect });

  it('aceita um efeito só com TR e lembrete, sem Condição', () => {
    expect(
      parse({ targets: 'enemy', save: { attribute: 'car' }, reminder: 'foge por 1 min' }).success,
    ).toBe(true);
  });

  it('o lembrete só vale com TR', () => {
    expect(parse({ targets: 'enemy', reminder: 'foge por 1 min' }).success).toBe(false);
  });

  it('o efeito precisa aplicar, tirar Condição ou lembrar', () => {
    expect(parse({ targets: 'enemy', save: { attribute: 'car' } }).success).toBe(false);
  });

  it('Repreensão Divina pede o TR de Carisma de um inimigo e lembra a fuga', () => {
    expect(byId('vocation-sacerdote-2-repreensao-divi')?.combatEffect).toEqual({
      targets: 'enemy',
      save: { attribute: 'car' },
      requiresTargetSkill: 'Vulnerabilidade Espiritual',
      reminder: 'foge do combate por 1 min (10 rodadas)',
    });
  });
});

describe('efeito de Habilidade: passiva exigida do alvo', () => {
  it('a passiva que a Repreensão Divina exige existe no Template Endemoniado', () => {
    const required = byId('vocation-sacerdote-2-repreensao-divi')?.combatEffect
      ?.requiresTargetSkill;
    expect(ENDEMONIADO_ABILITIES.map((a) => a.name)).toContain(required);
  });
});
