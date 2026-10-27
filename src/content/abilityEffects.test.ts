// Fixa o efeito estruturado das Habilidades que aplicam Condição (Onda 5, feature 4; ADR 0007).
import { describe, expect, it } from 'vitest';
import { ABILITIES } from './abilities';
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
