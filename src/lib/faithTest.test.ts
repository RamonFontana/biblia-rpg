// CARACTERIZAÇÃO: fixa o comportamento ATUAL do Teste de Fé, inclusive o que está errado.
// Decisões: ROADMAP.md, Onda 2 (bloco B) e CONTEXT.md (Teste de Fé, Fé Efetiva, Modificador de Fé).
import { describe, expect, it } from 'vitest';
import { isFaithTestApprovedByService, isFaithTestFailedOnPlayerScreen } from './faithTest';

describe('Teste de Fé: regra comum às duas fórmulas (sem Item Profano)', () => {
  // [Fé Atual, Modificador de Fé, resultado do 1d100, passa?]
  const cases: [number, number, number, boolean][] = [
    [50, 0, 50, true], // igual à Fé passa
    [50, 0, 51, false],
    [50, 0, 1, true],
    [50, 20, 70, true], // Misericórdia soma à Fé
    [50, 20, 71, false],
    [50, -20, 30, true], // Punição subtrai da Fé
    [50, -20, 31, false],
    [0, 0, 0, true], // Ruptura: só o 0 passa
    [0, 0, 1, false],
  ];

  it.each(cases)('Fé %i, modificador %i, rolou %i => passa: %s', (faith, mod, rolled, passes) => {
    expect(isFaithTestApprovedByService(rolled, mod, { current_faith: faith })).toBe(passes);
    expect(isFaithTestFailedOnPlayerScreen(rolled, mod, { current_faith: faith }, 0)).toBe(!passes);
  });

  it('usa current_faith quando existe e cai para faith (Fé Inicial) quando não existe', () => {
    expect(isFaithTestApprovedByService(40, 0, { current_faith: 40, faith: 60 })).toBe(true);
    expect(isFaithTestApprovedByService(41, 0, { current_faith: 40, faith: 60 })).toBe(false);
    expect(isFaithTestApprovedByService(60, 0, { faith: 60 })).toBe(true);
    expect(isFaithTestApprovedByService(61, 0, { faith: 60 })).toBe(false);
  });

  it('current_faith igual a 0 vale 0 (não cai para faith)', () => {
    expect(isFaithTestApprovedByService(1, 0, { current_faith: 0, faith: 50 })).toBe(false);
  });

  it('sem nenhuma Fé gravada, a tela do jogador trata como Fé 0', () => {
    expect(isFaithTestFailedOnPlayerScreen(1, 0, undefined, 0)).toBe(true);
    expect(isFaithTestFailedOnPlayerScreen(0, 0, undefined, 0)).toBe(false);
  });
});

describe('Teste de Fé: BUG conhecido — a tela e o serviço divergem com Item Profano', () => {
  // Cenário: Fé 50, Amuleto Proibido (-10), sem modificador, o jogador rolou 45.
  // Decisão (grill): a penalidade vale, então a Fé Efetiva é 40 e o teste FALHA.
  const stats = { current_faith: 50 };

  it('a tela soma a penalidade e mostra "Reprovado"', () => {
    expect(isFaithTestFailedOnPlayerScreen(45, 0, stats, -10)).toBe(true);
  });

  it('o serviço ignora a penalidade e grava "aprovado" (sem perder Fé)', () => {
    expect(isFaithTestApprovedByService(45, 0, stats)).toBe(true);
  });

  it('só divergem quando a rolagem cai entre a Fé Efetiva e a Fé Atual', () => {
    // Fé Efetiva 40, Fé Atual 50: de 41 a 50 a tela reprova e o serviço aprova.
    for (let rolled = 1; rolled <= 100; rolled++) {
      const screenFails = isFaithTestFailedOnPlayerScreen(rolled, 0, stats, -10);
      const serviceFails = !isFaithTestApprovedByService(rolled, 0, stats);
      expect(screenFails !== serviceFails).toBe(rolled >= 41 && rolled <= 50);
    }
  });
});
