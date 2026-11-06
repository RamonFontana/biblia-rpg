// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  furiaCd,
  furiaPrompt,
  furiaStateAtHp,
  furiaStateOf,
  hasFuria,
  resolveFuria,
  withFuriaState,
} from './furiaDesumana';

const fury = [{ name: 'Fúria Desumana', description: 'x' }];

describe('Fúria Desumana: a CD', () => {
  it('é 10 e sobe 5 a cada uso no combate', () => {
    expect(furiaCd(0)).toBe(10);
    expect(furiaCd(1)).toBe(15);
    expect(furiaCd(2)).toBe(20);
  });
});

describe('Fúria Desumana: quem tem a passiva', () => {
  it('reconhece pelo nome, sem acento nem caixa', () => {
    expect(hasFuria(fury)).toBe(true);
    expect(hasFuria([{ name: 'furia desumana', description: '' }])).toBe(true);
  });

  it('inimigo sem a Fúria, sem lista ou com lixo não tem', () => {
    expect(hasFuria([{ name: 'Ataque Furtivo', description: '' }])).toBe(false);
    expect(hasFuria(undefined)).toBe(false);
    expect(hasFuria(null)).toBe(false);
    expect(hasFuria('x')).toBe(false);
  });
});

describe('Fúria Desumana: o estado no participante', () => {
  it('lê usos e "já tratado"; sem estado, é zero', () => {
    expect(furiaStateOf({ furia: { uses: 2, handled: true } })).toEqual({ uses: 2, handled: true });
    expect(furiaStateOf(null)).toEqual({ uses: 0, handled: false });
    expect(furiaStateOf({ 'enemy-x': 'used' })).toEqual({ uses: 0, handled: false });
    expect(furiaStateOf({ furia: { uses: -3, handled: 'sim' } })).toEqual({
      uses: 0,
      handled: false,
    });
  });

  it('gravar o estado preserva o estado de uso das Habilidades', () => {
    expect(withFuriaState({ 'enemy-grito': 'recharging' }, { uses: 1, handled: false })).toEqual({
      'enemy-grito': 'recharging',
      furia: { uses: 1, handled: false },
    });
  });
});

describe('Fúria Desumana: quando pede o TR', () => {
  const fresh = { uses: 0, handled: false };

  it('inimigo com a Fúria a 0 PV pede o TR de CON com a CD do uso', () => {
    expect(furiaPrompt({ skills: fury, hp: 0, state: fresh })).toEqual({ cd: 10 });
    expect(furiaPrompt({ skills: fury, hp: 0, state: { uses: 2, handled: false } })).toEqual({
      cd: 20,
    });
  });

  it('com PV acima de 0 não pede', () => {
    expect(furiaPrompt({ skills: fury, hp: 1, state: fresh })).toBeNull();
  });

  it('inimigo sem a Fúria não pede', () => {
    expect(
      furiaPrompt({ skills: [{ name: 'X', description: '' }], hp: 0, state: fresh }),
    ).toBeNull();
  });

  it('não repete o pedido para o mesmo 0 PV', () => {
    expect(furiaPrompt({ skills: fury, hp: 0, state: { uses: 0, handled: true } })).toBeNull();
  });
});

describe('Fúria Desumana: resolver o TR de CON', () => {
  const base = { state: { uses: 0, handled: false }, conModifier: 3 };

  it('passa quando d20 + CON alcança a CD: o inimigo fica com 1 PV e o uso conta', () => {
    const result = resolveFuria({ ...base, natural: 7, mark: null });
    expect(result).toMatchObject({ cd: 10, total: 10, passed: true, hpAfter: 1 });
    expect(result.state).toEqual({ uses: 1, handled: false });
  });

  it('falha abaixo da CD: segue a 0 PV e o pedido não volta', () => {
    const result = resolveFuria({ ...base, natural: 6, mark: null });
    expect(result).toMatchObject({ total: 9, passed: false, hpAfter: 0 });
    expect(result.state).toEqual({ uses: 0, handled: true });
  });

  it('o segundo uso é CD 15 e o terceiro CD 20', () => {
    const second = resolveFuria({
      ...base,
      state: { uses: 1, handled: false },
      natural: 12,
      mark: null,
    });
    expect(second).toMatchObject({ cd: 15, total: 15, passed: true });
    expect(second.state.uses).toBe(2);
    const third = resolveFuria({
      ...base,
      state: { uses: 2, handled: false },
      natural: 16,
      mark: null,
    });
    expect(third).toMatchObject({ cd: 20, total: 19, passed: false });
  });

  it('o TR é um Teste comum: o 20 natural não passa sozinho', () => {
    const result = resolveFuria({ ...base, conModifier: -5, natural: 20, mark: null });
    expect(result).toMatchObject({ total: 15, passed: true });
    expect(
      resolveFuria({
        ...base,
        state: { uses: 2, handled: false },
        conModifier: -5,
        natural: 20,
        mark: null,
      }).passed,
    ).toBe(false);
  });
});

describe('Fúria Desumana: PV de novo zera o "já tratado"', () => {
  it('com PV acima de 0, o 0 PV tratado deixa de contar; o uso fica', () => {
    expect(furiaStateAtHp({ uses: 1, handled: true }, 5)).toEqual({ uses: 1, handled: false });
  });

  it('a 0 PV, ou sem estado tratado, nada muda', () => {
    const handled = { uses: 1, handled: true };
    expect(furiaStateAtHp(handled, 0)).toBe(handled);
    const open = { uses: 1, handled: false };
    expect(furiaStateAtHp(open, 5)).toBe(open);
  });
});
