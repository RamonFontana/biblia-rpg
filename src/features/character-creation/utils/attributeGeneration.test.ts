// CARACTERIZAÇÃO: fixa o comportamento ATUAL da geração de atributos.
// Decisão: ADR 0001 (dados físicos); a rolagem no app é uma conveniência opcional.
import { describe, expect, it } from 'vitest';
import { STANDARD_ARRAY, rollAttributeScore, rollAttributeScores } from './attributeGeneration';

// d6 determinístico: random() = (face - 1) / 6 produz a face escolhida.
const faces = (...values: number[]) => {
  let i = 0;
  return () => (values[i++] - 1) / 6;
};

describe('STANDARD_ARRAY', () => {
  it('é 15, 14, 13, 12, 10, 8', () => {
    expect(STANDARD_ARRAY).toEqual([15, 14, 13, 12, 10, 8]);
  });
});

describe('rollAttributeScore: 4d6 descartando o menor', () => {
  it('soma os três maiores dados', () => {
    expect(rollAttributeScore(faces(6, 5, 4, 1))).toBe(15);
    expect(rollAttributeScore(faces(1, 6, 2, 3))).toBe(11);
  });

  it('com dados iguais, o descartado é um deles', () => {
    expect(rollAttributeScore(faces(3, 3, 3, 3))).toBe(9);
  });

  it('o mínimo é 3 e o máximo é 18', () => {
    expect(rollAttributeScore(faces(1, 1, 1, 1))).toBe(3);
    expect(rollAttributeScore(faces(6, 6, 6, 6))).toBe(18);
  });

  it('rola quatro dados', () => {
    let calls = 0;
    rollAttributeScore(() => {
      calls++;
      return 0;
    });
    expect(calls).toBe(4);
  });

  it('com o sorteio padrão fica sempre entre 3 e 18', () => {
    for (let i = 0; i < 500; i++) {
      const score = rollAttributeScore();
      expect(score).toBeGreaterThanOrEqual(3);
      expect(score).toBeLessThanOrEqual(18);
    }
  });
});

describe('rollAttributeScores', () => {
  it('rola seis valores, na ordem', () => {
    const scores = rollAttributeScores(
      faces(6, 6, 6, 6, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5),
    );
    expect(scores).toEqual([18, 3, 6, 9, 12, 15]);
  });
});
