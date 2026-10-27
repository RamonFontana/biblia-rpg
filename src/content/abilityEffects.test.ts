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
