import { describe, expect, it } from 'vitest';
import { withoutShop } from './draft';

describe('withoutShop', () => {
  it('tira o equipamento e as moedas e mantém o resto', () => {
    const draft = { name: 'Calebe', coins: 5, equipment: [], vocation: 'Guerreiro' };
    expect(withoutShop(draft)).toStrictEqual({ name: 'Calebe', vocation: 'Guerreiro' });
  });

  it('não altera o rascunho original', () => {
    const draft = { name: 'Calebe', coins: 5, equipment: [] };
    withoutShop(draft);
    expect(draft).toStrictEqual({ name: 'Calebe', coins: 5, equipment: [] });
  });
});
