// CARACTERIZAÇÃO: fixa o comportamento ATUAL dos valores iniciais do personagem.
// Decisões: ROADMAP.md, Onda 2 (bloco B): a CA passa a considerar o teto de DES por armadura.
// Termos: CONTEXT.md (PV, Fé Inicial).
import { describe, expect, it } from 'vitest';
import { calculateInitialStats } from './initialStats';

const stats = (vocation: string, tribe: string, con = 10, des = 10) =>
  calculateInitialStats(vocation, tribe, { con, des });

describe('PV inicial: máximo do dado de vida mais o modificador de CON', () => {
  it('Guerreiro e Caçador usam d10', () => {
    expect(stats('Guerreiro', 'Judá', 14).pv).toBe(10 + 2);
    expect(stats('Caçador', 'Judá', 14).pv).toBe(10 + 2);
  });

  it('Batedor e Sacerdote usam d8', () => {
    expect(stats('Batedor', 'Judá', 14).pv).toBe(8 + 2);
    expect(stats('Sacerdote', 'Judá', 14).pv).toBe(8 + 2);
  });

  it('Vocação desconhecida usa d8 (inclusive Sábio e Nobre)', () => {
    expect(stats('Sábio', 'Judá').pv).toBe(8);
    expect(stats('Nobre', 'Judá').pv).toBe(8);
  });

  it('CON baixa reduz o PV', () => {
    expect(stats('Batedor', 'Judá', 8).pv).toBe(8 - 1);
  });

  it('CON ausente ou 0 conta como 10 (modificador 0)', () => {
    expect(calculateInitialStats('Guerreiro', 'Judá', undefined).pv).toBe(10);
    expect(calculateInitialStats('Guerreiro', 'Judá', { con: 0 }).pv).toBe(10);
  });
});

describe('CA inicial: 10 mais o modificador de DES', () => {
  it('sem armadura', () => {
    expect(stats('Guerreiro', 'Judá', 10, 16).ca).toBe(13);
    expect(stats('Guerreiro', 'Judá', 10, 8).ca).toBe(9);
  });

  it('GAP conhecido: o valor é gravado na criação e nunca recalculado (ver getCombatStats)', () => {
    expect(stats('Guerreiro', 'Judá', 10, 12).ca).toBe(11);
  });
});

describe('Fé Inicial', () => {
  it('50 para todos, 60 para a Tribo de Levi', () => {
    expect(stats('Guerreiro', 'Judá').faith).toBe(50);
    expect(stats('Sacerdote', 'Levi').faith).toBe(60);
  });

  it('o nome da Tribo é comparado exatamente', () => {
    expect(stats('Sacerdote', 'levi').faith).toBe(50);
  });
});

describe('valores mostrados na tela', () => {
  it('devolve o dado base e os modificadores usados na conta', () => {
    expect(stats('Guerreiro', 'Judá', 14, 16)).toMatchObject({ baseHp: 10, conMod: 2, desMod: 3 });
  });
});
