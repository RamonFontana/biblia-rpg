// Onde cada item se equipa, a partir do conteúdo (ADR 0003). O elmo vai para a cabeça, o escudo
// para a mão secundária e a arma de duas mãos ocupa as duas.
import { describe, expect, it } from 'vitest';
import { ITEMS_DB } from '@/content/items';
import { getEquipSlot } from './equipment';

describe('getEquipSlot', () => {
  it.each([
    ['couro_cru', 'body'],
    ['lorica', 'body'],
    ['tunica_sagrada', 'body'],
    ['chapeu_couro', 'head'],
    ['elmo_bronze', 'head'],
    ['escudo', 'shield'],
    ['espada_curta', '1h'],
    ['lanca', '1h'],
    ['espada_grande', '2h'],
    ['martelo_guerra', '2h'],
    ['clava_grande', '2h'],
  ])('%s se equipa em %s', (slug, slot) => {
    expect(getEquipSlot(slug)).toBe(slot);
  });

  it('arcos e outras armas "Duas mãos" na descrição ocupam as duas mãos', () => {
    expect(getEquipSlot('arco_curto')).toBe('2h');
    expect(getEquipSlot('arco_longo')).toBe('2h');
  });

  it('consumíveis, utilidades e slugs desconhecidos não se equipam', () => {
    expect(getEquipSlot('tocha')).toBeUndefined();
    expect(getEquipSlot('corda')).toBeUndefined();
    expect(getEquipSlot('nao_existe')).toBeUndefined();
    expect(getEquipSlot(null)).toBeUndefined();
  });

  it('todo item de armadura, escudo ou arma do catálogo tem lugar para equipar', () => {
    const gear = ITEMS_DB.filter((i) => ['Armadura', 'Escudo', 'Arma'].includes(i.type));
    expect(gear.filter((i) => getEquipSlot(i.id) === undefined).map((i) => i.id)).toEqual([]);
  });
});
