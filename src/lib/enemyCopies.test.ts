// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { expandEnemyCopies } from './enemyCopies';

const bandit = {
  name: 'Bandido do Deserto',
  hpMax: 11,
  hpCurrent: 11,
  ca: 12,
  skills: [{ name: 'Ataque Furtivo', description: 'x' }],
};

describe('expandEnemyCopies', () => {
  it('sem quantidade cria um, com o nome intacto', () => {
    expect(expandEnemyCopies(bandit, []).map((e) => e.name)).toEqual(['Bandido do Deserto']);
  });

  it('cria uma ficha por unidade, numerada contra os nomes da sessão', () => {
    const copies = expandEnemyCopies({ ...bandit, quantity: 2 }, ['Bandido do Deserto 1']);
    expect(copies.map((e) => e.name)).toEqual(['Bandido do Deserto 2', 'Bandido do Deserto 3']);
  });

  it('a quantidade não vai para a ficha e as cópias não compartilham objetos', () => {
    const [a, b] = expandEnemyCopies({ ...bandit, quantity: 2 }, []);
    expect(a).not.toHaveProperty('quantity');
    expect(a.skills).toEqual(b.skills);
    expect(a.skills).not.toBe(b.skills);
  });
});
