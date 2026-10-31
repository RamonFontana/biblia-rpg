// O Bálsamo declara no conteúdo que só vale no Descanso Curto (CONTEXT.md, Bálsamo).
import { describe, expect, it } from 'vitest';
import { getBalmDice } from '@/domain/balm';
import { ITEMS_DB } from './items';
import { itemSchema } from './schemas';

describe('itens de uso só no Descanso Curto', () => {
  const restOnly = ITEMS_DB.filter((item) => item.usableOnlyIn === 'short_rest');

  it('só o Bálsamo é de Descanso Curto, e o conteúdo é válido', () => {
    expect(restOnly.map((item) => item.id)).toEqual(['balsamo']);
    expect(itemSchema.safeParse(restOnly[0]).success).toBe(true);
  });

  it('a descrição do Bálsamo dá o dado 1d4', () => {
    expect(getBalmDice(restOnly[0].description, 1)).toBe('1d4');
  });
});
