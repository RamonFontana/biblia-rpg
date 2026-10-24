// CARACTERIZAÇÃO: o uso das Habilidades na ficha. A tela é testada em
// components/character/CharacterSheetView.test.tsx; aqui, as regras sem React.
import { describe, expect, it } from 'vitest';
import {
  applyAbilityUse,
  getAbilityAvailability,
  getUsedCount,
  restoreAbilityUses,
} from './abilityUse';

const limited = { id: 'a', maxUses: 2 };
const costly = { id: 'b', faithCost: 5 };
const both = { id: 'c', maxUses: 1, faithCost: 3 };
const free = { id: 'd' };

describe('getUsedCount', () => {
  it('lê os usos gastos, ou 0 sem registro', () => {
    expect(getUsedCount({ ability_uses: { a: 2 } }, 'a')).toBe(2);
    expect(getUsedCount({ ability_uses: { a: 2 } }, 'z')).toBe(0);
    expect(getUsedCount({}, 'a')).toBe(0);
    expect(getUsedCount(undefined, 'a')).toBe(0);
  });
});

describe('getAbilityAvailability', () => {
  it('sem limite nem custo: sempre liberada e sem contagem', () => {
    expect(getAbilityAvailability(free, {}, {})).toStrictEqual({
      remainingUses: undefined,
      disabled: false,
      reason: '',
    });
  });

  it('com limite: mostra o que resta e desliga ao esgotar', () => {
    expect(getAbilityAvailability(limited, { ability_uses: { a: 1 } }, {})).toMatchObject({
      remainingUses: 1,
      disabled: false,
    });
    expect(getAbilityAvailability(limited, { ability_uses: { a: 2 } }, {})).toStrictEqual({
      remainingUses: 0,
      disabled: true,
      reason: 'Sem Usos',
    });
  });

  it('usos gastos além do limite não deixam o restante negativo', () => {
    expect(getAbilityAvailability(limited, { ability_uses: { a: 5 } }, {}).remainingUses).toBe(0);
  });

  it('com custo: desliga quando a Fé Atual não cobre, e libera com a Fé justa', () => {
    expect(getAbilityAvailability(costly, {}, { current_faith: 4 })).toMatchObject({
      disabled: true,
      reason: 'Fé Insuficiente',
    });
    expect(getAbilityAvailability(costly, {}, { current_faith: 5 })).toMatchObject({
      disabled: false,
    });
  });

  it('a Fé Inicial vale quando não há Fé Atual', () => {
    expect(getAbilityAvailability(costly, {}, { faith: 50 }).disabled).toBe(false);
    expect(getAbilityAvailability(costly, {}, undefined).disabled).toBe(true);
  });

  it('Fé insuficiente vem antes de Sem Usos', () => {
    expect(
      getAbilityAvailability(both, { ability_uses: { c: 1 } }, { current_faith: 0 }).reason,
    ).toBe('Fé Insuficiente');
    expect(
      getAbilityAvailability(both, { ability_uses: { c: 1 } }, { current_faith: 9 }).reason,
    ).toBe('Sem Usos');
  });
});

describe('applyAbilityUse', () => {
  it('soma um uso e mantém o resto das skills', () => {
    const result = applyAbilityUse(
      limited,
      { ability_uses: { a: 1, x: 3 }, path_choices: 'A' } as never,
      {},
    );
    expect(result).toStrictEqual({
      skills: { ability_uses: { a: 2, x: 3 }, path_choices: 'A' },
    });
  });

  it('sem registro de usos, começa em 1', () => {
    expect(applyAbilityUse(free, undefined, undefined)).toStrictEqual({
      skills: { ability_uses: { d: 1 } },
    });
  });

  it('com custo, gasta a Fé Atual e devolve os stats novos', () => {
    expect(applyAbilityUse(costly, {}, { pv: 9, current_faith: 8 } as never)).toStrictEqual({
      skills: { ability_uses: { b: 1 } },
      stats: { pv: 9, current_faith: 3 },
    });
  });

  it('o custo gasta a Fé Inicial quando não há Fé Atual', () => {
    expect(applyAbilityUse(costly, {}, { faith: 50 })).toMatchObject({
      stats: { faith: 50, current_faith: 45 },
    });
  });

  // Decisão do autor (ROADMAP, passo 9d, Q16): o gasto respeita o teto da Fé (0 a 100).
  it('uma Fé gravada acima do teto volta ao teto ao gastar o custo', () => {
    expect(applyAbilityUse(costly, {}, { current_faith: 120 })).toMatchObject({
      stats: { current_faith: 100 },
    });
  });

  it('sem Fé para o custo, devolve null (nada é gasto)', () => {
    expect(applyAbilityUse(costly, {}, { current_faith: 4 })).toBeNull();
    expect(applyAbilityUse(costly, {}, undefined)).toBeNull();
  });

  it('não altera o objeto de entrada', () => {
    const skills = { ability_uses: { a: 1 } };
    applyAbilityUse(limited, skills, {});
    expect(skills).toStrictEqual({ ability_uses: { a: 1 } });
  });
});

describe('restoreAbilityUses', () => {
  it('apaga só a Habilidade pedida', () => {
    expect(
      restoreAbilityUses({ ability_uses: { a: 2, b: 1 }, path_choices: 'A' } as never, 'a'),
    ).toStrictEqual({ ability_uses: { b: 1 }, path_choices: 'A' });
  });

  it('sem registro, devolve um registro vazio', () => {
    expect(restoreAbilityUses(undefined, 'a')).toStrictEqual({ ability_uses: {} });
  });

  it('não altera o objeto de entrada', () => {
    const skills = { ability_uses: { a: 2 } };
    restoreAbilityUses(skills, 'a');
    expect(skills).toStrictEqual({ ability_uses: { a: 2 } });
  });
});
