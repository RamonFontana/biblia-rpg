// Inspiração: recurso do Estado Inabalável, uma vez por dia da sessão. Disponível enquanto o
// personagem é Inabalável e não a usou hoje; a comparação com o dia atual devolve-a no dia novo
// sem zerar nada. Termos: CONTEXT.md (Inspiração, Estado de Fé). Regras: docs/regras-base.md, 4.2.
import { describe, expect, it } from 'vitest';
import { getInspirationStatus, type InspirationInput } from '@/domain/inspiration';

const base: InspirationInput = {
  stats: { current_faith: 80 },
  usedDay: null,
  usedSessionId: null,
  sessionId: 's1',
  day: 3,
};
const status = (over: Partial<InspirationInput>) => getInspirationStatus({ ...base, ...over });

describe('getInspirationStatus', () => {
  it('Inabalável que nunca a usou: disponível', () => {
    expect(status({})).toBe('disponivel');
    expect(status({ stats: { current_faith: 70 } })).toBe('disponivel');
  });

  it('usada hoje nesta sessão: usada', () => {
    expect(status({ usedDay: 3, usedSessionId: 's1' })).toBe('usada');
  });

  it('o dia novo a devolve', () => {
    expect(status({ usedDay: 3, usedSessionId: 's1', day: 4 })).toBe('disponivel');
  });

  it('um uso de outra sessão no mesmo número de dia não conta', () => {
    expect(status({ usedDay: 3, usedSessionId: 'outra' })).toBe('disponivel');
    expect(status({ usedDay: 3, usedSessionId: null })).toBe('disponivel');
  });

  it('fora do Inabalável não há Inspiração', () => {
    for (const current_faith of [69, 40, 12, 5, 0]) {
      expect(status({ stats: { current_faith } })).toBeNull();
    }
  });

  it('usada hoje continua marcada como usada mesmo se a Fé caiu', () => {
    expect(status({ stats: { current_faith: 40 }, usedDay: 3, usedSessionId: 's1' })).toBe('usada');
  });

  it('volta ao Inabalável no mesmo dia depois de usada: segue usada', () => {
    expect(status({ stats: { current_faith: 90 }, usedDay: 3, usedSessionId: 's1' })).toBe('usada');
  });

  it('Fé Efetiva não importa: segue a Fé Atual', () => {
    expect(status({ stats: { faith: 75 } })).toBe('disponivel');
  });
});
