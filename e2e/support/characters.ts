import type { TablesInsert } from '../../src/types/database.types';

/** Uma ficha pronta para o jogo; `overrides` troca o que o teste quer controlar. */
export function characterRow(
  userId: string,
  overrides: Partial<TablesInsert<'characters'>> = {},
): TablesInsert<'characters'> {
  return {
    user_id: userId,
    name: 'Eliabe',
    tribe: 'Judá',
    vocation: 'Guerreiro',
    level: 1,
    attributes: { for: 14, des: 12, con: 13, int: 10, sab: 10, car: 8 },
    stats: { pv: 11, ca: 11, faith: 50 },
    ...overrides,
  };
}
